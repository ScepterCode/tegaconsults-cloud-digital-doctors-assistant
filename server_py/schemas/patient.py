from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PatientBase(BaseModel):
    mrn: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    age: int
    gender: str
    phone_number: str = Field(alias="phoneNumber")
    email: Optional[str] = None
    address: Optional[str] = None
    nin: str
    blood_group: str = Field(alias="bloodGroup")
    genotype: str
    allergies: Optional[str] = None
    symptoms: Optional[str] = None
    bp_systolic: Optional[int] = Field(None, alias="bloodPressureSystolic")
    bp_diastolic: Optional[int] = Field(None, alias="bloodPressureDiastolic")
    temperature: Optional[str] = None
    heart_rate: Optional[int] = Field(None, alias="heartRate")
    weight: Optional[str] = None
    facial_recognition_data: Optional[str] = Field(None, alias="facialRecognitionData")
    fingerprint_data: Optional[str] = Field(None, alias="fingerprintData")
    
    class Config:
        populate_by_name = True

class PatientCreate(PatientBase):
    registered_by: str = Field(alias="registeredBy")
    
    class Config:
        populate_by_name = True

class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    age: Optional[int] = None
    phone_number: Optional[str] = Field(None, alias="phoneNumber")
    email: Optional[str] = None
    address: Optional[str] = None
    allergies: Optional[str] = None
    symptoms: Optional[str] = None
    bp_systolic: Optional[int] = Field(None, alias="bloodPressureSystolic")
    bp_diastolic: Optional[int] = Field(None, alias="bloodPressureDiastolic")
    temperature: Optional[str] = None
    heart_rate: Optional[int] = Field(None, alias="heartRate")
    weight: Optional[str] = None
    last_updated_by: Optional[str] = Field(None, alias="lastUpdatedBy")
    
    class Config:
        populate_by_name = True

class PatientResponse(BaseModel):
    id: str
    mrn: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    age: int
    gender: str
    phone_number: str = Field(alias="phoneNumber")
    email: Optional[str] = None
    address: Optional[str] = None
    nin: str
    blood_group: str = Field(alias="bloodGroup")
    genotype: str
    allergies: Optional[str] = None
    symptoms: Optional[str] = None
    bp_systolic: Optional[int] = Field(None, alias="bloodPressureSystolic")
    bp_diastolic: Optional[int] = Field(None, alias="bloodPressureDiastolic")
    temperature: Optional[str] = None
    heart_rate: Optional[int] = Field(None, alias="heartRate")
    weight: Optional[str] = None
    facial_recognition_data: Optional[str] = Field(None, alias="facialRecognitionData")
    fingerprint_data: Optional[str] = Field(None, alias="fingerprintData")
    registered_by: str = Field(alias="registeredBy")
    last_updated_by: Optional[str] = Field(None, alias="lastUpdatedBy")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    
    class Config:
        populate_by_name = True
        from_attributes = True
