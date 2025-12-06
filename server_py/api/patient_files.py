from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import os
import base64

from server_py.db.session import get_db
from server_py.models.patient_file import PatientFile
from server_py.models.user import User
from server_py.models.patient import Patient
from pydantic import BaseModel

router = APIRouter(prefix="/api/patient-files", tags=["patient-files"])

class FileUpload(BaseModel):
    patient_id: str
    file_type: str
    file_name: str
    file_data: str  # Base64 encoded
    description: Optional[str] = None
    category: Optional[str] = None

@router.post("/upload")
def upload_patient_file(
    file_data: FileUpload,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Upload a file for a patient (lab results, scans, reports, etc.)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check role permissions
    allowed_roles = ["doctor", "nurse", "lab_tech", "pharmacist", "admin", "system_admin"]
    if user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="You don't have permission to upload files")
    
    patient = db.query(Patient).filter(Patient.id == file_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Save file
    upload_dir = f"media/patient_files/{file_data.patient_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = file_data.file_name.split('.')[-1] if '.' in file_data.file_name else 'pdf'
    filename = f"{uuid.uuid4()}.{file_ext}"
    filepath = os.path.join(upload_dir, filename)
    
    try:
        # Decode base64 and save
        file_bytes = base64.b64decode(file_data.file_data.split(',')[1] if ',' in file_data.file_data else file_data.file_data)
        with open(filepath, 'wb') as f:
            f.write(file_bytes)
        
        file_size = f"{len(file_bytes) / 1024:.2f} KB"
        file_url = f"/media/patient_files/{file_data.patient_id}/{filename}"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save file: {str(e)}")
    
    patient_file = PatientFile(
        id=str(uuid.uuid4()),
        patient_id=file_data.patient_id,
        uploaded_by=user_id,
        file_type=file_data.file_type,
        file_name=file_data.file_name,
        file_url=file_url,
        file_size=file_size,
        description=file_data.description,
        category=file_data.category,
        uploaded_by_role=user.role
    )
    
    db.add(patient_file)
    db.commit()
    db.refresh(patient_file)
    
    return {"file": serialize_file(patient_file, db)}

@router.get("/patient/{patient_id}")
def get_patient_files(
    patient_id: str,
    file_type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all files for a patient"""
    query = db.query(PatientFile).filter(PatientFile.patient_id == patient_id)
    
    if file_type:
        query = query.filter(PatientFile.file_type == file_type)
    if category:
        query = query.filter(PatientFile.category == category)
    
    files = query.order_by(PatientFile.created_at.desc()).all()
    return {"files": [serialize_file(f, db) for f in files]}

@router.delete("/{file_id}")
def delete_patient_file(file_id: str, user_id: str, db: Session = Depends(get_db)):
    """Delete a patient file"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role not in ["doctor", "admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only doctors and admins can delete files")
    
    patient_file = db.query(PatientFile).filter(PatientFile.id == file_id).first()
    if not patient_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete physical file
    try:
        filepath = patient_file.file_url.lstrip('/')
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass
    
    db.delete(patient_file)
    db.commit()
    
    return {"message": "File deleted successfully"}

def serialize_file(patient_file: PatientFile, db: Session):
    uploader = db.query(User).filter(User.id == patient_file.uploaded_by).first()
    
    return {
        "id": patient_file.id,
        "patientId": patient_file.patient_id,
        "fileType": patient_file.file_type,
        "fileName": patient_file.file_name,
        "fileUrl": patient_file.file_url,
        "fileSize": patient_file.file_size,
        "description": patient_file.description,
        "category": patient_file.category,
        "uploadedBy": {
            "id": uploader.id,
            "name": uploader.full_name,
            "role": uploader.role
        } if uploader else None,
        "createdAt": patient_file.created_at.isoformat() if patient_file.created_at else None
    }
