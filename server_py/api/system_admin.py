"""
System Admin API Endpoints
Provides administrative oversight functions for the platform
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from server_py.db.session import get_db
from server_py.models.user import User
from server_py.models.hospital import Hospital
from server_py.models.patient import Patient
from server_py.models.appointment import Appointment
from server_py.models.audit_log import AuditLog
from server_py.models.security_event import SecurityEvent, EventSeverity
from server_py.services.system_monitoring import SystemMonitoringService
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/api/admin", tags=["System Admin"])

# Pydantic Schemas
class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[int] = None
    hospital_id: Optional[str] = None
    department_id: Optional[str] = None

class SystemSettingsUpdate(BaseModel):
    setting_key: str
    setting_value: str

class AnnouncementRequest(BaseModel):
    title: str
    message: str
    priority: str = "normal"

# System Health & Monitoring Endpoints

@router.get("/system/health")
async def get_system_health(db: Session = Depends(get_db)):
    """Get overall system health status"""
    monitoring = SystemMonitoringService(db)
    return monitoring.get_system_health()

@router.get("/system/metrics")
async def get_system_metrics(db: Session = Depends(get_db)):
    """Get real-time system metrics (CPU, memory, disk)"""
    monitoring = SystemMonitoringService(db)
    return monitoring.get_system_metrics()

@router.get("/system/database-metrics")
async def get_database_metrics(db: Session = Depends(get_db)):
    """Get database performance metrics"""
    monitoring = SystemMonitoringService(db)
    return monitoring.get_database_metrics()

@router.get("/system/errors")
async def get_recent_errors(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """Get recent system errors"""
    monitoring = SystemMonitoringService(db)
    return monitoring.get_recent_errors(limit)

@router.get("/system/stats")
async def get_platform_stats(db: Session = Depends(get_db)):
    """Get platform-wide statistics"""
    total_hospitals = db.query(Hospital).count()
    active_hospitals = db.query(Hospital).filter(
        Hospital.subscription_status == "active"
    ).count()
    total_users = db.query(User).count()
    total_patients = db.query(Patient).count()
    total_appointments = db.query(Appointment).count()
    
    # Appointments today
    today = datetime.now().date()
    appointments_today = db.query(Appointment).filter(
        func.date(Appointment.appointment_date) == today
    ).count()
    
    # Users by role
    users_by_role = {}
    role_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    for role, count in role_counts:
        users_by_role[role] = count
    
    # Hospitals by tier
    hospitals_by_tier = {}
    tier_counts = db.query(
        Hospital.subscription_tier, 
        func.count(Hospital.id)
    ).group_by(Hospital.subscription_tier).all()
    for tier, count in tier_counts:
        hospitals_by_tier[str(tier)] = count
    
    return {
        "hospitals": {
            "total": total_hospitals,
            "active": active_hospitals,
            "by_tier": hospitals_by_tier
        },
        "users": {
            "total": total_users,
            "by_role": users_by_role
        },
        "patients": {
            "total": total_patients
        },
        "appointments": {
            "total": total_appointments,
            "today": appointments_today
        },
        "timestamp": datetime.now().isoformat()
    }

# User Management Endpoints

@router.get("/users")
async def search_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    hospital_id: Optional[str] = None,
    is_active: Optional[int] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Search and list all users across all tenants"""
    query = db.query(User)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.username.ilike(search_term),
                User.full_name.ilike(search_term)
            )
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if hospital_id:
        query = query.filter(User.hospital_id == hospital_id)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    total = query.count()
    users = query.offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                "hospital_id": u.hospital_id,
                "department_id": u.department_id,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }

@router.get("/users/{user_id}")
async def get_user_details(user_id: str, db: Session = Depends(get_db)):
    """Get detailed user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get hospital info if applicable
    hospital = None
    if user.hospital_id:
        hospital = db.query(Hospital).filter(Hospital.id == user.hospital_id).first()
    
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "hospital_id": user.hospital_id,
        "hospital_name": hospital.name if hospital else None,
        "department_id": user.department_id,
        "is_active": user.is_active,
        "permissions": user.permissions,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    updates: UserUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update user (including activation/suspension)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Apply updates
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    
    # Log the action
    audit_log = AuditLog(
        user_id="system_admin",
        hospital_id=user.hospital_id,
        action_type="update",
        resource_type="user",
        resource_id=user_id,
        details=json.dumps(update_data),
        timestamp=datetime.now()
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@router.get("/users/sessions/active")
async def get_active_sessions(db: Session = Depends(get_db)):
    """Get all active user sessions"""
    # This would integrate with session storage (Redis, etc.)
    # For now, return recently active users
    recent_cutoff = datetime.now() - timedelta(minutes=30)
    
    # Placeholder: In production, this would query actual session data
    active_users = db.query(User).filter(User.is_active == 1).limit(50).all()
    
    return {
        "active_sessions": len(active_users),
        "sessions": [
            {
                "user_id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                "hospital_id": u.hospital_id
            }
            for u in active_users
        ]
    }

# Hospital Management Endpoints

@router.get("/hospitals/overview")
async def get_hospitals_overview(db: Session = Depends(get_db)):
    """Get enhanced hospital overview with usage stats"""
    hospitals = db.query(Hospital).all()
    
    hospital_data = []
    for hospital in hospitals:
        # Get staff count
        staff_count = db.query(User).filter(
            User.hospital_id == hospital.id,
            User.role.in_(["doctor", "nurse", "pharmacist", "lab_tech", "receptionist"])
        ).count()
        
        # Get patient count
        patient_count = db.query(Patient).filter(
            Patient.registered_by.in_(
                db.query(User.id).filter(User.hospital_id == hospital.id)
            )
        ).count()
        
        # Get appointments count
        appointment_count = db.query(Appointment).join(
            User, Appointment.doctor_id == User.id
        ).filter(User.hospital_id == hospital.id).count()
        
        hospital_data.append({
            "id": hospital.id,
            "name": hospital.name,
            "address": hospital.address,
            "phone": hospital.phone,
            "email": hospital.email,
            "subscription_tier": str(hospital.subscription_tier),
            "subscription_status": str(hospital.subscription_status),
            "max_staff": hospital.max_staff,
            "max_patients": hospital.max_patients,
            "staff_count": staff_count,
            "patient_count": patient_count,
            "appointment_count": appointment_count,
            "staff_usage_percent": round((staff_count / hospital.max_staff * 100), 1) if hospital.max_staff > 0 else 0,
            "patient_usage_percent": round((patient_count / hospital.max_patients * 100), 1) if hospital.max_patients > 0 else 0,
            "created_at": hospital.created_at.isoformat() if hospital.created_at else None
        })
    
    return hospital_data

@router.post("/hospitals/{hospital_id}/suspend")
async def suspend_hospital(hospital_id: str, db: Session = Depends(get_db)):
    """Suspend hospital access"""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    hospital.subscription_status = "suspended"
    db.commit()
    
    # Log the action
    audit_log = AuditLog(
        user_id="system_admin",
        hospital_id=hospital_id,
        action_type="suspend",
        resource_type="hospital",
        resource_id=hospital_id,
        details=json.dumps({"action": "suspended"}),
        timestamp=datetime.now()
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": f"Hospital {hospital.name} has been suspended"}

@router.post("/hospitals/{hospital_id}/activate")
async def activate_hospital(hospital_id: str, db: Session = Depends(get_db)):
    """Reactivate hospital"""
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    hospital.subscription_status = "active"
    db.commit()
    
    # Log the action
    audit_log = AuditLog(
        user_id="system_admin",
        hospital_id=hospital_id,
        action_type="activate",
        resource_type="hospital",
        resource_id=hospital_id,
        details=json.dumps({"action": "activated"}),
        timestamp=datetime.now()
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": f"Hospital {hospital.name} has been activated"}

# Security & Audit Endpoints

@router.get("/audit-logs")
async def get_audit_logs(
    user_id: Optional[str] = None,
    hospital_id: Optional[str] = None,
    action_type: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get system-wide audit trail"""
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if hospital_id:
        query = query.filter(AuditLog.hospital_id == hospital_id)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    
    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "hospital_id": log.hospital_id,
                "action_type": log.action_type,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None
            }
            for log in logs
        ]
    }

@router.get("/security/events")
async def get_security_events(
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    resolved: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get security events"""
    query = db.query(SecurityEvent)
    
    if event_type:
        query = query.filter(SecurityEvent.event_type == event_type)
    if severity:
        query = query.filter(SecurityEvent.severity == severity)
    if resolved:
        query = query.filter(SecurityEvent.resolved == resolved)
    
    total = query.count()
    events = query.order_by(desc(SecurityEvent.timestamp)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "events": [
            {
                "id": event.id,
                "event_type": event.event_type,
                "user_id": event.user_id,
                "username": event.username,
                "ip_address": event.ip_address,
                "details": event.details,
                "severity": str(event.severity),
                "resolved": event.resolved,
                "timestamp": event.timestamp.isoformat() if event.timestamp else None
            }
            for event in events
        ]
    }

@router.get("/security/failed-logins")
async def get_failed_logins(
    hours: int = Query(24, le=168),
    db: Session = Depends(get_db)
):
    """Get failed login attempts"""
    cutoff = datetime.now() - timedelta(hours=hours)
    
    failed_logins = db.query(SecurityEvent).filter(
        SecurityEvent.event_type == "failed_login",
        SecurityEvent.timestamp >= cutoff
    ).order_by(desc(SecurityEvent.timestamp)).limit(200).all()
    
    return {
        "total": len(failed_logins),
        "timeframe_hours": hours,
        "attempts": [
            {
                "id": event.id,
                "username": event.username,
                "ip_address": event.ip_address,
                "details": event.details,
                "timestamp": event.timestamp.isoformat() if event.timestamp else None
            }
            for event in failed_logins
        ]
    }

# System Configuration

@router.get("/settings")
async def get_system_settings():
    """Get system-wide settings"""
    # This would typically read from a settings table or config file
    return {
        "maintenance_mode": False,
        "allow_registrations": True,
        "max_upload_size_mb": 50,
        "session_timeout_minutes": 30,
        "password_min_length": 8
    }

@router.post("/announcements")
async def create_announcement(
    announcement: AnnouncementRequest,
    db: Session = Depends(get_db)
):
    """Broadcast system-wide announcement"""
    # This would typically create notifications for all users
    # For now, just log the announcement
    audit_log = AuditLog(
        user_id="system_admin",
        action_type="announcement",
        resource_type="system",
        details=json.dumps({
            "title": announcement.title,
            "message": announcement.message,
            "priority": announcement.priority
        }),
        timestamp=datetime.now()
    )
    db.add(audit_log)
    db.commit()
    
    return {
        "message": "Announcement created successfully",
        "announcement": {
            "title": announcement.title,
            "priority": announcement.priority,
            "timestamp": datetime.now().isoformat()
        }
    }
