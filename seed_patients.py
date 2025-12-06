"""
Seed database with 20 diverse patients with realistic medical histories
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///local_dev.db"

from server_py.db.session import SessionLocal
from server_py.models.patient import Patient
from datetime import datetime, timedelta
import uuid
import random

def seed_patients():
    db = SessionLocal()
    
    try:
        hospital_id = "5f98058e-9bd6-4c92-9f8f-13b58b4c36f9"
        
        # Check if patients already exist
        existing_count = db.query(Patient).count()
        if existing_count >= 20:
            print(f"✓ Database already has {existing_count} patients. Skipping seed.")
            return
        
        patients_data = [
            {
                "full_name": "Adebayo Okonkwo",
                "date_of_birth": "1985-03-15",
                "gender": "male",
                "phone": "+234 803 456 7890",
                "email": "adebayo.okonkwo@email.com",
                "address": "12 Allen Avenue, Ikeja, Lagos",
                "blood_group": "O+",
                "genotype": "AA",
                "allergies": "Penicillin",
                "chronic_conditions": "Hypertension",
                "emergency_contact": "Mrs. Okonkwo - 0803 456 7891",
                "medical_history": "Diagnosed with hypertension 3 years ago. Currently on Amlodipine 5mg daily. Regular checkups every 3 months."
            },
            {
                "full_name": "Fatima Mohammed",
                "date_of_birth": "1992-07-22",
                "gender": "female",
                "phone": "+234 805 123 4567",
                "email": "fatima.m@email.com",
                "address": "45 Ahmadu Bello Way, Kaduna",
                "blood_group": "A+",
                "genotype": "AS",
                "allergies": "None",
                "chronic_conditions": "Asthma",
                "emergency_contact": "Alhaji Mohammed - 0805 123 4568",
                "medical_history": "Childhood asthma, well controlled with Salbutamol inhaler. Last attack was 2 years ago. Avoids cold weather triggers."
            },
            {
                "full_name": "Chidinma Nwosu",
                "date_of_birth": "2015-11-08",
                "gender": "female",
                "phone": "+234 806 789 0123",
                "email": "nwosu.family@email.com",
                "address": "78 Aba Road, Port Harcourt",
                "blood_group": "B+",
                "genotype": "AA",
                "allergies": "Peanuts, Shellfish",
                "chronic_conditions": "None",
                "emergency_contact": "Mrs. Nwosu (Mother) - 0806 789 0124",
                "medical_history": "8-year-old child. Up to date with immunizations. Severe food allergies discovered at age 3. Carries EpiPen."
            },
            {
                "full_name": "Emmanuel Okafor",
                "date_of_birth": "1978-01-30",
                "gender": "male",
                "phone": "+234 807 234 5678",
                "email": "e.okafor@email.com",
                "address": "23 Independence Layout, Enugu",
                "blood_group": "AB+",
                "genotype": "AA",
                "allergies": "Sulfa drugs",
                "chronic_conditions": "Type 2 Diabetes, Hypertension",
                "emergency_contact": "Dr. Okafor (Brother) - 0807 234 5679",
                "medical_history": "Type 2 Diabetes diagnosed 5 years ago. On Metformin 1000mg twice daily and Glibenclamide. Also hypertensive on Losartan 50mg. Regular HbA1c monitoring."
            },
            {
                "full_name": "Blessing Eze",
                "date_of_birth": "1995-09-12",
                "gender": "female",
                "phone": "+234 808 345 6789",
                "email": "blessing.eze@email.com",
                "address": "56 Ogui Road, Enugu",
                "blood_group": "O-",
                "genotype": "AA",
                "allergies": "Latex",
                "chronic_conditions": "None",
                "emergency_contact": "Mr. Eze (Husband) - 0808 345 6790",
                "medical_history": "Currently 28 weeks pregnant with first child. Pregnancy progressing normally. Attends antenatal clinic regularly."
            },
            {
                "full_name": "Ibrahim Yusuf",
                "date_of_birth": "1960-05-20",
                "gender": "male",
                "phone": "+234 809 456 7890",
                "email": "ibrahim.yusuf@email.com",
                "address": "12 Murtala Mohammed Way, Kano",
                "blood_group": "A-",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "Chronic Kidney Disease Stage 3, Hypertension, Gout",
                "emergency_contact": "Aisha Yusuf (Daughter) - 0809 456 7891",
                "medical_history": "63-year-old with CKD Stage 3. On dialysis preparation. Hypertensive for 15 years. Recent gout attacks managed with Allopurinol. Regular nephrology follow-up."
            },
            {
                "full_name": "Grace Adeyemi",
                "date_of_birth": "2010-02-14",
                "gender": "female",
                "phone": "+234 810 567 8901",
                "email": "adeyemi.grace@email.com",
                "address": "34 Ring Road, Ibadan",
                "blood_group": "B-",
                "genotype": "SS",
                "allergies": "None",
                "chronic_conditions": "Sickle Cell Disease",
                "emergency_contact": "Mrs. Adeyemi (Mother) - 0810 567 8902",
                "medical_history": "13-year-old with Sickle Cell Disease (SS). Multiple hospitalizations for pain crises. On Hydroxyurea and folic acid. Last crisis 3 months ago. Regular blood transfusions."
            },
            {
                "full_name": "Oluwaseun Balogun",
                "date_of_birth": "1988-08-05",
                "gender": "male",
                "phone": "+234 811 678 9012",
                "email": "seun.balogun@email.com",
                "address": "67 Awolowo Road, Ikoyi, Lagos",
                "blood_group": "O+",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "None",
                "emergency_contact": "Mrs. Balogun - 0811 678 9013",
                "medical_history": "Generally healthy. Recent sports injury - torn ACL. Underwent surgery 6 months ago. Currently in physiotherapy."
            },
            {
                "full_name": "Amina Abdullahi",
                "date_of_birth": "1970-12-03",
                "gender": "female",
                "phone": "+234 812 789 0123",
                "email": "amina.abdullahi@email.com",
                "address": "89 Sokoto Road, Abuja",
                "blood_group": "A+",
                "genotype": "AA",
                "allergies": "Aspirin",
                "chronic_conditions": "Rheumatoid Arthritis, Osteoporosis",
                "emergency_contact": "Dr. Abdullahi (Son) - 0812 789 0124",
                "medical_history": "53-year-old with Rheumatoid Arthritis for 10 years. On Methotrexate and Prednisolone. Recent DEXA scan shows osteoporosis. Started on calcium and vitamin D supplements."
            },
            {
                "full_name": "Chukwuemeka Obi",
                "date_of_birth": "2018-06-18",
                "gender": "male",
                "phone": "+234 813 890 1234",
                "email": "obi.family@email.com",
                "address": "23 New Haven, Enugu",
                "blood_group": "O+",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "None",
                "emergency_contact": "Mr. Obi (Father) - 0813 890 1235",
                "medical_history": "5-year-old healthy child. All immunizations up to date. Recent episode of malaria treated successfully. No complications."
            },
            {
                "full_name": "Ngozi Okeke",
                "date_of_birth": "1982-04-25",
                "gender": "female",
                "phone": "+234 814 901 2345",
                "email": "ngozi.okeke@email.com",
                "address": "45 Zik Avenue, Awka",
                "blood_group": "B+",
                "genotype": "AS",
                "allergies": "Codeine",
                "chronic_conditions": "Migraine, Anxiety Disorder",
                "emergency_contact": "Mr. Okeke - 0814 901 2346",
                "medical_history": "Chronic migraines since age 20. On Propranolol prophylaxis. Diagnosed with generalized anxiety disorder 2 years ago. Seeing psychiatrist regularly. On Sertraline 50mg."
            },
            {
                "full_name": "Tunde Adebisi",
                "date_of_birth": "1955-10-10",
                "gender": "male",
                "phone": "+234 815 012 3456",
                "email": "tunde.adebisi@email.com",
                "address": "12 Broad Street, Lagos Island",
                "blood_group": "AB-",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "Prostate Cancer (in remission), Hypertension",
                "emergency_contact": "Mrs. Adebisi - 0815 012 3457",
                "medical_history": "68-year-old. Prostate cancer diagnosed 3 years ago. Underwent radical prostatectomy. Currently in remission with PSA monitoring every 6 months. Hypertensive on multiple medications."
            },
            {
                "full_name": "Khadija Bello",
                "date_of_birth": "2005-03-28",
                "gender": "female",
                "phone": "+234 816 123 4567",
                "email": "khadija.bello@email.com",
                "address": "78 Maiduguri Road, Borno",
                "blood_group": "O+",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "Type 1 Diabetes",
                "emergency_contact": "Mrs. Bello (Mother) - 0816 123 4568",
                "medical_history": "18-year-old with Type 1 Diabetes diagnosed at age 12. On insulin pump therapy. Good glycemic control. HbA1c consistently below 7%. Active in school sports."
            },
            {
                "full_name": "Victor Onyeka",
                "date_of_birth": "1990-11-15",
                "gender": "male",
                "phone": "+234 817 234 5678",
                "email": "victor.onyeka@email.com",
                "address": "34 Owerri Road, Imo State",
                "blood_group": "A+",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "HIV (on ART)",
                "emergency_contact": "Sister - 0817 234 5679",
                "medical_history": "Diagnosed with HIV 5 years ago. On antiretroviral therapy (Tenofovir/Emtricitabine/Efavirenz). Undetectable viral load for 3 years. CD4 count stable. Regular clinic attendance."
            },
            {
                "full_name": "Hauwa Garba",
                "date_of_birth": "1998-07-07",
                "gender": "female",
                "phone": "+234 818 345 6789",
                "email": "hauwa.garba@email.com",
                "address": "56 Zaria Road, Kaduna",
                "blood_group": "B+",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "Epilepsy",
                "emergency_contact": "Mr. Garba (Father) - 0818 345 6790",
                "medical_history": "25-year-old with epilepsy since age 15. On Carbamazepine 400mg twice daily. Well controlled - no seizures in past 2 years. Drives with medical clearance."
            },
            {
                "full_name": "Daniel Ogunleye",
                "date_of_birth": "1975-02-20",
                "gender": "male",
                "phone": "+234 819 456 7890",
                "email": "daniel.ogunleye@email.com",
                "address": "23 Abeokuta Road, Ogun State",
                "blood_group": "O-",
                "genotype": "AA",
                "allergies": "Iodine contrast",
                "chronic_conditions": "Chronic Obstructive Pulmonary Disease (COPD)",
                "emergency_contact": "Mrs. Ogunleye - 0819 456 7891",
                "medical_history": "48-year-old former smoker (quit 5 years ago). COPD diagnosed 3 years ago. On Tiotropium inhaler and Symbicort. Pulmonary rehabilitation completed. Oxygen therapy at night."
            },
            {
                "full_name": "Zainab Musa",
                "date_of_birth": "1987-09-30",
                "gender": "female",
                "phone": "+234 820 567 8901",
                "email": "zainab.musa@email.com",
                "address": "67 Jos Road, Plateau State",
                "blood_group": "A-",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "Hypothyroidism",
                "emergency_contact": "Mr. Musa (Husband) - 0820 567 8902",
                "medical_history": "36-year-old with hypothyroidism diagnosed 4 years ago. On Levothyroxine 100mcg daily. TSH levels well controlled. Annual thyroid function tests."
            },
            {
                "full_name": "Ifeanyi Nnamdi",
                "date_of_birth": "2012-05-12",
                "gender": "male",
                "phone": "+234 821 678 9012",
                "email": "nnamdi.family@email.com",
                "address": "89 Onitsha Road, Anambra",
                "blood_group": "B+",
                "genotype": "AA",
                "allergies": "Eggs",
                "chronic_conditions": "Autism Spectrum Disorder",
                "emergency_contact": "Mrs. Nnamdi (Mother) - 0821 678 9013",
                "medical_history": "11-year-old with Autism Spectrum Disorder diagnosed at age 4. In special education program. Speech and occupational therapy ongoing. Making good progress."
            },
            {
                "full_name": "Folake Williams",
                "date_of_birth": "1965-08-18",
                "gender": "female",
                "phone": "+234 822 789 0123",
                "email": "folake.williams@email.com",
                "address": "12 Victoria Island, Lagos",
                "blood_group": "O+",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "Breast Cancer (Stage 2), Hypertension",
                "emergency_contact": "Dr. Williams (Husband) - 0822 789 0124",
                "medical_history": "58-year-old. Breast cancer diagnosed 1 year ago. Underwent lumpectomy and chemotherapy. Currently on Tamoxifen. Regular oncology follow-up. Also hypertensive."
            },
            {
                "full_name": "Yusuf Abubakar",
                "date_of_birth": "1993-12-25",
                "gender": "male",
                "phone": "+234 823 890 1234",
                "email": "yusuf.abubakar@email.com",
                "address": "45 Bauchi Road, Gombe",
                "blood_group": "AB+",
                "genotype": "AA",
                "allergies": "None",
                "chronic_conditions": "None",
                "emergency_contact": "Mrs. Abubakar (Wife) - 0823 890 1235",
                "medical_history": "30-year-old generally healthy. Recent motorcycle accident with fractured femur. Underwent ORIF surgery. Currently on crutches and physiotherapy. Expected full recovery."
            }
        ]
        
        created_count = 0
        for idx, patient_data in enumerate(patients_data, start=1):
            # Split full name into first and last name
            name_parts = patient_data["full_name"].split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            
            # Generate MRN (Medical Record Number)
            mrn = f"MRN{datetime.now().year}{str(idx).zfill(4)}"
            
            # Check if patient already exists by MRN
            existing = db.query(Patient).filter(Patient.mrn == mrn).first()
            if existing:
                print(f"✗ Patient with MRN '{mrn}' already exists")
                continue
            
            # Calculate age
            dob = datetime.strptime(patient_data["date_of_birth"], "%Y-%m-%d")
            age = (datetime.now() - dob).days // 365
            
            # Generate NIN (National Identification Number) - fake for demo
            nin = f"{random.randint(10000000000, 99999999999)}"
            
            # Create medical history note combining chronic conditions and history
            medical_notes = f"Chronic Conditions: {patient_data['chronic_conditions']}\n\n"
            medical_notes += f"Medical History: {patient_data['medical_history']}\n\n"
            medical_notes += f"Emergency Contact: {patient_data['emergency_contact']}"
            
            patient = Patient(
                id=str(uuid.uuid4()),
                mrn=mrn,
                first_name=first_name,
                last_name=last_name,
                age=age,
                gender=patient_data["gender"],
                phone_number=patient_data["phone"],
                email=patient_data["email"],
                address=patient_data["address"],
                nin=nin,
                blood_group=patient_data["blood_group"],
                genotype=patient_data["genotype"],
                allergies=patient_data["allergies"],
                symptoms=medical_notes,  # Store medical history in symptoms field
                hospital_id=hospital_id,
                registered_by="receptionist",  # Assuming receptionist registered them
                created_at=datetime.now() - timedelta(days=random.randint(30, 730))
            )
            
            db.add(patient)
            created_count += 1
            print(f"✓ Created patient: {patient_data['full_name']} (MRN: {mrn}, Age: {age}, {patient_data['gender']})")
        
        db.commit()
        
        print(f"\n{'='*70}")
        print(f"✓ Successfully created {created_count} patients!")
        print(f"{'='*70}")
        
        # Display summary
        total_patients = db.query(Patient).count()
        print(f"\nTotal patients in database: {total_patients}")
        
        # Gender distribution
        male_count = db.query(Patient).filter(Patient.gender == "male").count()
        female_count = db.query(Patient).filter(Patient.gender == "female").count()
        print(f"Gender distribution: {male_count} male, {female_count} female")
        
        # Age groups
        children = db.query(Patient).filter(Patient.age < 18).count()
        adults = db.query(Patient).filter(Patient.age >= 18, Patient.age < 60).count()
        seniors = db.query(Patient).filter(Patient.age >= 60).count()
        print(f"Age groups: {children} children (<18), {adults} adults (18-59), {seniors} seniors (60+)")
        
        # Patients with medical notes
        with_notes = db.query(Patient).filter(
            Patient.symptoms != None,
            Patient.symptoms != ""
        ).count()
        print(f"Patients with medical history: {with_notes}")
        
        print(f"\n{'='*70}")
        print("SAMPLE PATIENTS:")
        print(f"{'='*70}")
        
        sample_patients = db.query(Patient).limit(5).all()
        for p in sample_patients:
            print(f"\n{p.first_name} {p.last_name} ({p.age} years, {p.gender})")
            print(f"  MRN: {p.mrn}")
            print(f"  Blood Group: {p.blood_group}, Genotype: {p.genotype}")
            print(f"  Phone: {p.phone_number}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_patients()
