from sqlalchemy import Column, String, DateTime, Float, Integer, Text, func
from server_py.db.session import Base
import uuid

class PharmacyInventory(Base):
    __tablename__ = "pharmacy_inventory"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String, nullable=False)
    medication_name = Column(String, nullable=False)
    generic_name = Column(String, nullable=True)
    category = Column(String, nullable=False)  # antibiotic, painkiller, antiviral, etc.
    dosage_form = Column(String, nullable=False)  # tablet, capsule, syrup, injection, etc.
    strength = Column(String, nullable=False)  # e.g., "500mg", "10ml"
    quantity_in_stock = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=10)
    unit_price = Column(Float, nullable=False)
    supplier = Column(String, nullable=True)
    batch_number = Column(String, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    location = Column(String, nullable=True)  # shelf/cabinet location
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inventory_id = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)  # restock, dispense, adjustment, expired
    quantity = Column(Integer, nullable=False)
    previous_quantity = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    performed_by = Column(String, nullable=False)  # User ID
    prescription_id = Column(String, nullable=True)  # If dispensed for prescription
    notes = Column(Text, nullable=True)
    transaction_date = Column(DateTime, server_default=func.now())
