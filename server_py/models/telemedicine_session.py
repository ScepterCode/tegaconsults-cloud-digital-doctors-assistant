from sqlalchemy import Column, String, DateTime, Integer, func, Enum as SQLEnum
from server_py.db.session import Base
import uuid
import enum

class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class TelemedicineSession(Base):
    __tablename__ = "telemedicine_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Participants
    patient_id = Column(String, nullable=False)
    doctor_id = Column(String, nullable=False)
    hospital_id = Column(String, nullable=False)
    
    # Scheduling
    scheduled_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Video session details
    video_room_id = Column(String, nullable=True)  # Agora channel name
    agora_token = Column(String, nullable=True)  # Generated token
    
    # Session info
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.SCHEDULED, nullable=False)
    reason = Column(String, nullable=True)  # Reason for consultation
    notes = Column(String, nullable=True)  # Doctor's notes
    prescription_id = Column(String, nullable=True)  # Link to prescription if created
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
