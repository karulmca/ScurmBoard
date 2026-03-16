"""
Role-based access control and permissions system
"""
from enum import Enum
from typing import Dict, List, Set
from .user import GlobalRole, ProjectRoleType

class Permission(Enum):
    """System-wide permissions"""
    # User management
    CREATE_USER = "create_user"
    READ_USER = "read_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    MANAGE_USER_ROLES = "manage_user_roles"

    # Project management
    CREATE_PROJECT = "create_project"
    READ_PROJECT = "read_project"
    UPDATE_PROJECT = "update_project"
    DELETE_PROJECT = "delete_project"
    MANAGE_PROJECT_SETTINGS = "manage_project_settings"

    # Work item management
    CREATE_WORK_ITEM = "create_work_item"
    READ_WORK_ITEM = "read_work_item"
    UPDATE_WORK_ITEM = "update_work_item"
    DELETE_WORK_ITEM = "delete_work_item"
    ASSIGN_WORK_ITEM = "assign_work_item"

    # Sprint management
    CREATE_SPRINT = "create_sprint"
    READ_SPRINT = "read_sprint"
    UPDATE_SPRINT = "update_sprint"
    DELETE_SPRINT = "delete_sprint"
    MANAGE_SPRINT_CAPACITY = "manage_sprint_capacity"

    # Team management
    CREATE_TEAM = "create_team"
    READ_TEAM = "read_team"
    UPDATE_TEAM = "update_team"
    DELETE_TEAM = "delete_team"
    MANAGE_TEAM_MEMBERS = "manage_team_members"

    # Reporting
    VIEW_REPORTS = "view_reports"
    CREATE_REPORTS = "create_reports"
    EXPORT_DATA = "export_data"

    # System administration
    SYSTEM_SETTINGS = "system_settings"
    AUDIT_LOGS = "audit_logs"
    BACKUP_DATA = "backup_data"

class RolePermissions:
    """Defines permissions for each role"""

    @staticmethod
    def get_global_permissions(role: GlobalRole) -> Set[Permission]:
        """Get permissions for a global role"""
        permissions_map = {
            GlobalRole.SUPER_ADMIN: {
                # All permissions
                Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
                Permission.MANAGE_USER_ROLES, Permission.CREATE_PROJECT, Permission.READ_PROJECT,
                Permission.UPDATE_PROJECT, Permission.DELETE_PROJECT, Permission.MANAGE_PROJECT_SETTINGS,
                Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM,
                Permission.DELETE_WORK_ITEM, Permission.ASSIGN_WORK_ITEM, Permission.CREATE_SPRINT,
                Permission.READ_SPRINT, Permission.UPDATE_SPRINT, Permission.DELETE_SPRINT,
                Permission.MANAGE_SPRINT_CAPACITY, Permission.CREATE_TEAM, Permission.READ_TEAM,
                Permission.UPDATE_TEAM, Permission.DELETE_TEAM, Permission.MANAGE_TEAM_MEMBERS,
                Permission.VIEW_REPORTS, Permission.CREATE_REPORTS, Permission.EXPORT_DATA,
                Permission.SYSTEM_SETTINGS, Permission.AUDIT_LOGS, Permission.BACKUP_DATA
            },
            GlobalRole.ADMIN: {
                Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER,
                Permission.MANAGE_USER_ROLES, Permission.CREATE_PROJECT, Permission.READ_PROJECT,
                Permission.UPDATE_PROJECT, Permission.DELETE_PROJECT, Permission.MANAGE_PROJECT_SETTINGS,
                Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM,
                Permission.DELETE_WORK_ITEM, Permission.ASSIGN_WORK_ITEM, Permission.CREATE_SPRINT,
                Permission.READ_SPRINT, Permission.UPDATE_SPRINT, Permission.DELETE_SPRINT,
                Permission.MANAGE_SPRINT_CAPACITY, Permission.CREATE_TEAM, Permission.READ_TEAM,
                Permission.UPDATE_TEAM, Permission.DELETE_TEAM, Permission.MANAGE_TEAM_MEMBERS,
                Permission.VIEW_REPORTS, Permission.CREATE_REPORTS, Permission.EXPORT_DATA,
                Permission.AUDIT_LOGS
            },
            GlobalRole.PROJECT_MANAGER: {
                Permission.CREATE_PROJECT, Permission.READ_PROJECT, Permission.UPDATE_PROJECT,
                Permission.MANAGE_PROJECT_SETTINGS, Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM,
                Permission.UPDATE_WORK_ITEM, Permission.DELETE_WORK_ITEM, Permission.ASSIGN_WORK_ITEM,
                Permission.CREATE_SPRINT, Permission.READ_SPRINT, Permission.UPDATE_SPRINT,
                Permission.DELETE_SPRINT, Permission.MANAGE_SPRINT_CAPACITY, Permission.CREATE_TEAM,
                Permission.READ_TEAM, Permission.UPDATE_TEAM, Permission.MANAGE_TEAM_MEMBERS,
                Permission.VIEW_REPORTS, Permission.CREATE_REPORTS
            },
            GlobalRole.SCRUM_MASTER: {
                Permission.READ_PROJECT, Permission.UPDATE_PROJECT, Permission.CREATE_WORK_ITEM,
                Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM, Permission.ASSIGN_WORK_ITEM,
                Permission.CREATE_SPRINT, Permission.READ_SPRINT, Permission.UPDATE_SPRINT,
                Permission.MANAGE_SPRINT_CAPACITY, Permission.READ_TEAM, Permission.UPDATE_TEAM,
                Permission.MANAGE_TEAM_MEMBERS, Permission.VIEW_REPORTS
            },
            GlobalRole.ARCHITECT: {
                Permission.READ_PROJECT, Permission.UPDATE_PROJECT, Permission.CREATE_WORK_ITEM,
                Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM, Permission.READ_TEAM,
                Permission.VIEW_REPORTS
            },
            GlobalRole.LEAD: {
                Permission.READ_PROJECT, Permission.UPDATE_PROJECT, Permission.CREATE_WORK_ITEM,
                Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM, Permission.ASSIGN_WORK_ITEM,
                Permission.READ_SPRINT, Permission.UPDATE_SPRINT, Permission.READ_TEAM,
                Permission.UPDATE_TEAM, Permission.VIEW_REPORTS
            },
            GlobalRole.DEVELOPER: {
                Permission.READ_PROJECT, Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM,
                Permission.UPDATE_WORK_ITEM, Permission.READ_SPRINT, Permission.READ_TEAM,
                Permission.VIEW_REPORTS
            },
            GlobalRole.QA: {
                Permission.READ_PROJECT, Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM,
                Permission.UPDATE_WORK_ITEM, Permission.READ_SPRINT, Permission.READ_TEAM,
                Permission.VIEW_REPORTS
            },
            GlobalRole.BUSINESS_ANALYST: {
                Permission.READ_PROJECT, Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM,
                Permission.UPDATE_WORK_ITEM, Permission.READ_SPRINT, Permission.READ_TEAM,
                Permission.VIEW_REPORTS, Permission.CREATE_REPORTS
            },
            GlobalRole.BUSINESS: {
                Permission.READ_PROJECT, Permission.READ_WORK_ITEM, Permission.READ_SPRINT,
                Permission.READ_TEAM, Permission.VIEW_REPORTS
            }
        }
        return permissions_map.get(role, set())

    @staticmethod
    def get_project_permissions(role: ProjectRoleType) -> Set[Permission]:
        """Get permissions for a project-specific role"""
        permissions_map = {
            ProjectRoleType.OWNER: {
                Permission.UPDATE_PROJECT, Permission.MANAGE_PROJECT_SETTINGS, Permission.CREATE_WORK_ITEM,
                Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM, Permission.DELETE_WORK_ITEM,
                Permission.ASSIGN_WORK_ITEM, Permission.CREATE_SPRINT, Permission.READ_SPRINT,
                Permission.UPDATE_SPRINT, Permission.DELETE_SPRINT, Permission.MANAGE_SPRINT_CAPACITY,
                Permission.UPDATE_TEAM, Permission.MANAGE_TEAM_MEMBERS, Permission.VIEW_REPORTS
            },
            ProjectRoleType.ADMIN: {
                Permission.UPDATE_PROJECT, Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM,
                Permission.UPDATE_WORK_ITEM, Permission.DELETE_WORK_ITEM, Permission.ASSIGN_WORK_ITEM,
                Permission.CREATE_SPRINT, Permission.READ_SPRINT, Permission.UPDATE_SPRINT,
                Permission.DELETE_SPRINT, Permission.UPDATE_TEAM, Permission.MANAGE_TEAM_MEMBERS,
                Permission.VIEW_REPORTS
            },
            ProjectRoleType.SCRUM_MASTER: {
                Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM,
                Permission.ASSIGN_WORK_ITEM, Permission.CREATE_SPRINT, Permission.READ_SPRINT,
                Permission.UPDATE_SPRINT, Permission.MANAGE_SPRINT_CAPACITY, Permission.UPDATE_TEAM,
                Permission.MANAGE_TEAM_MEMBERS, Permission.VIEW_REPORTS
            },
            ProjectRoleType.DEVELOPER: {
                Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM,
                Permission.READ_SPRINT, Permission.READ_TEAM, Permission.VIEW_REPORTS
            },
            ProjectRoleType.QA: {
                Permission.CREATE_WORK_ITEM, Permission.READ_WORK_ITEM, Permission.UPDATE_WORK_ITEM,
                Permission.READ_SPRINT, Permission.READ_TEAM, Permission.VIEW_REPORTS
            },
            ProjectRoleType.VIEWER: {
                Permission.READ_WORK_ITEM, Permission.READ_SPRINT, Permission.READ_TEAM, Permission.VIEW_REPORTS
            }
        }
        return permissions_map.get(role, set())

    @staticmethod
    def has_permission(user_global_role: GlobalRole, user_project_role: ProjectRoleType = None,
                      permission: Permission = None) -> bool:
        """Check if user has a specific permission"""
        if not permission:
            return True

        # Check global permissions
        global_perms = RolePermissions.get_global_permissions(user_global_role)
        if permission in global_perms:
            return True

        # Check project-specific permissions if project role is provided
        if user_project_role:
            project_perms = RolePermissions.get_project_permissions(user_project_role)
            if permission in project_perms:
                return True

        return False

    @staticmethod
    def can_manage_users(user_global_role: GlobalRole) -> bool:
        """Check if user can manage other users"""
        return user_global_role in [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN]

    @staticmethod
    def can_manage_projects(user_global_role: GlobalRole) -> bool:
        """Check if user can manage projects"""
        return user_global_role in [GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN, GlobalRole.PROJECT_MANAGER]

    @staticmethod
    def can_manage_system(user_global_role: GlobalRole) -> bool:
        """Check if user can manage system settings"""
        return user_global_role == GlobalRole.SUPER_ADMIN

    @staticmethod
    def get_role_hierarchy() -> Dict[GlobalRole, int]:
        """Get role hierarchy levels (higher number = more permissions)"""
        return {
            GlobalRole.SUPER_ADMIN: 10,
            GlobalRole.ADMIN: 9,
            GlobalRole.PROJECT_MANAGER: 8,
            GlobalRole.ARCHITECT: 7,
            GlobalRole.LEAD: 6,
            GlobalRole.SCRUM_MASTER: 5,
            GlobalRole.DEVELOPER: 4,
            GlobalRole.QA: 4,
            GlobalRole.BUSINESS_ANALYST: 3,
            GlobalRole.BUSINESS: 2
        }

    @staticmethod
    def can_assign_role(assigner_role: GlobalRole, target_role: GlobalRole) -> bool:
        """Check if a user can assign a role to another user"""
        hierarchy = RolePermissions.get_role_hierarchy()
        return hierarchy.get(assigner_role, 0) >= hierarchy.get(target_role, 0)

# Legacy function for backward compatibility
def check_role_permission(db: Session, user_id: int, project_id: int, action: str):
    """Legacy function - kept for backward compatibility"""
    from fastapi import HTTPException
    from ..models.user import ProjectRole

    role = db.query(ProjectRole).filter(ProjectRole.user_id == user_id, ProjectRole.project_id == project_id).first()
    if not role:
        raise HTTPException(status_code=403, detail="No role assigned for this project")

    # Map legacy actions to permissions
    action_map = {
        "create": Permission.CREATE_WORK_ITEM,
        "update": Permission.UPDATE_WORK_ITEM,
        "delete": Permission.DELETE_WORK_ITEM,
        "view": Permission.READ_WORK_ITEM
    }

    permission = action_map.get(action)
    if not permission:
        raise HTTPException(status_code=403, detail=f"Unknown action: {action}")

    # For now, allow all actions - this will be updated with proper role checking
    return True
