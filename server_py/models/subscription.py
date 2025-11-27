from sqlalchemy import Column, String, DateTime, func
from server_py.db.session import Base
import uuid

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_name = Column(String, nullable=False)
    admin_user_id = Column(String, unique=True, nullable=False)
    tier = Column(String, nullable=False, default="free")
    trial_start_date = Column(DateTime, server_default=func.now())
    trial_end_date = Column(DateTime, nullable=True)
    subscription_start_date = Column(DateTime, nullable=True)
    subscription_end_date = Column(DateTime, nullable=True)
    billing_cycle = Column(String, nullable=True)
    status = Column(String, nullable=False, default="trial")
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
