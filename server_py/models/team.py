from sqlalchemy import Column, String, DateTime, Text, func
from server_py.db.session import Base
import uuid

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    team_type = Column(String, nullable=False)  # clinical, emergency, surgical, pediatric, etc.
    hospital_id = Column(String, nullable=True)
    department_id = Column(String, nullable=True)
    team_lead_id = Column(String, nullable=True)  # User ID of team lead
    status = Column(String, nullable=False, default="active")  # active, inactive
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
