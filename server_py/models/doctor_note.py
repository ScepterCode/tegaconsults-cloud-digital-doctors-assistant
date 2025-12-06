from sqlalchemy import Column, String, DateTime, Text, func
from server_py.db.session import Base
import uuid

class DoctorNote(Base):
    __tablename__ = "doctor_notes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, nullable=False)
    doctor_id = Column(String, nullable=False)
    note_type = Column(String, nullable=False)  # consultation, diagnosis, treatment, follow_up, observation
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    tags = Column(String, nullable=True)  # JSON array of tags
    is_private = Column(String, nullable=False, default="0")  # 0 = shared, 1 = private
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
