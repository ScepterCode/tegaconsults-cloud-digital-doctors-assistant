from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AppointmentBase(BaseModel):
    patient_id: str = Field(alias="patientId")
    doctor_id: str = Field(alias="doctorId")
    appointment_date: str = Field(alias="appointmentDate")
    appointment_time: str = Field(alias="appointmentTime")
    reason: str
    notes: Optional[str] = None
    
    class Config:
        populate_by_name = True

class AppointmentCreate(AppointmentBase):
    created_by: str = Field(alias="createdBy")
    status: str = "scheduled"
    
    class Config:
        populate_by_name = True

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = Field(None, alias="appointmentDate")
    appointment_time: Optional[str] = Field(None, alias="appointmentTime")
    reason: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        populate_by_name = True

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    doctor_id: str = Field(alias="doctorId")
    appointment_date: str = Field(alias="appointmentDate")
    appointment_time: str = Field(alias="appointmentTime")
    reason: str
    status: str
    notes: Optional[str] = None
    created_by: str = Field(alias="createdBy")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    
    class Config:
        populate_by_name = True
        from_attributes = True
