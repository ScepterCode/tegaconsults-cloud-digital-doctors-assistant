"""
Telemedicine API Endpoints
Video consultation scheduling and management
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from server_py.db.session import get_db
from server_py.models.telemedicine_session import TelemedicineSession, SessionStatus
from server_py.models.user import User
from server_py.models.patient import Patient
from server_py.services.video_provider import video_provider
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/telemedicine", tags=["telemedicine"])

# Pydantic schemas
class SessionCreate(BaseModel):
    patient_id: str
    doctor_id: str
    hospital_id: str
    scheduled_time: datetime
    reason: Optional[str] = None

class SessionUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    prescription_id: Optional[str] = None

class SessionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    hospital_id: str
    scheduled_time: datetime
    actual_start_time: Optional[datetime]
    actual_end_time: Optional[datetime]
    duration_minutes: Optional[int]
    video_room_id: Optional[str]
    status: str
    reason: Optional[str]
    notes: Optional[str]
    
    class Config:
        from_attributes = True

class VideoTokenResponse(BaseModel):
    session_id: str
    token: str
    channel_name: str
    uid: int
    app_id: str
    expires_at: int
    patient_name: str
    doctor_name: str

@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def schedule_consultation(session_data: SessionCreate, db: Session = Depends(get_db)):
    """Schedule a new telemedicine consultation"""
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == session_data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Verify doctor exists and is a doctor
    doctor = db.query(User).filter(
        User.id == session_data.doctor_id,
        User.role == "doctor"
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found or invalid role")
    
    # Create unique channel name
    channel_name = f"consult_{uuid.uuid4().hex[:12]}"
    
    # Create session
    new_session = TelemedicineSession(
        id=str(uuid.uuid4()),
        patient_id=session_data.patient_id,
        doctor_id=session_data.doctor_id,
        hospital_id=session_data.hospital_id,
        scheduled_time=session_data.scheduled_time,
        video_room_id=channel_name,
        status=SessionStatus.SCHEDULED,
        reason=session_data.reason
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session

@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    hospital_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List telemedicine sessions with optional filters"""
    query = db.query(TelemedicineSession)
    
    if hospital_id:
        query = query.filter(TelemedicineSession.hospital_id == hospital_id)
    if doctor_id:
        query = query.filter(TelemedicineSession.doctor_id == doctor_id)
    if patient_id:
        query = query.filter(TelemedicineSession.patient_id == patient_id)
    if status:
        query = query.filter(TelemedicineSession.status == status)
    
    sessions = query.order_by(TelemedicineSession.scheduled_time.desc()).all()
    return sessions

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get session details"""
    session = db.query(TelemedicineSession).filter(TelemedicineSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/sessions/{session_id}/start", response_model=VideoTokenResponse)
async def start_session(session_id: str, user_id: str, db: Session = Depends(get_db)):
    """Start a video consultation and generate Agora token"""
    session = db.query(TelemedicineSession).filter(TelemedicineSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify user is either the doctor or patient
    if user_id not in [session.doctor_id, session.patient_id]:
        raise HTTPException(status_code=403, detail="Not authorized to join this session")
    
    # Update session status
    if session.status == SessionStatus.SCHEDULED:
        session.status = SessionStatus.IN_PROGRESS
        session.actual_start_time = datetime.now()
    
    # Generate Agora token
    uid = hash(user_id) % 1000000  # Generate numeric UID from user_id
    token_data = video_provider.generate_rtc_token(
        channel_name=session.video_room_id,
        uid=uid,
        role=1,  # Publisher (can send and receive)
        expiration_seconds=7200  # 2 hours
    )
    
    # Store token in session
    session.agora_token = token_data["token"]
    db.commit()
    
    # Get participant names
    patient = db.query(Patient).filter(Patient.id == session.patient_id).first()
    doctor = db.query(User).filter(User.id == session.doctor_id).first()
    
    return {
        "session_id": session.id,
        "token": token_data["token"],
        "channel_name": token_data["channel_name"],
        "uid": uid,
        "app_id": token_data["app_id"],
        "expires_at": token_data["expires_at"],
        "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
        "doctor_name": doctor.full_name if doctor else "Unknown"
    }

@router.post("/sessions/{session_id}/end")
async def end_session(session_id: str, db: Session = Depends(get_db)):
    """End a video consultation"""
    session = db.query(TelemedicineSession).filter(TelemedicineSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session is not in progress")
    
    # Update session
    session.status = SessionStatus.COMPLETED
    session.actual_end_time = datetime.now()
    
    # Calculate duration
    if session.actual_start_time:
        duration = (session.actual_end_time - session.actual_start_time).total_seconds() / 60
        session.duration_minutes = int(duration)
    
    db.commit()
    db.refresh(session)
    
    return {
        "message": "Session ended successfully",
        "session_id": session.id,
        "duration_minutes": session.duration_minutes
    }

@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    session_data: SessionUpdate,
    db: Session = Depends(get_db)
):
    """Update session details (notes, prescription, etc.)"""
    session = db.query(TelemedicineSession).filter(TelemedicineSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update fields
    update_data = session_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(session, field, SessionStatus(value))
        else:
            setattr(session, field, value)
    
    db.commit()
    db.refresh(session)
    return session

@router.delete("/sessions/{session_id}", status_code=204)
async def cancel_session(session_id: str, db: Session = Depends(get_db)):
    """Cancel a scheduled session"""
    session = db.query(TelemedicineSession).filter(TelemedicineSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status == SessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Cannot cancel a session in progress")
    
    session.status = SessionStatus.CANCELLED
    db.commit()
    
    return None

@router.get("/sessions/{session_id}/recording")
async def get_session_recording(session_id: str, db: Session = Depends(get_db)):
    """Get recording URL for a completed session (placeholder)"""
    session = db.query(TelemedicineSession).filter(TelemedicineSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != SessionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Session not completed yet")
    
    return {
        "session_id": session.id,
        "recording_url": None,  # Implement cloud recording integration
        "message": "Recording feature requires Agora Cloud Recording setup"
    }
