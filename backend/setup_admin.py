#!/usr/bin/env python
"""Setup script to create the Super Admin user"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.db import Base
from app.models.user import User, GlobalRole
from app.core.security import hash_password

DATABASE_URL = "postgresql://postgres:password-1@localhost:5432/ScrumBoard"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_super_admin():
    """Create the Super Admin user"""
    db = SessionLocal()

    try:
        # Check if Super Admin already exists
        existing_admin = db.query(User).filter(User.global_role == GlobalRole.SUPER_ADMIN).first()
        if existing_admin:
            print(f"Super Admin already exists: {existing_admin.name} ({existing_admin.email})")
            return

        # Create Super Admin
        super_admin = User(
            name="Super Admin",
            email="admin@scrumboard.com",
            password_hash=hash_password("admin123"),
            global_role=GlobalRole.SUPER_ADMIN,
            is_active=True
        )

        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)

        print("✅ Super Admin created successfully!")
        print(f"   Name: {super_admin.name}")
        print(f"   Email: {super_admin.email}")
        print(f"   Password: admin123")
        print(f"   Role: {super_admin.global_role.value}")
        print("\n⚠️  IMPORTANT: Change the default password after first login!")

    except Exception as e:
        print(f"❌ Error creating Super Admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Setting up Super Admin user...")
    setup_super_admin()
    print("Setup complete!")