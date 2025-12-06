#!/usr/bin/env python3
"""
Create subscription tables in the database
"""
import sys
from server_py.db.session import engine, Base
from server_py.models.subscription import Subscription, SubscriptionPricing, PaymentHistory

def migrate_subscriptions():
    try:
        print("Creating subscription tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Subscription tables created successfully!")
        print("\nTables created:")
        print("  - subscriptions")
        print("  - subscription_pricing")
        print("  - payment_history")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_subscriptions()
