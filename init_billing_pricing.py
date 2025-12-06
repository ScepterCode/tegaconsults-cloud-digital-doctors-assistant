#!/usr/bin/env python3
"""
Initialize billing system with default Nigerian hospital pricing
"""
import sys
from server_py.db.session import SessionLocal
from server_py.models.billing import ServicePricing
from server_py.models.hospital import Hospital

# Default pricing for Nigerian hospitals
DEFAULT_PRICING = [
    # Consultation Fees
    {"category": "consultation", "name": "General Consultation", "price": 7500},
    {"category": "consultation", "name": "Specialist Consultation", "price": 20000},
    {"category": "consultation", "name": "Emergency Consultation", "price": 35000},
    {"category": "consultation", "name": "Follow-up Visit", "price": 4000},
    {"category": "consultation", "name": "Telemedicine Consultation", "price": 5000},
    
    # Laboratory Tests - Blood
    {"category": "laboratory", "name": "Complete Blood Count (CBC)", "price": 3000},
    {"category": "laboratory", "name": "Blood Sugar (Fasting)", "price": 1500},
    {"category": "laboratory", "name": "Blood Sugar (Random)", "price": 1200},
    {"category": "laboratory", "name": "Lipid Profile", "price": 5000},
    {"category": "laboratory", "name": "Liver Function Test", "price": 8000},
    {"category": "laboratory", "name": "Kidney Function Test", "price": 7000},
    {"category": "laboratory", "name": "Thyroid Function Test", "price": 10000},
    {"category": "laboratory", "name": "HIV Test", "price": 3000},
    {"category": "laboratory", "name": "Hepatitis B Test", "price": 4000},
    {"category": "laboratory", "name": "Malaria Test", "price": 1500},
    
    # Laboratory Tests - Imaging
    {"category": "laboratory", "name": "X-Ray (Chest)", "price": 8000},
    {"category": "laboratory", "name": "X-Ray (Limb)", "price": 10000},
    {"category": "laboratory", "name": "Ultrasound (Abdomen)", "price": 15000},
    {"category": "laboratory", "name": "Ultrasound (Pregnancy)", "price": 12000},
    {"category": "laboratory", "name": "CT Scan", "price": 75000},
    {"category": "laboratory", "name": "MRI Scan", "price": 120000},
    {"category": "laboratory", "name": "ECG", "price": 5000},
    {"category": "laboratory", "name": "Echocardiogram", "price": 25000},
    
    # Laboratory Tests - Microbiology
    {"category": "laboratory", "name": "Urinalysis", "price": 2000},
    {"category": "laboratory", "name": "Stool Analysis", "price": 2500},
    {"category": "laboratory", "name": "Culture & Sensitivity", "price": 8000},
    {"category": "laboratory", "name": "Pregnancy Test", "price": 1500},
    
    # Pharmacy
    {"category": "pharmacy", "name": "Dispensing Fee", "price": 500},
    {"category": "pharmacy", "name": "Compounding Fee", "price": 1000},
    {"category": "pharmacy", "name": "Injection Administration", "price": 1000},
    
    # Ward/Admission - Bed Charges (per day)
    {"category": "ward", "name": "General Ward Bed (per day)", "price": 7500},
    {"category": "ward", "name": "Private Room (per day)", "price": 20000},
    {"category": "ward", "name": "ICU Bed (per day)", "price": 75000},
    {"category": "ward", "name": "NICU Bed (per day)", "price": 90000},
    {"category": "ward", "name": "Nursing Care (per day)", "price": 4000},
    {"category": "ward", "name": "Feeding (per day)", "price": 3000},
    
    # Procedures - Minor
    {"category": "procedure", "name": "Wound Dressing", "price": 3000},
    {"category": "procedure", "name": "Suturing", "price": 5000},
    {"category": "procedure", "name": "IV Cannulation", "price": 2000},
    {"category": "procedure", "name": "Catheterization", "price": 4000},
    {"category": "procedure", "name": "Nebulization", "price": 2500},
    {"category": "procedure", "name": "Blood Transfusion", "price": 15000},
    
    # Procedures - Major
    {"category": "procedure", "name": "Appendectomy", "price": 250000},
    {"category": "procedure", "name": "Cesarean Section", "price": 300000},
    {"category": "procedure", "name": "Hernia Repair", "price": 200000},
    {"category": "procedure", "name": "Tonsillectomy", "price": 150000},
    {"category": "procedure", "name": "Circumcision", "price": 50000},
    
    # Procedures - Specialized
    {"category": "procedure", "name": "Dialysis Session", "price": 65000},
    {"category": "procedure", "name": "Physiotherapy Session", "price": 7500},
    {"category": "procedure", "name": "Dental Extraction", "price": 10000},
    {"category": "procedure", "name": "Dental Filling", "price": 15000},
    
    # Administrative Fees
    {"category": "admin", "name": "Registration Fee", "price": 1000},
    {"category": "admin", "name": "Card/Folder Fee", "price": 1000},
    {"category": "admin", "name": "Medical Report", "price": 7500},
    {"category": "admin", "name": "Medical Certificate", "price": 4000},
    {"category": "admin", "name": "Referral Letter", "price": 2000},
    {"category": "admin", "name": "Medical Records Copy (per page)", "price": 500},
    
    # Emergency Services
    {"category": "emergency", "name": "Emergency Room Fee", "price": 15000},
    {"category": "emergency", "name": "Ambulance Service (Local)", "price": 25000},
    {"category": "emergency", "name": "Ambulance Service (Inter-city)", "price": 50000},
    {"category": "emergency", "name": "Emergency Procedure Surcharge (50%)", "price": 0},  # Calculated
]

def init_billing_pricing():
    db = SessionLocal()
    
    try:
        print("Initializing billing system with default pricing...")
        
        # Get all hospitals
        hospitals = db.query(Hospital).all()
        print(f"\nFound {len(hospitals)} hospitals")
        
        if len(hospitals) == 0:
            print("⚠️  No hospitals found. Please create a hospital first.")
            return
        
        for hospital in hospitals:
            print(f"\nSetting up pricing for: {hospital.name}")
            
            # Check if pricing already exists
            existing = db.query(ServicePricing).filter(
                ServicePricing.hospital_id == hospital.id
            ).count()
            
            if existing > 0:
                print(f"  ✓ Pricing already exists ({existing} services)")
                continue
            
            # Create pricing for this hospital
            count = 0
            for service in DEFAULT_PRICING:
                pricing = ServicePricing(
                    hospital_id=hospital.id,
                    service_category=service["category"],
                    service_name=service["name"],
                    base_price=service["price"],
                    insurance_price=service["price"] * 0.8,  # 20% discount for insurance
                    staff_price=service["price"] * 0.5,  # 50% discount for staff
                    description=f"Standard {service['category']} service"
                )
                db.add(pricing)
                count += 1
            
            db.commit()
            print(f"  ✓ Created {count} service pricing entries")
        
        print("\n✅ Billing system initialized successfully!")
        print("\nPricing Summary:")
        print("  - Consultations: ₦4,000 - ₦35,000")
        print("  - Lab Tests: ₦1,200 - ₦120,000")
        print("  - Ward Charges: ₦3,000 - ₦90,000/day")
        print("  - Procedures: ₦2,000 - ₦300,000")
        print("  - Admin Fees: ₦500 - ₦7,500")
        print("\nAll prices are configurable by hospital admins.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    init_billing_pricing()
