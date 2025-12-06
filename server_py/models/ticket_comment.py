from sqlalchemy import Column, String, DateTime, Text, func
from server_py.db.session import Base
import uuid

class TicketComment(Base):
    __tablename__ = "ticket_comments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
