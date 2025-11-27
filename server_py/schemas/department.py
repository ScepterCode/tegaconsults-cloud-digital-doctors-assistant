from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    hospital_admin_id: str = Field(alias="hospitalAdminId")
    head_staff_id: Optional[str] = Field(None, alias="headStaffId")
    status: str = "active"
    
    class Config:
        populate_by_name = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    hospital_admin_id: str = Field(alias="hospitalAdminId")
    head_staff_id: Optional[str] = Field(None, alias="headStaffId")
    status: str
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    
    class Config:
        populate_by_name = True
        from_attributes = True
