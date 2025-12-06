from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid

from server_py.db.session import get_db
from server_py.models.pharmacy_inventory import PharmacyInventory, InventoryTransaction
from server_py.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/pharmacy-inventory", tags=["pharmacy-inventory"])

class InventoryCreate(BaseModel):
    medication_name: str
    generic_name: Optional[str] = None
    category: str
    dosage_form: str
    strength: str
    quantity_in_stock: int
    reorder_level: int = 10
    unit_price: float
    supplier: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class InventoryUpdate(BaseModel):
    medication_name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    reorder_level: Optional[int] = None
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class StockAdjustment(BaseModel):
    quantity: int
    transaction_type: str  # restock, dispense, adjustment, expired
    notes: Optional[str] = None
    prescription_id: Optional[str] = None

@router.get("")
def get_inventory(
    hospital_id: str,
    category: Optional[str] = None,
    low_stock: Optional[bool] = None,
    expired: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get pharmacy inventory"""
    query = db.query(PharmacyInventory).filter(PharmacyInventory.hospital_id == hospital_id)
    
    if category:
        query = query.filter(PharmacyInventory.category == category)
    
    if low_stock:
        query = query.filter(PharmacyInventory.quantity_in_stock <= PharmacyInventory.reorder_level)
    
    if expired:
        query = query.filter(PharmacyInventory.expiry_date < datetime.now())
    
    items = query.order_by(PharmacyInventory.medication_name).all()
    return {"inventory": [serialize_inventory(item) for item in items]}

@router.post("")
def create_inventory_item(
    item_data: InventoryCreate,
    hospital_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Create new inventory item"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["pharmacist", "hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only pharmacists and admins can manage inventory")
    
    expiry_date = None
    if item_data.expiry_date:
        try:
            expiry_date = datetime.fromisoformat(item_data.expiry_date.replace('Z', '+00:00'))
        except:
            pass
    
    item = PharmacyInventory(
        id=str(uuid.uuid4()),
        hospital_id=hospital_id,
        medication_name=item_data.medication_name,
        generic_name=item_data.generic_name,
        category=item_data.category,
        dosage_form=item_data.dosage_form,
        strength=item_data.strength,
        quantity_in_stock=item_data.quantity_in_stock,
        reorder_level=item_data.reorder_level,
        unit_price=item_data.unit_price,
        supplier=item_data.supplier,
        batch_number=item_data.batch_number,
        expiry_date=expiry_date,
        location=item_data.location,
        notes=item_data.notes
    )
    
    db.add(item)
    
    # Create transaction record
    transaction = InventoryTransaction(
        id=str(uuid.uuid4()),
        inventory_id=item.id,
        transaction_type="restock",
        quantity=item_data.quantity_in_stock,
        previous_quantity=0,
        new_quantity=item_data.quantity_in_stock,
        performed_by=user_id,
        notes="Initial stock"
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(item)
    
    return {"item": serialize_inventory(item)}

@router.put("/{item_id}")
def update_inventory_item(
    item_id: str,
    item_data: InventoryUpdate,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Update inventory item details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["pharmacist", "hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only pharmacists and admins can manage inventory")
    
    item = db.query(PharmacyInventory).filter(PharmacyInventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item_data.medication_name:
        item.medication_name = item_data.medication_name
    if item_data.generic_name:
        item.generic_name = item_data.generic_name
    if item_data.category:
        item.category = item_data.category
    if item_data.dosage_form:
        item.dosage_form = item_data.dosage_form
    if item_data.strength:
        item.strength = item_data.strength
    if item_data.reorder_level is not None:
        item.reorder_level = item_data.reorder_level
    if item_data.unit_price is not None:
        item.unit_price = item_data.unit_price
    if item_data.supplier:
        item.supplier = item_data.supplier
    if item_data.batch_number:
        item.batch_number = item_data.batch_number
    if item_data.expiry_date:
        try:
            item.expiry_date = datetime.fromisoformat(item_data.expiry_date.replace('Z', '+00:00'))
        except:
            pass
    if item_data.location:
        item.location = item_data.location
    if item_data.notes:
        item.notes = item_data.notes
    
    item.updated_at = datetime.now()
    db.commit()
    db.refresh(item)
    
    return {"item": serialize_inventory(item)}

@router.post("/{item_id}/adjust-stock")
def adjust_stock(
    item_id: str,
    adjustment: StockAdjustment,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Adjust stock quantity (restock, dispense, etc.)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["pharmacist", "hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only pharmacists and admins can adjust stock")
    
    item = db.query(PharmacyInventory).filter(PharmacyInventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    previous_quantity = item.quantity_in_stock
    
    if adjustment.transaction_type in ["restock", "adjustment"]:
        new_quantity = previous_quantity + adjustment.quantity
    elif adjustment.transaction_type in ["dispense", "expired"]:
        new_quantity = previous_quantity - adjustment.quantity
        if new_quantity < 0:
            raise HTTPException(status_code=400, detail="Insufficient stock")
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")
    
    item.quantity_in_stock = new_quantity
    item.updated_at = datetime.now()
    
    # Create transaction record
    transaction = InventoryTransaction(
        id=str(uuid.uuid4()),
        inventory_id=item.id,
        transaction_type=adjustment.transaction_type,
        quantity=adjustment.quantity,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        performed_by=user_id,
        prescription_id=adjustment.prescription_id,
        notes=adjustment.notes
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(item)
    
    return {"item": serialize_inventory(item)}

@router.get("/{item_id}/transactions")
def get_item_transactions(item_id: str, db: Session = Depends(get_db)):
    """Get transaction history for an item"""
    transactions = db.query(InventoryTransaction).filter(
        InventoryTransaction.inventory_id == item_id
    ).order_by(InventoryTransaction.transaction_date.desc()).all()
    
    return {"transactions": [serialize_transaction(t, db) for t in transactions]}

@router.delete("/{item_id}")
def delete_inventory_item(item_id: str, user_id: str, db: Session = Depends(get_db)):
    """Delete inventory item"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete inventory items")
    
    item = db.query(PharmacyInventory).filter(PharmacyInventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Item deleted successfully"}

@router.get("/stats/summary")
def get_inventory_stats(hospital_id: str, db: Session = Depends(get_db)):
    """Get inventory statistics"""
    items = db.query(PharmacyInventory).filter(PharmacyInventory.hospital_id == hospital_id).all()
    
    total_items = len(items)
    total_value = sum(item.quantity_in_stock * item.unit_price for item in items)
    low_stock_items = len([item for item in items if item.quantity_in_stock <= item.reorder_level])
    expired_items = len([item for item in items if item.expiry_date and item.expiry_date < datetime.now()])
    expiring_soon = len([
        item for item in items 
        if item.expiry_date and item.expiry_date > datetime.now() 
        and (item.expiry_date - datetime.now()).days <= 30
    ])
    
    categories = {}
    for item in items:
        if item.category not in categories:
            categories[item.category] = 0
        categories[item.category] += 1
    
    return {
        "totalItems": total_items,
        "totalValue": total_value,
        "lowStockItems": low_stock_items,
        "expiredItems": expired_items,
        "expiringSoon": expiring_soon,
        "byCategory": categories
    }

def serialize_inventory(item: PharmacyInventory):
    is_low_stock = item.quantity_in_stock <= item.reorder_level
    is_expired = item.expiry_date and item.expiry_date < datetime.now()
    is_expiring_soon = (
        item.expiry_date and 
        item.expiry_date > datetime.now() and 
        (item.expiry_date - datetime.now()).days <= 30
    )
    
    return {
        "id": item.id,
        "hospitalId": item.hospital_id,
        "medicationName": item.medication_name,
        "genericName": item.generic_name,
        "category": item.category,
        "dosageForm": item.dosage_form,
        "strength": item.strength,
        "quantityInStock": item.quantity_in_stock,
        "reorderLevel": item.reorder_level,
        "unitPrice": item.unit_price,
        "totalValue": item.quantity_in_stock * item.unit_price,
        "supplier": item.supplier,
        "batchNumber": item.batch_number,
        "expiryDate": item.expiry_date.isoformat() if item.expiry_date else None,
        "location": item.location,
        "notes": item.notes,
        "isLowStock": is_low_stock,
        "isExpired": is_expired,
        "isExpiringSoon": is_expiring_soon,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None
    }

def serialize_transaction(transaction: InventoryTransaction, db: Session):
    user = db.query(User).filter(User.id == transaction.performed_by).first()
    
    return {
        "id": transaction.id,
        "inventoryId": transaction.inventory_id,
        "transactionType": transaction.transaction_type,
        "quantity": transaction.quantity,
        "previousQuantity": transaction.previous_quantity,
        "newQuantity": transaction.new_quantity,
        "performedBy": {
            "id": user.id,
            "name": user.full_name,
            "role": user.role
        } if user else None,
        "prescriptionId": transaction.prescription_id,
        "notes": transaction.notes,
        "transactionDate": transaction.transaction_date.isoformat() if transaction.transaction_date else None
    }
