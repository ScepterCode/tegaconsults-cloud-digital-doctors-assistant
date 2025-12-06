"""
Create additional staff users: receptionist, lab_tech, and pharmacist
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///local_dev.db"

from server_py.db.session import SessionLocal
from server_py.models.user import User
import uuid

def create_staff_users():
    db = SessionLocal()
    
    try:
        # Get the hospital ID
        hospital_id = "5f98058e-9bd6-4c92-9f8f-13b58b4c36f9"
        
        # Check if users already exist
        existing_receptionist = db.query(User).filter(User.username == "receptionist").first()
        existing_labtech = db.query(User).filter(User.username == "labtech").first()
        existing_pharmacist = db.query(User).filter(User.username == "pharmacist").first()
        
        users_created = []
        
        # Create Receptionist
        if not existing_receptionist:
            receptionist = User(
                id=str(uuid.uuid4()),
                username="receptionist",
                password="recept123",
                full_name="Mary Receptionist",
                role="receptionist",
                hospital_id=hospital_id,
                is_active=1
            )
            db.add(receptionist)
            users_created.append("receptionist")
            print(f"✓ Created receptionist user")
            print(f"  Username: receptionist")
            print(f"  Password: recept123")
            print(f"  Role: receptionist")
        else:
            print("✗ Receptionist user already exists")
        
        # Create Lab Technician/Scientist
        if not existing_labtech:
            labtech = User(
                id=str(uuid.uuid4()),
                username="labtech",
                password="lab123",
                full_name="Dr. John Lab Scientist",
                role="lab_tech",
                hospital_id=hospital_id,
                is_active=1
            )
            db.add(labtech)
            users_created.append("labtech")
            print(f"✓ Created lab technician user")
            print(f"  Username: labtech")
            print(f"  Password: lab123")
            print(f"  Role: lab_tech")
        else:
            print("✗ Lab technician user already exists")
        
        # Create Pharmacist
        if not existing_pharmacist:
            pharmacist = User(
                id=str(uuid.uuid4()),
                username="pharmacist",
                password="pharm123",
                full_name="Sarah Pharmacist",
                role="pharmacist",
                hospital_id=hospital_id,
                is_active=1
            )
            db.add(pharmacist)
            users_created.append("pharmacist")
            print(f"✓ Created pharmacist user")
            print(f"  Username: pharmacist")
            print(f"  Password: pharm123")
            print(f"  Role: pharmacist")
        else:
            print("✗ Pharmacist user already exists")
        
        if users_created:
            db.commit()
            print(f"\n✓ Successfully created {len(users_created)} new staff users!")
        else:
            print("\n✓ All staff users already exist!")
        
        # Display all staff
        print("\n" + "="*60)
        print("ALL STAFF USERS IN DATABASE:")
        print("="*60)
        
        all_staff = db.query(User).filter(
            User.role.in_(["receptionist", "lab_tech", "pharmacist", "doctor", "nurse", "accountant", "accounts_manager"])
        ).all()
        
        for staff in all_staff:
            print(f"\n{staff.full_name}")
            print(f"  Username: {staff.username}")
            print(f"  Role: {staff.role}")
            print(f"  Hospital ID: {staff.hospital_id}")
            print(f"  Active: {'Yes' if staff.is_active else 'No'}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_staff_users()
