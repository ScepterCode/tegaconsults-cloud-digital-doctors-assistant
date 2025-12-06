from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
import base64

from server_py.db.session import get_db
from server_py.models.diary_entry import DiaryEntry
from server_py.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/diary", tags=["diary"])

class DiaryEntryCreate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    entry_type: str
    mood: Optional[str] = None
    tags: Optional[str] = None
    media_data: Optional[str] = None  # Base64 encoded audio/video

class DiaryEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[str] = None
    tags: Optional[str] = None

@router.post("")
def create_diary_entry(entry_data: DiaryEntryCreate, user_id: str, db: Session = Depends(get_db)):
    """Create a new diary entry"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    media_url = None
    if entry_data.media_data and entry_data.entry_type in ["audio", "video"]:
        # Save media file (in production, upload to cloud storage)
        media_dir = "media/diary"
        os.makedirs(media_dir, exist_ok=True)
        
        file_ext = "webm" if entry_data.entry_type == "audio" else "mp4"
        filename = f"{user_id}_{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(media_dir, filename)
        
        # Decode base64 and save
        try:
            media_bytes = base64.b64decode(entry_data.media_data.split(',')[1] if ',' in entry_data.media_data else entry_data.media_data)
            with open(filepath, 'wb') as f:
                f.write(media_bytes)
            media_url = f"/media/diary/{filename}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to save media: {str(e)}")
    
    entry = DiaryEntry(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=entry_data.title,
        content=entry_data.content,
        entry_type=entry_data.entry_type,
        media_url=media_url,
        mood=entry_data.mood,
        tags=entry_data.tags,
        is_private="1"
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    return {"entry": serialize_entry(entry)}

@router.get("")
def get_diary_entries(
    user_id: str,
    entry_type: Optional[str] = None,
    mood: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get user's diary entries"""
    query = db.query(DiaryEntry).filter(DiaryEntry.user_id == user_id)
    
    if entry_type:
        query = query.filter(DiaryEntry.entry_type == entry_type)
    if mood:
        query = query.filter(DiaryEntry.mood == mood)
    if start_date:
        query = query.filter(DiaryEntry.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(DiaryEntry.created_at <= datetime.fromisoformat(end_date))
    
    entries = query.order_by(DiaryEntry.created_at.desc()).all()
    return {"entries": [serialize_entry(e) for e in entries]}

@router.get("/{entry_id}")
def get_diary_entry(entry_id: str, user_id: str, db: Session = Depends(get_db)):
    """Get a specific diary entry"""
    entry = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    return {"entry": serialize_entry(entry)}

@router.patch("/{entry_id}")
def update_diary_entry(entry_id: str, updates: DiaryEntryUpdate, user_id: str, db: Session = Depends(get_db)):
    """Update a diary entry"""
    entry = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    if updates.title is not None:
        entry.title = updates.title
    if updates.content is not None:
        entry.content = updates.content
    if updates.mood is not None:
        entry.mood = updates.mood
    if updates.tags is not None:
        entry.tags = updates.tags
    
    entry.updated_at = datetime.now()
    db.commit()
    db.refresh(entry)
    
    return {"entry": serialize_entry(entry)}

@router.delete("/{entry_id}")
def delete_diary_entry(entry_id: str, user_id: str, db: Session = Depends(get_db)):
    """Delete a diary entry"""
    entry = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Diary entry not found")
    
    # Delete media file if exists
    if entry.media_url:
        try:
            filepath = entry.media_url.lstrip('/')
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass
    
    db.delete(entry)
    db.commit()
    
    return {"message": "Diary entry deleted successfully"}

@router.get("/stats/summary")
def get_diary_stats(user_id: str, db: Session = Depends(get_db)):
    """Get diary statistics"""
    total = db.query(DiaryEntry).filter(DiaryEntry.user_id == user_id).count()
    
    # Count by type
    text_count = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == user_id,
        DiaryEntry.entry_type == "text"
    ).count()
    
    audio_count = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == user_id,
        DiaryEntry.entry_type == "audio"
    ).count()
    
    video_count = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == user_id,
        DiaryEntry.entry_type == "video"
    ).count()
    
    # Recent entries (last 7 days)
    week_ago = datetime.now() - timedelta(days=7)
    recent_count = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == user_id,
        DiaryEntry.created_at >= week_ago
    ).count()
    
    return {
        "total_entries": total,
        "text_entries": text_count,
        "audio_entries": audio_count,
        "video_entries": video_count,
        "entries_this_week": recent_count
    }

def serialize_entry(entry: DiaryEntry):
    return {
        "id": entry.id,
        "userId": entry.user_id,
        "title": entry.title,
        "content": entry.content,
        "entryType": entry.entry_type,
        "mediaUrl": entry.media_url,
        "mood": entry.mood,
        "tags": entry.tags,
        "createdAt": entry.created_at.isoformat() if entry.created_at else None,
        "updatedAt": entry.updated_at.isoformat() if entry.updated_at else None
    }
