from sqlalchemy import Column, String, DateTime, Float, Integer, Text, Boolean, func
from server_py.db.session import Base
import uuid

class ServicePricing(Base):
    """Configurable pricing for all hospital services"""
    __tablename__ = "service_pricing"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String, nullable=False)
    service_category = Column(String, nullable=False)  # consultation, lab, pharmacy, ward, procedure, admin
    service_name = Column(String, nullable=False)
    service_code = Column(String, nullable=True)  # For standardization
    base_price = Column(Float, nullable=False)
    insurance_price = Column(Float, nullable=True)  # Negotiated insurance rate
    staff_price = Column(Float, nullable=True)  # Staff discount rate
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class PatientBill(Base):
    """Main patient billing record"""
    __tablename__ = "patient_bills"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bill_number = Column(String, unique=True, nullable=False)  # BIL-2024-00001
    hospital_id = Column(String, nullable=False)
    patient_id = Column(String, nullable=False)
    visit_type = Column(String, nullable=False)  # outpatient, inpatient, emergency
    admission_id = Column(String, nullable=True)  # If inpatient
    status = Column(String, nullable=False, default="open")  # open, closed, cancelled
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    discount_percentage = Column(Float, default=0.0)
    discount_reason = Column(Text, nullable=True)
    discount_approved_by = Column(String, nullable=True)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    insurance_coverage = Column(Float, default=0.0)
    patient_responsibility = Column(Float, default=0.0)
    insurance_company = Column(String, nullable=True)
    insurance_policy = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime, nullable=True)

class BillItem(Base):
    """Individual charges on a bill"""
    __tablename__ = "bill_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    bill_id = Column(String, nullable=False)
    service_category = Column(String, nullable=False)
    service_name = Column(String, nullable=False)
    service_code = Column(String, nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    performed_by = Column(String, nullable=True)  # Doctor/Staff ID
    performed_at = Column(DateTime, nullable=True)
    department = Column(String, nullable=True)
    reference_id = Column(String, nullable=True)  # Link to appointment, prescription, etc.
    reference_type = Column(String, nullable=True)  # appointment, prescription, lab_order, etc.
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Payment(Base):
    """Payment transactions"""
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_number = Column(String, unique=True, nullable=False)  # PAY-2024-00001
    bill_id = Column(String, nullable=False)
    hospital_id = Column(String, nullable=False)
    patient_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)  # cash, card, transfer, insurance, mobile_money
    payment_reference = Column(String, nullable=True)  # Transaction reference
    payment_status = Column(String, nullable=False, default="completed")  # completed, pending, failed, refunded
    received_by = Column(String, nullable=False)  # Cashier/Billing officer ID
    notes = Column(Text, nullable=True)
    payment_date = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

class Receipt(Base):
    """Payment receipts"""
    __tablename__ = "receipts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    receipt_number = Column(String, unique=True, nullable=False)  # REC-2024-00001
    payment_id = Column(String, nullable=False)
    bill_id = Column(String, nullable=False)
    hospital_id = Column(String, nullable=False)
    patient_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    issued_by = Column(String, nullable=False)
    issued_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

class BillingAudit(Base):
    """Audit trail for billing actions"""
    __tablename__ = "billing_audit"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String, nullable=False)
    bill_id = Column(String, nullable=True)
    action_type = Column(String, nullable=False)  # charge_added, payment_received, discount_applied, bill_closed
    action_by = Column(String, nullable=False)  # User ID
    action_details = Column(Text, nullable=True)
    amount_involved = Column(Float, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())
