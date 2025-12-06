from sqlalchemy import Column, String, DateTime, func
from server_py.db.session import Base
import uuid

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String, nullable=True)
    hospital_admin_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    head_staff_id = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
