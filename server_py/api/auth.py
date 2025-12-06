from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from server_py.db.session import get_db
from server_py.services.storage import StorageService
from server_py.schemas.user import LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    storage = StorageService(db)
    
    existing_user = storage.get_user_by_username(request.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_data = {
        "username": request.username,
        "password": request.password,
        "fullName": request.full_name,
        "role": request.role,
        "departmentId": request.department_id,
        "is_active": 1
    }
    
    new_user = storage.create_user(user_data)
    
    return {
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "fullName": new_user.full_name,
            "role": new_user.role,
            "departmentId": new_user.department_id,
            "isActive": new_user.is_active
        },
        "message": "User registered successfully"
    }

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    storage = StorageService(db)
    user = None
    
    if request.auth_method == "credentials":
        user = storage.get_user_by_username(request.username)
        if user and user.password != request.password:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    elif request.auth_method == "nin":
        user = storage.get_user_by_nin(request.nin)
    elif request.auth_method == "fingerprint":
        user = storage.get_user_by_fingerprint(request.fingerprint_data)
    elif request.auth_method == "facial":
        user = storage.get_user_by_facial(request.facial_data)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.is_active != 1:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "fullName": user.full_name,
            "role": user.role,
            "departmentId": user.department_id,
            "hospitalId": user.hospital_id,
            "isActive": user.is_active
        },
        "message": "Login successful"
    }

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    storage = StorageService(db)
    users = storage.get_all_users()
    return [
        {
            "id": u.id,
            "username": u.username,
            "fullName": u.full_name,
            "role": u.role,
            "departmentId": u.department_id,
            "hospitalId": u.hospital_id,
            "isActive": u.is_active
        }
        for u in users
    ]

@router.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    storage = StorageService(db)
    user = storage.get_user(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "username": user.username,
        "fullName": user.full_name,
        "role": user.role,
        "departmentId": user.department_id,
        "hospitalId": user.hospital_id,
        "isActive": user.is_active
    }
