from sqlalchemy import Column, String, DateTime, func
from server_py.db.session import Base
import uuid

class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    role_in_team = Column(String, nullable=True)  # lead, member, specialist
    joined_at = Column(DateTime, server_default=func.now())
