from sqlalchemy.orm import Session
from ..models.user import User, ProjectRole, GlobalRole, ProjectRoleType
from ..schemas.user import UserCreate, UserUpdate, ProjectRoleCreate, ProjectRoleUpdate
from ..core.security import hash_password, verify_password
from ..core.permissions import RolePermissions

# User CRUD
def list_users(db: Session):
    return db.query(User).order_by(User.name).all()

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, data: UserCreate):
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        global_role=data.global_role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_super_admin(db: Session, name: str = "Super Admin", email: str = "admin@scrumboard.com", password: str = "admin123"):
    """Create the default Super Admin user if it doesn't exist"""
    existing_admin = db.query(User).filter(User.global_role == GlobalRole.SUPER_ADMIN).first()
    if existing_admin:
        return existing_admin

    admin = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        global_role=GlobalRole.SUPER_ADMIN
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

def authenticate_user(db: Session, email: str, password: str):
    """Authenticate user by email and password."""
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def update_user(db: Session, user_id: int, data: UserUpdate, current_user: User = None):
    user = get_user(db, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")

    # Check if current user can update this user
    if current_user and not RolePermissions.can_assign_role(current_user.global_role, data.global_role or user.global_role):
        raise ValueError("Insufficient permissions to assign this role")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")
    db.delete(user)
    db.commit()

# Project Role CRUD
def get_project_role(db: Session, user_id: int, project_id: int):
    return db.query(ProjectRole).filter(
        ProjectRole.user_id == user_id,
        ProjectRole.project_id == project_id
    ).first()

def assign_role(db: Session, data: ProjectRoleCreate, assigned_by: User = None):
    # Check if user already has a role in this project
    existing_role = get_project_role(db, data.user_id, data.project_id)
    if existing_role:
        existing_role.role = data.role
        existing_role.permissions = data.permissions
        existing_role.assigned_by = assigned_by.id if assigned_by else None
        db.commit()
        db.refresh(existing_role)
        return existing_role

    role = ProjectRole(
        user_id=data.user_id,
        project_id=data.project_id,
        role=data.role,
        permissions=data.permissions,
        assigned_by=assigned_by.id if assigned_by else None
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def update_role(db: Session, role_id: int, data: ProjectRoleUpdate):
    role = db.query(ProjectRole).filter(ProjectRole.id == role_id).first()
    if not role:
        raise ValueError(f"Project role {role_id} not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(role, k, v)
    db.commit()
    db.refresh(role)
    return role

def delete_role(db: Session, role_id: int):
    role = db.query(ProjectRole).filter(ProjectRole.id == role_id).first()
    if not role:
        raise ValueError(f"Project role {role_id} not found")
    db.delete(role)
    db.commit()

def get_user_permissions(db: Session, user_id: int, project_id: int = None):
    """Get all permissions for a user, optionally for a specific project"""
    user = get_user(db, user_id)
    if not user:
        return set()

    permissions = RolePermissions.get_global_permissions(user.global_role)

    if project_id:
        project_role = get_project_role(db, user_id, project_id)
        if project_role:
            project_permissions = RolePermissions.get_project_permissions(project_role.role)
            permissions.update(project_permissions)

    return permissions

def can_user_perform_action(db: Session, user_id: int, action: str, project_id: int = None):
    """Check if user can perform a specific action"""
    from ..core.permissions import Permission

    user = get_user(db, user_id)
    if not user:
        return False

    # Map action to permission
    action_map = {
        "create": Permission.CREATE_WORK_ITEM,
        "update": Permission.UPDATE_WORK_ITEM,
        "delete": Permission.DELETE_WORK_ITEM,
        "view": Permission.READ_WORK_ITEM,
        "create_user": Permission.CREATE_USER,
        "update_user": Permission.UPDATE_USER,
        "delete_user": Permission.DELETE_USER,
        "manage_users": Permission.MANAGE_USER_ROLES,
        "create_project": Permission.CREATE_PROJECT,
        "update_project": Permission.UPDATE_PROJECT,
        "delete_project": Permission.DELETE_PROJECT,
        "create_team": Permission.CREATE_TEAM,
        "update_team": Permission.UPDATE_TEAM,
        "delete_team": Permission.DELETE_TEAM,
        "create_sprint": Permission.CREATE_SPRINT,
        "update_sprint": Permission.UPDATE_SPRINT,
        "delete_sprint": Permission.DELETE_SPRINT,
        "view_reports": Permission.VIEW_REPORTS,
        "system_settings": Permission.SYSTEM_SETTINGS
    }

    permission = action_map.get(action)
    if not permission:
        return False

    permissions = get_user_permissions(db, user_id, project_id)
    return permission in permissions
    db.commit()

# ProjectRole CRUD
def get_project_role(db: Session, user_id: int, project_id: int):
    return db.query(ProjectRole).filter(ProjectRole.user_id == user_id, ProjectRole.project_id == project_id).first()

def assign_role(db: Session, data: ProjectRoleCreate):
    role = ProjectRole(**data.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def update_role(db: Session, role_id: int, data: ProjectRoleUpdate):
    role = db.query(ProjectRole).filter(ProjectRole.id == role_id).first()
    if not role:
        raise ValueError(f"Role {role_id} not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(role, k, v)
    db.commit()
    db.refresh(role)
    return role

def delete_role(db: Session, role_id: int):
    role = db.query(ProjectRole).filter(ProjectRole.id == role_id).first()
    if not role:
        raise ValueError(f"Role {role_id} not found")
    db.delete(role)
    db.commit()
