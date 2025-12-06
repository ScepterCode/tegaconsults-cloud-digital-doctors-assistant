from sqlalchemy import Column, String, DateTime, Integer, func, Enum as SQLEnum
from server_py.db.session import Base
import uuid
import enum

class HospitalStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"

class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

class Hospital(Base):
    __tablename__ = "hospitals"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    # Subscription details
    subscription_tier = Column(SQLEnum(SubscriptionTier), default=SubscriptionTier.FREE, nullable=False)
    subscription_status = Column(SQLEnum(HospitalStatus), default=HospitalStatus.PENDING, nullable=False)
    subscription_start_date = Column(DateTime, nullable=True)
    subscription_end_date = Column(DateTime, nullable=True)
    
    # Limits based on subscription
    max_staff = Column(Integer, default=5)  # Free tier: 5 staff
    max_patients = Column(Integer, default=100)  # Free tier: 100 patients
    
    # Admin user who owns this hospital
    admin_user_id = Column(String, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
