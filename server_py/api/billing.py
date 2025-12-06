from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

from server_py.db.session import get_db
from server_py.models.billing import (
    ServicePricing, PatientBill, BillItem, Payment, Receipt, BillingAudit
)
from server_py.models.user import User
from server_py.models.patient import Patient
from pydantic import BaseModel

router = APIRouter(prefix="/api/billing", tags=["billing"])

# ============= Pydantic Models =============

class ServicePricingCreate(BaseModel):
    service_category: str
    service_name: str
    service_code: Optional[str] = None
    base_price: float
    insurance_price: Optional[float] = None
    staff_price: Optional[float] = None
    description: Optional[str] = None

class ChargeCreate(BaseModel):
    patient_id: str
    service_category: str
    service_name: str
    quantity: int = 1
    unit_price: Optional[float] = None  # If not provided, fetch from pricing
    performed_by: Optional[str] = None
    department: Optional[str] = None
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    notes: Optional[str] = None

class DiscountApply(BaseModel):
    discount_percentage: Optional[float] = None
    discount_amount: Optional[float] = None
    reason: str

class PaymentCreate(BaseModel):
    bill_id: str
    amount: float
    payment_method: str
    payment_reference: Optional[str] = None
    notes: Optional[str] = None

# ============= Service Pricing Management =============

@router.post("/pricing")
def create_service_pricing(
    pricing_data: ServicePricingCreate,
    hospital_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Create or update service pricing (Hospital Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can manage pricing")
    
    pricing = ServicePricing(
        id=str(uuid.uuid4()),
        hospital_id=hospital_id,
        service_category=pricing_data.service_category,
        service_name=pricing_data.service_name,
        service_code=pricing_data.service_code,
        base_price=pricing_data.base_price,
        insurance_price=pricing_data.insurance_price,
        staff_price=pricing_data.staff_price,
        description=pricing_data.description
    )
    
    db.add(pricing)
    db.commit()
    db.refresh(pricing)
    
    return {"pricing": serialize_pricing(pricing)}

@router.get("/pricing")
def get_service_pricing(
    hospital_id: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all service pricing"""
    query = db.query(ServicePricing).filter(
        ServicePricing.hospital_id == hospital_id,
        ServicePricing.is_active == True
    )
    
    if category:
        query = query.filter(ServicePricing.service_category == category)
    
    pricing = query.order_by(ServicePricing.service_category, ServicePricing.service_name).all()
    return {"pricing": [serialize_pricing(p) for p in pricing]}

@router.put("/pricing/{pricing_id}")
def update_service_pricing(
    pricing_id: str,
    pricing_data: ServicePricingCreate,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Update service pricing"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can manage pricing")
    
    pricing = db.query(ServicePricing).filter(ServicePricing.id == pricing_id).first()
    if not pricing:
        raise HTTPException(status_code=404, detail="Pricing not found")
    
    pricing.service_name = pricing_data.service_name
    pricing.base_price = pricing_data.base_price
    pricing.insurance_price = pricing_data.insurance_price
    pricing.staff_price = pricing_data.staff_price
    pricing.description = pricing_data.description
    pricing.updated_at = datetime.now()
    
    db.commit()
    db.refresh(pricing)
    
    return {"pricing": serialize_pricing(pricing)}

# ============= Auto-Charge System =============

@router.post("/charges/add")
def add_charge_to_bill(
    charge_data: ChargeCreate,
    user_id: str,
    hospital_id: str,
    db: Session = Depends(get_db)
):
    """Add a charge to patient's bill (Auto-charge from departments)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create patient bill
    bill = get_or_create_patient_bill(charge_data.patient_id, hospital_id, db)
    
    # Get pricing if not provided
    unit_price = charge_data.unit_price
    if not unit_price:
        pricing = db.query(ServicePricing).filter(
            ServicePricing.hospital_id == hospital_id,
            ServicePricing.service_category == charge_data.service_category,
            ServicePricing.service_name == charge_data.service_name,
            ServicePricing.is_active == True
        ).first()
        
        if pricing:
            unit_price = pricing.base_price
        else:
            raise HTTPException(status_code=404, detail="Service pricing not found")
    
    # Create bill item
    total_price = unit_price * charge_data.quantity
    
    bill_item = BillItem(
        id=str(uuid.uuid4()),
        bill_id=bill.id,
        service_category=charge_data.service_category,
        service_name=charge_data.service_name,
        quantity=charge_data.quantity,
        unit_price=unit_price,
        total_price=total_price,
        performed_by=charge_data.performed_by or user_id,
        performed_at=datetime.now(),
        department=charge_data.department,
        reference_id=charge_data.reference_id,
        reference_type=charge_data.reference_type,
        notes=charge_data.notes
    )
    
    db.add(bill_item)
    
    # Update bill totals
    update_bill_totals(bill, db)
    
    # Audit trail
    create_audit_log(
        hospital_id, bill.id, "charge_added", user_id,
        f"Added {charge_data.service_name} - ₦{total_price:,.2f}",
        total_price, db
    )
    
    db.commit()
    db.refresh(bill)
    
    return {"bill": serialize_bill(bill, db), "item": serialize_bill_item(bill_item, db)}

# ============= Bill Management =============

@router.get("/bills/patient/{patient_id}")
def get_patient_bills(
    patient_id: str,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all bills for a patient"""
    query = db.query(PatientBill).filter(PatientBill.patient_id == patient_id)
    
    if status:
        query = query.filter(PatientBill.status == status)
    
    bills = query.order_by(PatientBill.created_at.desc()).all()
    return {"bills": [serialize_bill(bill, db) for bill in bills]}

@router.get("/bills/{bill_id}")
def get_bill_details(bill_id: str, db: Session = Depends(get_db)):
    """Get detailed bill with all items"""
    bill = db.query(PatientBill).filter(PatientBill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    items = db.query(BillItem).filter(BillItem.bill_id == bill_id).all()
    payments = db.query(Payment).filter(Payment.bill_id == bill_id).all()
    
    return {
        "bill": serialize_bill(bill, db),
        "items": [serialize_bill_item(item, db) for item in items],
        "payments": [serialize_payment(payment, db) for payment in payments]
    }

@router.post("/bills/{bill_id}/discount")
def apply_discount(
    bill_id: str,
    discount_data: DiscountApply,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Apply discount to bill (requires approval)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check approval authority
    discount_pct = discount_data.discount_percentage or 0
    if discount_pct > 30 and user.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Discounts >30% require admin approval")
    elif discount_pct > 10 and user.role not in ["accountant", "accounts_manager", "hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Discounts >10% require accountant or manager approval")
    
    bill = db.query(PatientBill).filter(PatientBill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if discount_data.discount_percentage:
        bill.discount_percentage = discount_data.discount_percentage
        bill.discount_amount = bill.subtotal * (discount_data.discount_percentage / 100)
    elif discount_data.discount_amount:
        bill.discount_amount = discount_data.discount_amount
        bill.discount_percentage = (discount_data.discount_amount / bill.subtotal) * 100 if bill.subtotal > 0 else 0
    
    bill.discount_reason = discount_data.reason
    bill.discount_approved_by = user_id
    
    update_bill_totals(bill, db)
    
    create_audit_log(
        bill.hospital_id, bill.id, "discount_applied", user_id,
        f"Discount applied: {bill.discount_percentage}% - {discount_data.reason}",
        bill.discount_amount, db
    )
    
    db.commit()
    db.refresh(bill)
    
    return {"bill": serialize_bill(bill, db)}

@router.post("/bills/{bill_id}/close")
def close_bill(bill_id: str, user_id: str, db: Session = Depends(get_db)):
    """Close/finalize a bill"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["accountant", "accounts_manager", "hospital_admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    bill = db.query(PatientBill).filter(PatientBill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    bill.status = "closed"
    bill.closed_at = datetime.now()
    
    create_audit_log(
        bill.hospital_id, bill.id, "bill_closed", user_id,
        f"Bill closed - Total: ₦{bill.total_amount:,.2f}, Paid: ₦{bill.amount_paid:,.2f}",
        bill.total_amount, db
    )
    
    db.commit()
    db.refresh(bill)
    
    return {"bill": serialize_bill(bill, db)}

# ============= Payment Processing =============

@router.post("/payments")
def process_payment(
    payment_data: PaymentCreate,
    user_id: str,
    hospital_id: str,
    db: Session = Depends(get_db)
):
    """Process a payment"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["accountant", "accounts_manager", "hospital_admin"]:
        raise HTTPException(status_code=403, detail="Only billing staff can process payments")
    
    bill = db.query(PatientBill).filter(PatientBill.id == payment_data.bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Generate payment number
    payment_count = db.query(Payment).filter(Payment.hospital_id == hospital_id).count()
    payment_number = f"PAY-{datetime.now().year}-{payment_count + 1:05d}"
    
    # Create payment
    payment = Payment(
        id=str(uuid.uuid4()),
        payment_number=payment_number,
        bill_id=payment_data.bill_id,
        hospital_id=hospital_id,
        patient_id=bill.patient_id,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        payment_reference=payment_data.payment_reference,
        payment_status="completed",
        received_by=user_id,
        notes=payment_data.notes
    )
    
    db.add(payment)
    
    # Update bill
    bill.amount_paid += payment_data.amount
    bill.balance = bill.total_amount - bill.amount_paid
    bill.updated_at = datetime.now()
    
    # Generate receipt
    receipt = generate_receipt(payment, bill, user_id, hospital_id, db)
    
    create_audit_log(
        hospital_id, bill.id, "payment_received", user_id,
        f"Payment received: ₦{payment_data.amount:,.2f} via {payment_data.payment_method}",
        payment_data.amount, db
    )
    
    db.commit()
    db.refresh(payment)
    db.refresh(receipt)
    
    return {
        "payment": serialize_payment(payment, db),
        "receipt": serialize_receipt(receipt, db),
        "bill": serialize_bill(bill, db)
    }

@router.get("/payments/bill/{bill_id}")
def get_bill_payments(bill_id: str, db: Session = Depends(get_db)):
    """Get all payments for a bill"""
    payments = db.query(Payment).filter(Payment.bill_id == bill_id).all()
    return {"payments": [serialize_payment(p, db) for p in payments]}

# ============= Receipt Management =============

@router.get("/receipts/{receipt_id}")
def get_receipt(receipt_id: str, db: Session = Depends(get_db)):
    """Get receipt details"""
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    payment = db.query(Payment).filter(Payment.id == receipt.payment_id).first()
    bill = db.query(PatientBill).filter(PatientBill.id == receipt.bill_id).first()
    
    return {
        "receipt": serialize_receipt(receipt, db),
        "payment": serialize_payment(payment, db) if payment else None,
        "bill": serialize_bill(bill, db) if bill else None
    }

# ============= Financial Reports =============

@router.get("/reports/daily")
def get_daily_report(
    hospital_id: str,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get daily financial report"""
    target_date = datetime.fromisoformat(date) if date else datetime.now()
    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    # Payments received
    payments = db.query(Payment).filter(
        Payment.hospital_id == hospital_id,
        Payment.payment_date >= start_of_day,
        Payment.payment_date < end_of_day,
        Payment.payment_status == "completed"
    ).all()
    
    total_collected = sum(p.amount for p in payments)
    
    # Payment methods breakdown
    payment_methods = {}
    for p in payments:
        if p.payment_method not in payment_methods:
            payment_methods[p.payment_method] = 0
        payment_methods[p.payment_method] += p.amount
    
    # New bills created
    new_bills = db.query(PatientBill).filter(
        PatientBill.hospital_id == hospital_id,
        PatientBill.created_at >= start_of_day,
        PatientBill.created_at < end_of_day
    ).count()
    
    # Outstanding bills
    outstanding = db.query(func.sum(PatientBill.balance)).filter(
        PatientBill.hospital_id == hospital_id,
        PatientBill.status == "open",
        PatientBill.balance > 0
    ).scalar() or 0
    
    return {
        "date": target_date.date().isoformat(),
        "totalCollected": total_collected,
        "paymentMethodsBreakdown": payment_methods,
        "paymentsCount": len(payments),
        "newBills": new_bills,
        "outstandingBalance": outstanding
    }

@router.get("/reports/monthly")
def get_monthly_report(
    hospital_id: str,
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    """Get monthly financial report"""
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    # Total revenue
    payments = db.query(Payment).filter(
        Payment.hospital_id == hospital_id,
        Payment.payment_date >= start_date,
        Payment.payment_date < end_date,
        Payment.payment_status == "completed"
    ).all()
    
    total_revenue = sum(p.amount for p in payments)
    
    # Revenue by category
    bill_items = db.query(BillItem).join(PatientBill).filter(
        PatientBill.hospital_id == hospital_id,
        BillItem.created_at >= start_date,
        BillItem.created_at < end_date
    ).all()
    
    revenue_by_category = {}
    for item in bill_items:
        if item.service_category not in revenue_by_category:
            revenue_by_category[item.service_category] = 0
        revenue_by_category[item.service_category] += item.total_price
    
    # Discounts given
    bills = db.query(PatientBill).filter(
        PatientBill.hospital_id == hospital_id,
        PatientBill.created_at >= start_date,
        PatientBill.created_at < end_date
    ).all()
    
    total_discounts = sum(b.discount_amount for b in bills)
    
    return {
        "period": f"{year}-{month:02d}",
        "totalRevenue": total_revenue,
        "revenueByCat egory": revenue_by_category,
        "totalDiscounts": total_discounts,
        "paymentsCount": len(payments),
        "billsGenerated": len(bills)
    }

# ============= Helper Functions =============

def get_or_create_patient_bill(patient_id: str, hospital_id: str, db: Session) -> PatientBill:
    """Get existing open bill or create new one"""
    bill = db.query(PatientBill).filter(
        PatientBill.patient_id == patient_id,
        PatientBill.hospital_id == hospital_id,
        PatientBill.status == "open"
    ).first()
    
    if not bill:
        bill_count = db.query(PatientBill).filter(PatientBill.hospital_id == hospital_id).count()
        bill_number = f"BIL-{datetime.now().year}-{bill_count + 1:05d}"
        
        bill = PatientBill(
            id=str(uuid.uuid4()),
            bill_number=bill_number,
            hospital_id=hospital_id,
            patient_id=patient_id,
            visit_type="outpatient",
            status="open"
        )
        db.add(bill)
        db.flush()
    
    return bill

def update_bill_totals(bill: PatientBill, db: Session):
    """Recalculate bill totals"""
    items = db.query(BillItem).filter(BillItem.bill_id == bill.id).all()
    
    bill.subtotal = sum(item.total_price for item in items)
    bill.total_amount = bill.subtotal - bill.discount_amount + bill.tax_amount
    bill.balance = bill.total_amount - bill.amount_paid
    bill.patient_responsibility = bill.total_amount - bill.insurance_coverage
    bill.updated_at = datetime.now()

def generate_receipt(payment: Payment, bill: PatientBill, user_id: str, hospital_id: str, db: Session) -> Receipt:
    """Generate receipt for payment"""
    receipt_count = db.query(Receipt).filter(Receipt.hospital_id == hospital_id).count()
    receipt_number = f"REC-{datetime.now().year}-{receipt_count + 1:05d}"
    
    receipt = Receipt(
        id=str(uuid.uuid4()),
        receipt_number=receipt_number,
        payment_id=payment.id,
        bill_id=bill.id,
        hospital_id=hospital_id,
        patient_id=bill.patient_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        issued_by=user_id
    )
    
    db.add(receipt)
    return receipt

def create_audit_log(hospital_id: str, bill_id: str, action_type: str, user_id: str, details: str, amount: float, db: Session):
    """Create audit trail entry"""
    audit = BillingAudit(
        id=str(uuid.uuid4()),
        hospital_id=hospital_id,
        bill_id=bill_id,
        action_type=action_type,
        action_by=user_id,
        action_details=details,
        amount_involved=amount
    )
    db.add(audit)

# ============= Serializers =============

def serialize_pricing(pricing: ServicePricing):
    return {
        "id": pricing.id,
        "serviceCategory": pricing.service_category,
        "serviceName": pricing.service_name,
        "serviceCode": pricing.service_code,
        "basePrice": pricing.base_price,
        "insurancePrice": pricing.insurance_price,
        "staffPrice": pricing.staff_price,
        "description": pricing.description,
        "isActive": pricing.is_active,
        "formattedPrice": f"₦{pricing.base_price:,.2f}"
    }

def serialize_bill(bill: PatientBill, db: Session):
    patient = db.query(Patient).filter(Patient.id == bill.patient_id).first()
    
    return {
        "id": bill.id,
        "billNumber": bill.bill_number,
        "patient": {
            "id": patient.id,
            "name": f"{patient.first_name} {patient.last_name}",
            "mrn": patient.mrn
        } if patient else None,
        "visitType": bill.visit_type,
        "status": bill.status,
        "subtotal": bill.subtotal,
        "discountAmount": bill.discount_amount,
        "discountPercentage": bill.discount_percentage,
        "taxAmount": bill.tax_amount,
        "totalAmount": bill.total_amount,
        "amountPaid": bill.amount_paid,
        "balance": bill.balance,
        "insuranceCoverage": bill.insurance_coverage,
        "patientResponsibility": bill.patient_responsibility,
        "createdAt": bill.created_at.isoformat() if bill.created_at else None,
        "closedAt": bill.closed_at.isoformat() if bill.closed_at else None
    }

def serialize_bill_item(item: BillItem, db: Session):
    performed_by_user = None
    if item.performed_by:
        user = db.query(User).filter(User.id == item.performed_by).first()
        if user:
            performed_by_user = {"id": user.id, "name": user.full_name, "role": user.role}
    
    return {
        "id": item.id,
        "serviceCategory": item.service_category,
        "serviceName": item.service_name,
        "quantity": item.quantity,
        "unitPrice": item.unit_price,
        "totalPrice": item.total_price,
        "performedBy": performed_by_user,
        "performedAt": item.performed_at.isoformat() if item.performed_at else None,
        "department": item.department,
        "notes": item.notes,
        "createdAt": item.created_at.isoformat() if item.created_at else None
    }

def serialize_payment(payment: Payment, db: Session):
    received_by_user = db.query(User).filter(User.id == payment.received_by).first()
    
    return {
        "id": payment.id,
        "paymentNumber": payment.payment_number,
        "amount": payment.amount,
        "paymentMethod": payment.payment_method,
        "paymentReference": payment.payment_reference,
        "paymentStatus": payment.payment_status,
        "receivedBy": {
            "id": received_by_user.id,
            "name": received_by_user.full_name
        } if received_by_user else None,
        "paymentDate": payment.payment_date.isoformat() if payment.payment_date else None,
        "formattedAmount": f"₦{payment.amount:,.2f}"
    }

def serialize_receipt(receipt: Receipt, db: Session):
    issued_by_user = db.query(User).filter(User.id == receipt.issued_by).first()
    
    return {
        "id": receipt.id,
        "receiptNumber": receipt.receipt_number,
        "amount": receipt.amount,
        "paymentMethod": receipt.payment_method,
        "issuedBy": {
            "id": issued_by_user.id,
            "name": issued_by_user.full_name
        } if issued_by_user else None,
        "issuedAt": receipt.issued_at.isoformat() if receipt.issued_at else None,
        "formattedAmount": f"₦{receipt.amount:,.2f}"
    }
