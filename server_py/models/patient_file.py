from sqlalchemy import Column, String, DateTime, Text, func
from server_py.db.session import Base
import uuid

class PatientFile(Base):
    __tablename__ = "patient_files"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False)
    uploaded_by = Column(String, nullable=False)  # User ID
    file_type = Column(String, nullable=False)  # lab_result, prescription, scan, report, other
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_size = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # blood_test, xray, mri, ct_scan, ultrasound, etc.
    uploaded_by_role = Column(String, nullable=False)  # doctor, nurse, lab_tech, pharmacist
    created_at = Column(DateTime, server_default=func.now())
