#!/usr/bin/env python3
"""
Get the correct hospital ID to use in frontend
"""
from server_py.db.session import SessionLocal
from server_py.models.hospital import Hospital

def get_hospital_id():
    db = SessionLocal()
    try:
        hospital = db.query(Hospital).first()
        if hospital:
            print(f"Hospital ID: {hospital.id}")
            print(f"Hospital Name: {hospital.name}")
            print(f"\nUse this ID in your frontend files:")
            print(f'const hospitalId = "{hospital.id}";')
        else:
            print("No hospital found in database")
    finally:
        db.close()

if __name__ == "__main__":
    get_hospital_id()
