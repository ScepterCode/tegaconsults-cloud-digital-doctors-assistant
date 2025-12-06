#!/usr/bin/env python3
"""Create a hospital admin user for testing"""

from server_py.db.session import SessionLocal
from server_py.services.storage import StorageService

def create_hospital_admin():
    db = SessionLocal()
    try:
        storage = StorageService(db)
        
        # Check if hospital_admin already exists
        existing_users = storage.get_all_users()
        for user in existing_users:
            if user.username == "hospitaladmin":
                print(f"Hospital admin user already exists: {user.username}")
                return
        
        # Create hospital admin user
        new_user = storage.create_user({
            "username": "hospitaladmin",
            "password": "admin123",
            "full_name": "Hospital Administrator",
            "role": "hospital_admin",
            "is_active": 1,
            "hospital_id": None,
            "department_id": None
        })
        
        print(f"✓ Successfully created hospital admin user:")
        print(f"  Username: hospitaladmin")
        print(f"  Password: admin123")
        print(f"  Role: hospital_admin")
        print(f"  Full Name: {new_user.full_name}")
        
    except Exception as e:
        print(f"Error creating hospital admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_hospital_admin()
