#!/usr/bin/env python3
"""
Create pharmacy inventory tables
"""
import sys
from server_py.db.session import engine, Base
from server_py.models.pharmacy_inventory import PharmacyInventory, InventoryTransaction

def migrate_pharmacy_inventory():
    try:
        print("Creating pharmacy inventory tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Pharmacy inventory tables created successfully!")
        print("\nTables created:")
        print("  - pharmacy_inventory")
        print("  - inventory_transactions")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_pharmacy_inventory()
