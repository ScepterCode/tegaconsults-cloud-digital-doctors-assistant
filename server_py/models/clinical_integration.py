from sqlalchemy import Column, String, DateTime, func, Enum as SQLEnum, Boolean
from server_py.db.session import Base
import uuid
import enum

class IntegrationType(str, enum.Enum):
    HL7 = "hl7"  # Health Level 7 messaging
    FHIR = "fhir"  # Fast Healthcare Interoperability Resources
    DICOM = "dicom"  # Medical imaging
    LAB_SYSTEM = "lab_system"  # Laboratory information system
    PHARMACY = "pharmacy"  # Pharmacy management system
    CUSTOM = "custom"  # Custom integration

class IntegrationStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"

class ClinicalIntegration(Base):
    __tablename__ = "clinical_integrations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hospital_id = Column(String, nullable=False)
    
    # Integration details
    name = Column(String, nullable=False)  # e.g., "Main Lab System"
    integration_type = Column(SQLEnum(IntegrationType), nullable=False)
    status = Column(SQLEnum(IntegrationStatus), default=IntegrationStatus.PENDING, nullable=False)
    
    # Configuration (stored as JSON string)
    config = Column(String, nullable=True)  # JSON: {"api_url": "...", "api_key": "..."}
    
    # Connection details
    endpoint_url = Column(String, nullable=True)
    api_key = Column(String, nullable=True)
    
    # Sync settings
    auto_sync = Column(Boolean, default=False)
    last_sync_time = Column(DateTime, nullable=True)
    sync_interval_minutes = Column(String, nullable=True)  # e.g., "60" for hourly
    
    # Metadata
    created_by = Column(String, nullable=False)  # User ID who created integration
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
