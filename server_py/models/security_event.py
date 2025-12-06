from sqlalchemy import Column, String, DateTime, func, Text, Enum as SQLEnum
from server_py.db.session import Base
import uuid
import enum

class EventSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String, nullable=False, index=True)  # e.g., "failed_login", "account_lockout", "suspicious_activity"
    user_id = Column(String, nullable=True, index=True)
    username = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    details = Column(Text, nullable=True)  # JSON string with event details
    severity = Column(SQLEnum(EventSeverity), default=EventSeverity.LOW, nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    resolved = Column(String, default="false")  # "true" or "false" as string for SQLite compatibility
