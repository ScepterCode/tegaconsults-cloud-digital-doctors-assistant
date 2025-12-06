from sqlalchemy import Column, String, Integer, DateTime, func
from server_py.db.session import Base
import uuid

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    mrn = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    nin = Column(String, nullable=False)
    blood_group = Column(String, nullable=False)
    genotype = Column(String, nullable=False)
    allergies = Column(String, nullable=True)
    symptoms = Column(String, nullable=True)
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    temperature = Column(String, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    weight = Column(String, nullable=True)
    facial_recognition_data = Column(String, nullable=True)
    fingerprint_data = Column(String, nullable=True)
    registered_by = Column(String, nullable=False)
    last_updated_by = Column(String, nullable=True)
    assigned_doctor_id = Column(String, nullable=True)  # Doctor assigned to this patient
    hospital_id = Column(String, nullable=True)  # Hospital the patient belongs to
    department_id = Column(String, nullable=True)  # Department the patient is in
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
