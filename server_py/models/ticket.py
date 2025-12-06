from sqlalchemy import Column, String, Integer, DateTime, Text, func
from server_py.db.session import Base
import uuid

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_number = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=False)  # task, query, issue, request
    priority = Column(String, nullable=False)  # low, medium, high, urgent
    status = Column(String, nullable=False, default="open")  # open, in_progress, resolved, closed
    category = Column(String, nullable=True)  # clinical, administrative, technical, maintenance
    
    # Assignment
    created_by = Column(String, nullable=False)  # User ID
    assigned_to = Column(String, nullable=True)  # User ID
    hospital_id = Column(String, nullable=True)
    department_id = Column(String, nullable=True)
    
    # Timestamps
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    resolved_at = Column(DateTime, nullable=True)
    
    # Additional fields
    notes = Column(Text, nullable=True)
    resolution = Column(Text, nullable=True)
