from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class LabResultBase(BaseModel):
    patient_id: str = Field(alias="patientId")
    test_name: str = Field(alias="testName")
    test_category: str = Field(alias="testCategory")
    file_data: Optional[str] = Field(None, alias="fileData")
    file_name: str = Field(alias="fileName")
    file_type: Optional[str] = Field(None, alias="fileType")
    test_values: Optional[str] = Field(None, alias="testValues")
    normal_range: Optional[str] = Field(None, alias="normalRange")
    status: str
    
    class Config:
        populate_by_name = True

class LabResultCreate(LabResultBase):
    uploaded_by: str = Field(alias="uploadedBy")
    
    class Config:
        populate_by_name = True

class LabResultResponse(BaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    test_name: str = Field(alias="testName")
    test_category: str = Field(alias="testCategory")
    file_data: Optional[str] = Field(None, alias="fileData")
    file_name: str = Field(alias="fileName")
    file_type: Optional[str] = Field(None, alias="fileType")
    test_values: Optional[str] = Field(None, alias="testValues")
    normal_range: Optional[str] = Field(None, alias="normalRange")
    status: str
    automated_analysis: Optional[str] = Field(None, alias="automatedAnalysis")
    doctor_notes: Optional[str] = Field(None, alias="doctorNotes")
    recommendations: Optional[str] = None
    uploaded_by: str = Field(alias="uploadedBy")
    reviewed_by: Optional[str] = Field(None, alias="reviewedBy")
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    
    class Config:
        populate_by_name = True
        from_attributes = True
