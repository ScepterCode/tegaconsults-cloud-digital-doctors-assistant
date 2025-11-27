from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from server_py.db.session import get_db
from server_py.services.storage import StorageService

router = APIRouter(prefix="/api", tags=["Departments"])

def department_to_dict(department) -> Dict[str, Any]:
    return {
        "id": department.id,
        "hospitalAdminId": department.hospital_admin_id,
        "name": department.name,
        "description": department.description,
        "headStaffId": department.head_staff_id,
        "status": department.status,
        "createdAt": department.created_at.isoformat() if department.created_at else None,
        "updatedAt": department.updated_at.isoformat() if department.updated_at else None
    }

@router.get("/departments")
def get_all_departments(db: Session = Depends(get_db)):
    storage = StorageService(db)
    departments = storage.get_all_departments()
    return [department_to_dict(d) for d in departments]

@router.get("/departments/{department_id}")
def get_department(department_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    department = storage.get_department(department_id)
    
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return department_to_dict(department)

@router.get("/admin/departments/{admin_id}")
def get_admin_departments(admin_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    departments = storage.get_departments_by_hospital(admin_id)
    return [department_to_dict(d) for d in departments]

@router.post("/admin/departments")
def create_department(department_data: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    department = storage.create_department(department_data)
    return department_to_dict(department)

@router.patch("/departments/{department_id}")
def update_department(department_id: str, updates: Dict[str, Any], db: Session = Depends(get_db)):
    storage = StorageService(db)
    department = storage.update_department(department_id, updates)
    
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return department_to_dict(department)

@router.get("/admin/departments/staff")
def get_staff_counts(db: Session = Depends(get_db)):
    storage = StorageService(db)
    users = storage.get_all_users()
    
    staff_counts = {}
    for user in users:
        if user.department_id and user.role in ["doctor", "nurse"]:
            staff_counts[user.department_id] = staff_counts.get(user.department_id, 0) + 1
    
    return staff_counts
