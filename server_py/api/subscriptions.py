from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import uuid

from server_py.db.session import get_db
from server_py.models.subscription import Subscription, SubscriptionPricing, PaymentHistory
from server_py.models.hospital import Hospital
from server_py.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

class PricingUpdate(BaseModel):
    plan_type: str
    price: float
    description: Optional[str] = None

class SubscriptionCreate(BaseModel):
    hospital_id: str
    plan_type: str  # monthly, yearly
    payment_reference: Optional[str] = None
    payment_method: Optional[str] = None

class SubscriptionRenewal(BaseModel):
    payment_reference: Optional[str] = None
    payment_method: Optional[str] = None

# Initialize default pricing
def init_pricing(db: Session):
    monthly = db.query(SubscriptionPricing).filter(SubscriptionPricing.plan_type == "monthly").first()
    if not monthly:
        monthly = SubscriptionPricing(
            id=str(uuid.uuid4()),
            plan_type="monthly",
            price=150000.0,
            currency="NGN",
            description="Monthly subscription plan"
        )
        db.add(monthly)
    
    yearly = db.query(SubscriptionPricing).filter(SubscriptionPricing.plan_type == "yearly").first()
    if not yearly:
        yearly = SubscriptionPricing(
            id=str(uuid.uuid4()),
            plan_type="yearly",
            price=1400000.0,
            currency="NGN",
            description="Yearly subscription plan (save ₦400,000)"
        )
        db.add(yearly)
    
    db.commit()

@router.get("/pricing")
def get_pricing(db: Session = Depends(get_db)):
    """Get current subscription pricing"""
    init_pricing(db)
    pricing = db.query(SubscriptionPricing).all()
    return {"pricing": [serialize_pricing(p) for p in pricing]}

@router.put("/pricing/{plan_type}")
def update_pricing(
    plan_type: str,
    pricing_data: PricingUpdate,
    admin_id: str,
    db: Session = Depends(get_db)
):
    """Update subscription pricing (System Admin only)"""
    admin = db.query(User).filter(User.id == admin_id, User.role == "system_admin").first()
    if not admin:
        raise HTTPException(status_code=403, detail="Only system admins can update pricing")
    
    pricing = db.query(SubscriptionPricing).filter(SubscriptionPricing.plan_type == plan_type).first()
    if not pricing:
        pricing = SubscriptionPricing(
            id=str(uuid.uuid4()),
            plan_type=plan_type,
            price=pricing_data.price,
            currency="NGN",
            description=pricing_data.description
        )
        db.add(pricing)
    else:
        pricing.price = pricing_data.price
        if pricing_data.description:
            pricing.description = pricing_data.description
        pricing.updated_at = datetime.now()
    
    db.commit()
    db.refresh(pricing)
    
    return {"pricing": serialize_pricing(pricing)}

@router.get("/hospital/{hospital_id}")
def get_hospital_subscription(hospital_id: str, db: Session = Depends(get_db)):
    """Get subscription details for a hospital"""
    subscription = db.query(Subscription).filter(Subscription.hospital_id == hospital_id).first()
    
    if not subscription:
        # Create trial subscription
        trial_end = datetime.now() + timedelta(days=60)
        subscription = Subscription(
            id=str(uuid.uuid4()),
            hospital_id=hospital_id,
            plan_type="trial",
            status="trial",
            trial_start_date=datetime.now(),
            trial_end_date=trial_end
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
    
    # Check if trial expired
    if subscription.status == "trial" and subscription.trial_end_date:
        if datetime.now() > subscription.trial_end_date:
            subscription.status = "expired"
            db.commit()
    
    # Check if subscription expired
    if subscription.status == "active" and subscription.subscription_end_date:
        if datetime.now() > subscription.subscription_end_date:
            subscription.status = "expired"
            db.commit()
    
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    return {
        "subscription": serialize_subscription(subscription, db),
        "hospital": {
            "id": hospital.id,
            "name": hospital.name
        } if hospital else None
    }

@router.post("/subscribe")
def create_subscription(
    sub_data: SubscriptionCreate,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Create or upgrade subscription (Hospital Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only hospital admins can manage subscriptions")
    
    # Get pricing
    pricing = db.query(SubscriptionPricing).filter(
        SubscriptionPricing.plan_type == sub_data.plan_type
    ).first()
    if not pricing:
        raise HTTPException(status_code=404, detail="Pricing plan not found")
    
    # Get or create subscription
    subscription = db.query(Subscription).filter(
        Subscription.hospital_id == sub_data.hospital_id
    ).first()
    
    if not subscription:
        subscription = Subscription(
            id=str(uuid.uuid4()),
            hospital_id=sub_data.hospital_id,
            plan_type=sub_data.plan_type,
            status="active",
            trial_start_date=datetime.now(),
            trial_end_date=datetime.now() + timedelta(days=60)
        )
        db.add(subscription)
    
    # Update subscription
    subscription.plan_type = sub_data.plan_type
    subscription.status = "active"
    subscription.subscription_start_date = datetime.now()
    
    if sub_data.plan_type == "monthly":
        subscription.subscription_end_date = datetime.now() + timedelta(days=30)
    elif sub_data.plan_type == "yearly":
        subscription.subscription_end_date = datetime.now() + timedelta(days=365)
    
    subscription.amount_paid = pricing.price
    subscription.payment_reference = sub_data.payment_reference
    subscription.updated_at = datetime.now()
    
    # Create payment history
    payment = PaymentHistory(
        id=str(uuid.uuid4()),
        hospital_id=sub_data.hospital_id,
        subscription_id=subscription.id,
        amount=pricing.price,
        currency="NGN",
        payment_method=sub_data.payment_method,
        payment_reference=sub_data.payment_reference,
        status="completed",
        paid_by=user_id
    )
    db.add(payment)
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "subscription": serialize_subscription(subscription, db),
        "payment": serialize_payment(payment, db)
    }

@router.get("/all")
def get_all_subscriptions(admin_id: str, db: Session = Depends(get_db)):
    """Get all hospital subscriptions (System Admin only)"""
    admin = db.query(User).filter(User.id == admin_id, User.role == "system_admin").first()
    if not admin:
        raise HTTPException(status_code=403, detail="Only system admins can view all subscriptions")
    
    subscriptions = db.query(Subscription).all()
    
    result = []
    for sub in subscriptions:
        hospital = db.query(Hospital).filter(Hospital.id == sub.hospital_id).first()
        
        # Check and update status
        if sub.status == "trial" and sub.trial_end_date and datetime.now() > sub.trial_end_date:
            sub.status = "expired"
            db.commit()
        elif sub.status == "active" and sub.subscription_end_date and datetime.now() > sub.subscription_end_date:
            sub.status = "expired"
            db.commit()
        
        days_remaining = 0
        if sub.status == "trial" and sub.trial_end_date:
            days_remaining = (sub.trial_end_date - datetime.now()).days
        elif sub.status == "active" and sub.subscription_end_date:
            days_remaining = (sub.subscription_end_date - datetime.now()).days
        
        result.append({
            "subscription": serialize_subscription(sub, db),
            "hospital": {
                "id": hospital.id,
                "name": hospital.name,
                "address": hospital.address
            } if hospital else None,
            "daysRemaining": max(0, days_remaining),
            "needsRenewal": days_remaining <= 7
        })
    
    return {"subscriptions": result}

@router.get("/payment-history/{hospital_id}")
def get_payment_history(hospital_id: str, user_id: str, db: Session = Depends(get_db)):
    """Get payment history for a hospital"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    payments = db.query(PaymentHistory).filter(
        PaymentHistory.hospital_id == hospital_id
    ).order_by(PaymentHistory.payment_date.desc()).all()
    
    return {"payments": [serialize_payment(p, db) for p in payments]}

def serialize_subscription(subscription: Subscription, db: Session):
    days_remaining = 0
    if subscription.status == "trial" and subscription.trial_end_date:
        days_remaining = max(0, (subscription.trial_end_date - datetime.now()).days)
    elif subscription.status == "active" and subscription.subscription_end_date:
        days_remaining = max(0, (subscription.subscription_end_date - datetime.now()).days)
    
    return {
        "id": subscription.id,
        "hospitalId": subscription.hospital_id,
        "planType": subscription.plan_type,
        "status": subscription.status,
        "trialStartDate": subscription.trial_start_date.isoformat() if subscription.trial_start_date else None,
        "trialEndDate": subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
        "subscriptionStartDate": subscription.subscription_start_date.isoformat() if subscription.subscription_start_date else None,
        "subscriptionEndDate": subscription.subscription_end_date.isoformat() if subscription.subscription_end_date else None,
        "amountPaid": subscription.amount_paid,
        "paymentReference": subscription.payment_reference,
        "autoRenew": subscription.auto_renew,
        "daysRemaining": days_remaining,
        "isExpired": subscription.status == "expired",
        "needsRenewal": days_remaining <= 7 and subscription.status in ["trial", "active"]
    }

def serialize_pricing(pricing: SubscriptionPricing):
    return {
        "id": pricing.id,
        "planType": pricing.plan_type,
        "price": pricing.price,
        "currency": pricing.currency,
        "description": pricing.description,
        "formattedPrice": f"₦{pricing.price:,.2f}"
    }

def serialize_payment(payment: PaymentHistory, db: Session):
    paid_by_user = None
    if payment.paid_by:
        user = db.query(User).filter(User.id == payment.paid_by).first()
        if user:
            paid_by_user = {
                "id": user.id,
                "name": user.full_name,
                "role": user.role
            }
    
    return {
        "id": payment.id,
        "hospitalId": payment.hospital_id,
        "subscriptionId": payment.subscription_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "paymentMethod": payment.payment_method,
        "paymentReference": payment.payment_reference,
        "status": payment.status,
        "paidBy": paid_by_user,
        "paymentDate": payment.payment_date.isoformat() if payment.payment_date else None,
        "formattedAmount": f"₦{payment.amount:,.2f}"
    }
