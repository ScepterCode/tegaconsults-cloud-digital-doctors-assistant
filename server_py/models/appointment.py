from sqlalchemy import Column, String, DateTime, func
from server_py.db.session import Base
import uuid

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False)
    doctor_id = Column(String, nullable=False)
    appointment_date = Column(String, nullable=False)
    appointment_time = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, nullable=False, default="scheduled")
    notes = Column(String, nullable=True)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
