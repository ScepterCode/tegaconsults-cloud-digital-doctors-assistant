#!/usr/bin/env python3
"""
Create billing system tables
"""
import sys
from server_py.db.session import engine, Base
from server_py.models.billing import (
    ServicePricing, PatientBill, BillItem, Payment, Receipt, BillingAudit
)

def migrate_billing():
    try:
        print("Creating billing system tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Billing system tables created successfully!")
        print("\nTables created:")
        print("  - service_pricing")
        print("  - patient_bills")
        print("  - bill_items")
        print("  - payments")
        print("  - receipts")
        print("  - billing_audit")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_billing()
