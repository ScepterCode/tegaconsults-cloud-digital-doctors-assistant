from sqlalchemy import Column, String, DateTime, func, Text, Index
from server_py.db.session import Base
import uuid

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True, index=True)
    hospital_id = Column(String, nullable=True, index=True)
    action_type = Column(String, nullable=False, index=True)  # e.g., "create", "update", "delete", "login", "logout"
    resource_type = Column(String, nullable=False)  # e.g., "user", "patient", "appointment", "hospital"
    resource_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)  # JSON string with additional details
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    
    __table_args__ = (
        Index('idx_audit_timestamp_user', 'timestamp', 'user_id'),
        Index('idx_audit_action_resource', 'action_type', 'resource_type'),
    )
