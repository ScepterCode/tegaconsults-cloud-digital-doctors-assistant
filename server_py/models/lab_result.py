from sqlalchemy import Column, String, DateTime, func
from server_py.db.session import Base
import uuid

class LabResult(Base):
    __tablename__ = "lab_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False)
    test_name = Column(String, nullable=False)
    test_category = Column(String, nullable=False)
    file_data = Column(String, nullable=True)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    test_values = Column(String, nullable=True)
    normal_range = Column(String, nullable=True)
    status = Column(String, nullable=False)
    automated_analysis = Column(String, nullable=True)
    doctor_notes = Column(String, nullable=True)
    recommendations = Column(String, nullable=True)
    uploaded_by = Column(String, nullable=False)
    reviewed_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
