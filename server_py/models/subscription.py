from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, func
from server_py.db.session import Base
import uuid

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String, nullable=False, unique=True)
    plan_type = Column(String, nullable=False)  # trial, monthly, yearly
    status = Column(String, nullable=False, default="trial")  # trial, active, expired, cancelled
    trial_start_date = Column(DateTime, nullable=False, server_default=func.now())
    trial_end_date = Column(DateTime, nullable=True)
    subscription_start_date = Column(DateTime, nullable=True)
    subscription_end_date = Column(DateTime, nullable=True)
    amount_paid = Column(Float, nullable=True)
    payment_reference = Column(String, nullable=True)
    auto_renew = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class SubscriptionPricing(Base):
    __tablename__ = "subscription_pricing"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_type = Column(String, nullable=False, unique=True)  # monthly, yearly
    price = Column(Float, nullable=False)
    currency = Column(String, default="NGN")
    description = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class PaymentHistory(Base):
    __tablename__ = "payment_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String, nullable=False)
    subscription_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="NGN")
    payment_method = Column(String, nullable=True)  # card, bank_transfer, etc.
    payment_reference = Column(String, nullable=True)
    status = Column(String, nullable=False)  # pending, completed, failed
    paid_by = Column(String, nullable=True)  # User ID of hospital admin who paid
    payment_date = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
