"""
Permission Service for Role-Based Access Control (RBAC)
"""
from typing import Optional, List
from functools import wraps
from fastapi import HTTPException, status
import json

# Role hierarchy (higher number = more permissions)
ROLE_HIERARCHY = {
    "system_admin": 100,
    "hospital_admin": 80,
    "doctor": 60,
    "nurse": 50,
    "pharmacist": 40,
    "lab_tech": 30,
    "receptionist": 20,
    "patient": 10
}

# Default permissions for each role
DEFAULT_PERMISSIONS = {
    "system_admin": {
        "can_manage_hospitals": True,
        "can_view_all_data": True,
        "can_manage_all_users": True,
        "can_access_system_settings": True
    },
    "hospital_admin": {
        "can_manage_staff": True,
        "can_view_hospital_data": True,
        "can_manage_departments": True,
        "can_configure_integrations": True,
        "can_view_analytics": True
    },
    "doctor": {
        "can_view_patients": True,
        "can_edit_patients": True,
        "can_prescribe": True,
        "can_schedule_telemedicine": True,
        "can_view_lab_results": True,
        "can_add_diagnosis": True
    },
    "nurse": {
        "can_view_patients": True,
        "can_edit_patient_vitals": True,
        "can_view_appointments": True,
        "can_upload_vitals": True
    },
    "pharmacist": {
        "can_view_prescriptions": True,
        "can_dispense_medication": True,
        "can_manage_inventory": True
    },
    "lab_tech": {
        "can_upload_lab_results": True,
        "can_view_lab_orders": True
    },
    "receptionist": {
        "can_register_patients": True,
        "can_schedule_appointments": True,
        "can_view_appointments": True
    },
    "patient": {
        "can_view_own_records": True,
        "can_book_appointments": True,
        "can_view_own_prescriptions": True
    }
}

class PermissionService:
    @staticmethod
    def get_user_permissions(user_role: str, custom_permissions: Optional[str] = None) -> dict:
        """Get merged permissions for a user (default + custom)"""
        base_permissions = DEFAULT_PERMISSIONS.get(user_role, {})
        
        if custom_permissions:
            try:
                custom = json.loads(custom_permissions)
                return {**base_permissions, **custom}
            except:
                pass
        
        return base_permissions
    
    @staticmethod
    def has_permission(user_role: str, permission: str, custom_permissions: Optional[str] = None) -> bool:
        """Check if user has a specific permission"""
        permissions = PermissionService.get_user_permissions(user_role, custom_permissions)
        return permissions.get(permission, False)
    
    @staticmethod
    def can_access_hospital(user_role: str, user_hospital_id: Optional[str], target_hospital_id: str) -> bool:
        """Check if user can access data from a specific hospital"""
        # System admin can access all hospitals
        if user_role == "system_admin":
            return True
        
        # Other users can only access their own hospital
        return user_hospital_id == target_hospital_id
    
    @staticmethod
    def can_manage_user(manager_role: str, manager_hospital_id: Optional[str], 
                       target_role: str, target_hospital_id: Optional[str]) -> bool:
        """Check if a user can manage another user"""
        # System admin can manage anyone
        if manager_role == "system_admin":
            return True
        
        # Hospital admin can manage users in their hospital (except other hospital admins)
        if manager_role == "hospital_admin":
            if manager_hospital_id != target_hospital_id:
                return False
            if target_role in ["system_admin", "hospital_admin"]:
                return False
            return True
        
        # Others cannot manage users
        return False
    
    @staticmethod
    def get_role_level(role: str) -> int:
        """Get numeric level for role (for hierarchy checks)"""
        return ROLE_HIERARCHY.get(role, 0)
    
    @staticmethod
    def is_higher_role(role1: str, role2: str) -> bool:
        """Check if role1 is higher than role2 in hierarchy"""
        return PermissionService.get_role_level(role1) > PermissionService.get_role_level(role2)

def require_permission(permission: str):
    """Decorator to require a specific permission"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This is a placeholder - in actual implementation,
            # you would get the current user from the request context
            # and check their permissions
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_role(min_role: str):
    """Decorator to require a minimum role level"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This is a placeholder - in actual implementation,
            # you would get the current user from the request context
            # and check their role
            return await func(*args, **kwargs)
        return wrapper
    return decorator
