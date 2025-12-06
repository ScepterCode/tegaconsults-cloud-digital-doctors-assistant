from sqlalchemy import Column, String, DateTime, Text, Integer, func
from server_py.db.session import Base
import uuid

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False)
    doctor_id = Column(String, nullable=False)
    medication_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    instructions = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending, dispensed, completed
    dispensed_by = Column(String, nullable=True)  # Pharmacist ID
    dispensed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
