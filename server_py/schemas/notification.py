from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    department_id: str = Field(alias="departmentId")
    patient_id: str = Field(alias="patientId")
    appointment_id: Optional[str] = Field(None, alias="appointmentId")
    type: str
    title: str
    message: str
    priority: str = "normal"
    requested_by: str = Field(alias="requestedBy")
    
    class Config:
        populate_by_name = True

class NotificationCreate(NotificationBase):
    status: str = "unread"
    action_data: Optional[str] = Field(None, alias="actionData")

class NotificationResponse(BaseModel):
    id: str
    department_id: str = Field(alias="departmentId")
    patient_id: str = Field(alias="patientId")
    appointment_id: Optional[str] = Field(None, alias="appointmentId")
    type: str
    title: str
    message: str
    priority: str
    requested_by: str = Field(alias="requestedBy")
    status: str
    action_data: Optional[str] = Field(None, alias="actionData")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    
    class Config:
        populate_by_name = True
        from_attributes = True
