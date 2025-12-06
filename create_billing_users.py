#!/usr/bin/env python3
"""
Create billing department user accounts
"""
import sys
from server_py.db.session import SessionLocal
from server_py.models.user import User
from server_py.services.storage import StorageService

def create_billing_users():
    db = SessionLocal()
    
    try:
        print("Creating billing department user accounts...")
        storage = StorageService(db)
        
        # Check if users already exist
        existing_accountant = db.query(User).filter(User.username == "accountant1").first()
        existing_accounts_mgr = db.query(User).filter(User.username == "accountsmgr1").first()
        
        created = []
        
        # Create Accountant (merged cashier + billing officer)
        if not existing_accountant:
            accountant = storage.create_user({
                "username": "accountant1",
                "password": "accountant123",
                "fullName": "John Accountant",
                "role": "accountant",
                "is_active": 1
            })
            created.append("Accountant (accountant1/accountant123)")
            print("✓ Created accountant account")
        else:
            print("✓ Accountant account already exists")
        
        # Create Accounts Manager
        if not existing_accounts_mgr:
            accounts_mgr = storage.create_user({
                "username": "accountsmgr1",
                "password": "manager123",
                "fullName": "Sarah Accounts Manager",
                "role": "accounts_manager",
                "is_active": 1
            })
            created.append("Accounts Manager (accountsmgr1/manager123)")
            print("✓ Created accounts manager account")
        else:
            print("✓ Accounts manager account already exists")
        
        print("\n✅ Billing department users ready!")
        
        if created:
            print("\nNew accounts created:")
            for account in created:
                print(f"  - {account}")
        
        print("\nAll Billing Accounts:")
        print("  1. Accountant: accountant1 / accountant123")
        print("     (Handles: payments, invoices, receipts, discounts <10%)")
        print("  2. Accounts Manager: accountsmgr1 / manager123")
        print("     (Handles: approve discounts 10-30%, reports, disputes)")
        print("  3. Hospital Admin: hospitaladmin / admin123")
        print("     (Full access: pricing, all discounts, all reports)")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    create_billing_users()
