from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class UserBase(BaseModel):
    username: str
    full_name: str = Field(alias="fullName")
    role: str
    department_id: Optional[str] = Field(None, alias="departmentId")
    hospital_admin_id: Optional[str] = Field(None, alias="hospitalAdminId")
    
    class Config:
        populate_by_name = True

class UserCreate(UserBase):
    password: str
    is_active: int = 1

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str = Field(alias="fullName")
    role: str
    department_id: Optional[str] = Field(None, alias="departmentId")
    hospital_admin_id: Optional[str] = Field(None, alias="hospitalAdminId")
    is_active: int = Field(alias="isActive")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    
    class Config:
        populate_by_name = True
        from_attributes = True

class LoginCredentials(BaseModel):
    auth_method: Literal["credentials"] = Field(alias="authMethod")
    username: str
    password: str
    
    class Config:
        populate_by_name = True

class LoginNIN(BaseModel):
    auth_method: Literal["nin"] = Field(alias="authMethod")
    nin: str
    
    class Config:
        populate_by_name = True

class LoginFingerprint(BaseModel):
    auth_method: Literal["fingerprint"] = Field(alias="authMethod")
    fingerprint_data: str = Field(alias="fingerprintData")
    
    class Config:
        populate_by_name = True

class LoginFacial(BaseModel):
    auth_method: Literal["facial"] = Field(alias="authMethod")
    facial_data: str = Field(alias="facialData")
    
    class Config:
        populate_by_name = True

class LoginRequest(BaseModel):
    auth_method: str = Field(alias="authMethod")
    username: Optional[str] = None
    password: Optional[str] = None
    nin: Optional[str] = None
    fingerprint_data: Optional[str] = Field(None, alias="fingerprintData")
    facial_data: Optional[str] = Field(None, alias="facialData")
    
    class Config:
        populate_by_name = True

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str = Field(alias="fullName")
    role: str
    department_id: Optional[str] = Field(None, alias="departmentId")
    
    class Config:
        populate_by_name = True
