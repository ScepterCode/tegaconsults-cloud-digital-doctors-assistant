"""
Update admin user role to system_admin
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///local_dev.db"

from server_py.db.session import SessionLocal
from server_py.models.user import User

def update_admin_role():
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print(f"Found user: {admin_user.username} with role: {admin_user.role}")
            admin_user.role = "system_admin"
            db.commit()
            print(f"✓ Successfully updated {admin_user.username} to role: system_admin")
        else:
            print("Admin user not found!")
    finally:
        db.close()

if __name__ == "__main__":
    update_admin_role()
