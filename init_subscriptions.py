#!/usr/bin/env python3
"""
Initialize subscription system with default pricing
"""
import sys
from datetime import datetime, timedelta
from server_py.db.session import SessionLocal
from server_py.models.subscription import Subscription, SubscriptionPricing
from server_py.models.hospital import Hospital

def init_subscriptions():
    db = SessionLocal()
    
    try:
        print("Initializing subscription system...")
        
        # Create default pricing
        monthly = db.query(SubscriptionPricing).filter(
            SubscriptionPricing.plan_type == "monthly"
        ).first()
        
        if not monthly:
            monthly = SubscriptionPricing(
                plan_type="monthly",
                price=150000.0,
                currency="NGN",
                description="Monthly subscription plan"
            )
            db.add(monthly)
            print("✓ Created monthly pricing: ₦150,000")
        else:
            print("✓ Monthly pricing already exists")
        
        yearly = db.query(SubscriptionPricing).filter(
            SubscriptionPricing.plan_type == "yearly"
        ).first()
        
        if not yearly:
            yearly = SubscriptionPricing(
                plan_type="yearly",
                price=1400000.0,
                currency="NGN",
                description="Yearly subscription plan (save ₦400,000)"
            )
            db.add(yearly)
            print("✓ Created yearly pricing: ₦1,400,000")
        else:
            print("✓ Yearly pricing already exists")
        
        db.commit()
        
        # Create trial subscriptions for all hospitals
        hospitals = db.query(Hospital).all()
        print(f"\nFound {len(hospitals)} hospitals")
        
        for hospital in hospitals:
            existing = db.query(Subscription).filter(
                Subscription.hospital_id == hospital.id
            ).first()
            
            if not existing:
                trial_end = datetime.now() + timedelta(days=60)
                subscription = Subscription(
                    hospital_id=hospital.id,
                    plan_type="trial",
                    status="trial",
                    trial_start_date=datetime.now(),
                    trial_end_date=trial_end
                )
                db.add(subscription)
                print(f"✓ Created 60-day trial for: {hospital.name}")
            else:
                print(f"✓ Subscription exists for: {hospital.name} ({existing.status})")
        
        db.commit()
        
        print("\n✅ Subscription system initialized successfully!")
        print("\nDefault Pricing:")
        print("  Monthly: ₦150,000")
        print("  Yearly:  ₦1,400,000 (save ₦400,000)")
        print("\nAll hospitals have been given a 60-day trial period.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    init_subscriptions()
