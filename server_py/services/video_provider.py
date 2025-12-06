"""
Video Provider Service for Agora.io Integration
Generates tokens for video consultations
"""
import os
from agora_token_builder import RtcTokenBuilder
from datetime import datetime, timedelta
import time

class VideoProviderService:
    def __init__(self):
        self.app_id = os.getenv("AGORA_APP_ID", "")
        self.app_certificate = os.getenv("AGORA_APP_CERTIFICATE", "")
        
    def generate_rtc_token(self, channel_name: str, uid: int = 0, role: int = 1, expiration_seconds: int = 3600):
        """
        Generate Agora RTC token for video call
        
        Args:
            channel_name: Unique channel/room name
            uid: User ID (0 for auto-assign)
            role: 1 for publisher (can send/receive), 2 for subscriber (receive only)
            expiration_seconds: Token validity duration (default 1 hour)
        
        Returns:
            dict with token and channel info
        """
        if not self.app_id or not self.app_certificate:
            # For development without Agora credentials
            return {
                "token": "demo_token_" + channel_name,
                "channel_name": channel_name,
                "uid": uid,
                "app_id": "demo_app_id",
                "expires_at": int(time.time()) + expiration_seconds,
                "note": "Using demo token. Configure AGORA_APP_ID and AGORA_APP_CERTIFICATE for production."
            }
        
        # Calculate privilege expiration time
        current_timestamp = int(time.time())
        privilege_expired_ts = current_timestamp + expiration_seconds
        
        # Generate token
        token = RtcTokenBuilder.buildTokenWithUid(
            self.app_id,
            self.app_certificate,
            channel_name,
            uid,
            role,
            privilege_expired_ts
        )
        
        return {
            "token": token,
            "channel_name": channel_name,
            "uid": uid,
            "app_id": self.app_id,
            "expires_at": privilege_expired_ts
        }
    
    def validate_credentials(self) -> bool:
        """Check if Agora credentials are configured"""
        return bool(self.app_id and self.app_certificate and 
                   self.app_id != "your_agora_app_id_here" and
                   self.app_certificate != "your_agora_certificate_here")

# Singleton instance
video_provider = VideoProviderService()
