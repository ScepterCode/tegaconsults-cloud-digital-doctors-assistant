from sqlalchemy import Column, String, DateTime, func
from server_py.db.session import Base
import uuid

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String, nullable=False)
    patient_id = Column(String, nullable=False)
    appointment_id = Column(String, nullable=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    priority = Column(String, nullable=False, default="normal")
    requested_by = Column(String, nullable=False)
    status = Column(String, nullable=False, default="unread")
    action_data = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
