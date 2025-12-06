from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from server_py.db.session import get_db
from server_py.models.doctor_note import DoctorNote
from server_py.models.user import User
from server_py.models.patient import Patient
from pydantic import BaseModel

router = APIRouter(prefix="/api/doctor-notes", tags=["doctor-notes"])

class NoteCreate(BaseModel):
    patient_id: str
    note_type: str
    title: Optional[str] = None
    content: str
    tags: Optional[str] = None
    is_private: Optional[str] = "0"

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    note_type: Optional[str] = None
    tags: Optional[str] = None
    is_private: Optional[str] = None

@router.post("")
def create_note(note_data: NoteCreate, doctor_id: str, db: Session = Depends(get_db)):
    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Only doctors can create notes")
    
    patient = db.query(Patient).filter(Patient.id == note_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    note = DoctorNote(
        id=str(uuid.uuid4()),
        patient_id=note_data.patient_id,
        doctor_id=doctor_id,
        note_type=note_data.note_type,
        title=note_data.title,
        content=note_data.content,
        tags=note_data.tags,
        is_private=note_data.is_private
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return {"note": serialize_note(note, db)}

@router.get("/patient/{patient_id}")
def get_patient_notes(
    patient_id: str,
    doctor_id: Optional[str] = None,
    note_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DoctorNote).filter(DoctorNote.patient_id == patient_id)
    
    if doctor_id:
        # Show all non-private notes + doctor's own private notes
        query = query.filter(
            (DoctorNote.is_private == "0") | 
            ((DoctorNote.is_private == "1") & (DoctorNote.doctor_id == doctor_id))
        )
    else:
        # Only show non-private notes
        query = query.filter(DoctorNote.is_private == "0")
    
    if note_type:
        query = query.filter(DoctorNote.note_type == note_type)
    
    notes = query.order_by(DoctorNote.created_at.desc()).all()
    return {"notes": [serialize_note(n, db) for n in notes]}

@router.get("/{note_id}")
def get_note(note_id: str, db: Session = Depends(get_db)):
    note = db.query(DoctorNote).filter(DoctorNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"note": serialize_note(note, db)}

@router.patch("/{note_id}")
def update_note(note_id: str, updates: NoteUpdate, doctor_id: str, db: Session = Depends(get_db)):
    note = db.query(DoctorNote).filter(DoctorNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note.doctor_id != doctor_id:
        raise HTTPException(status_code=403, detail="You can only edit your own notes")
    
    if updates.title is not None:
        note.title = updates.title
    if updates.content is not None:
        note.content = updates.content
    if updates.note_type is not None:
        note.note_type = updates.note_type
    if updates.tags is not None:
        note.tags = updates.tags
    if updates.is_private is not None:
        note.is_private = updates.is_private
    
    note.updated_at = datetime.now()
    db.commit()
    db.refresh(note)
    
    return {"note": serialize_note(note, db)}

@router.delete("/{note_id}")
def delete_note(note_id: str, doctor_id: str, db: Session = Depends(get_db)):
    note = db.query(DoctorNote).filter(DoctorNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note.doctor_id != doctor_id:
        raise HTTPException(status_code=403, detail="You can only delete your own notes")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}

def serialize_note(note: DoctorNote, db: Session):
    doctor = db.query(User).filter(User.id == note.doctor_id).first()
    
    return {
        "id": note.id,
        "patientId": note.patient_id,
        "doctor": {
            "id": doctor.id,
            "name": doctor.full_name
        } if doctor else None,
        "noteType": note.note_type,
        "title": note.title,
        "content": note.content,
        "tags": note.tags,
        "isPrivate": note.is_private == "1",
        "createdAt": note.created_at.isoformat() if note.created_at else None,
        "updatedAt": note.updated_at.isoformat() if note.updated_at else None
    }
