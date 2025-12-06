#!/usr/bin/env python3
"""
Update accountant1 user to have accountant role
"""
import sys
from server_py.db.session import SessionLocal
from server_py.models.user import User

def update_accountant_role():
    db = SessionLocal()
    
    try:
        print("Updating accountant1 role...")
        
        # Find accountant1 user
        user = db.query(User).filter(User.username == "accountant1").first()
        
        if user:
            old_role = user.role
            user.role = "accountant"
            db.commit()
            print(f"✓ Updated accountant1 role from '{old_role}' to 'accountant'")
        else:
            print("✗ User accountant1 not found")
        
        print("\n✅ Role update complete!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    update_accountant_role()
