from sqlalchemy import Column, String, DateTime, Text, func
from server_py.db.session import Base
import uuid

class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    entry_type = Column(String, nullable=False)  # text, audio, video
    media_url = Column(String, nullable=True)  # URL/path to audio/video file
    mood = Column(String, nullable=True)  # happy, sad, neutral, stressed, excited
    tags = Column(String, nullable=True)  # JSON array of tags
    is_private = Column(String, nullable=False, default="1")  # Always private
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
