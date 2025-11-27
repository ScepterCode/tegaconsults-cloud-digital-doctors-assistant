from sqlalchemy import Column, String, Integer, DateTime, func
from server_py.db.session import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    hospital_admin_id = Column(String, nullable=True)
    department_id = Column(String, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, server_default=func.now())
