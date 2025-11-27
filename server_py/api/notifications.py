from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from server_py.db.session import get_db
from server_py.services.storage import StorageService

router = APIRouter(prefix="/api", tags=["Notifications"])

def notification_to_dict(notification) -> Dict[str, Any]:
    return {
        "id": notification.id,
        "departmentId": notification.department_id,
        "patientId": notification.patient_id,
        "appointmentId": notification.appointment_id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "priority": notification.priority,
        "requestedBy": notification.requested_by,
        "status": notification.status,
        "actionData": notification.action_data,
        "createdAt": notification.created_at.isoformat() if notification.created_at else None,
        "updatedAt": notification.updated_at.isoformat() if notification.updated_at else None
    }

@router.get("/departments/{department_id}/notifications")
def get_department_notifications(department_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    notifications = storage.get_department_notifications(department_id)
    return [notification_to_dict(n) for n in notifications]

@router.post("/departments/{department_id}/notifications")
def create_notification(department_id: str, notification_data: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    notification_data["departmentId"] = department_id
    notification = storage.create_notification(notification_data)
    return notification_to_dict(notification)

@router.patch("/notifications/{notification_id}")
def update_notification(notification_id: str, updates: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    notification = storage.update_notification(notification_id, updates)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return notification_to_dict(notification)

@router.get("/notifications/{notification_id}")
def get_notification(notification_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    notification = storage.get_notification(notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return notification_to_dict(notification)
