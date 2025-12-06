"""
Clinical Integrations API
Connect to external clinical systems (HL7, FHIR, Lab Systems, etc.)
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from server_py.db.session import get_db
from server_py.models.clinical_integration import ClinicalIntegration, IntegrationType, IntegrationStatus
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import json

router = APIRouter(prefix="/api/integrations", tags=["clinical-integrations"])

# In-memory storage for integration data (use Redis in production)
integration_data_store: Dict[str, Dict[str, Any]] = {}

# Pydantic schemas
class IntegrationCreate(BaseModel):
    hospital_id: str
    name: str
    integration_type: str  # hl7, fhir, dicom, lab_system, pharmacy, custom
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    config: Optional[dict] = None
    auto_sync: bool = False
    sync_interval_minutes: Optional[str] = None

class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    config: Optional[dict] = None
    auto_sync: Optional[bool] = None
    sync_interval_minutes: Optional[str] = None

class IntegrationResponse(BaseModel):
    id: str
    hospital_id: str
    name: str
    integration_type: str
    status: str
    endpoint_url: Optional[str]
    auto_sync: bool
    last_sync_time: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[IntegrationResponse])
async def list_integrations(
    hospital_id: Optional[str] = None,
    integration_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List clinical integrations"""
    query = db.query(ClinicalIntegration)
    
    if hospital_id:
        query = query.filter(ClinicalIntegration.hospital_id == hospital_id)
    if integration_type:
        query = query.filter(ClinicalIntegration.integration_type == integration_type)
    
    integrations = query.all()
    return integrations

@router.post("/", response_model=IntegrationResponse, status_code=201)
async def create_integration(
    integration_data: IntegrationCreate,
    current_user_id: str = "system",  # Should come from auth
    db: Session = Depends(get_db)
):
    """Create a new clinical integration (Hospital Admin only)"""
    
    # Validate integration type
    try:
        integration_type_enum = IntegrationType(integration_data.integration_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid integration type. Must be one of: {', '.join([t.value for t in IntegrationType])}"
        )
    
    # Create integration
    config_json = json.dumps(integration_data.config) if integration_data.config else None
    
    new_integration = ClinicalIntegration(
        id=str(uuid.uuid4()),
        hospital_id=integration_data.hospital_id,
        name=integration_data.name,
        integration_type=integration_type_enum,
        status=IntegrationStatus.PENDING,
        endpoint_url=integration_data.endpoint_url,
        api_key=integration_data.api_key,
        config=config_json,
        auto_sync=integration_data.auto_sync,
        sync_interval_minutes=integration_data.sync_interval_minutes,
        created_by=current_user_id
    )
    
    db.add(new_integration)
    db.commit()
    db.refresh(new_integration)
    
    # Initialize in-memory storage for this integration
    integration_data_store[new_integration.id] = {
        "records": [],
        "last_sync": None
    }
    
    return new_integration

@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(integration_id: str, db: Session = Depends(get_db)):
    """Get integration details"""
    integration = db.query(ClinicalIntegration).filter(
        ClinicalIntegration.id == integration_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return integration

@router.patch("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: str,
    integration_data: IntegrationUpdate,
    db: Session = Depends(get_db)
):
    """Update integration settings"""
    integration = db.query(ClinicalIntegration).filter(
        ClinicalIntegration.id == integration_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Update fields
    update_data = integration_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(integration, field, IntegrationStatus(value))
        elif field == "config" and value:
            setattr(integration, field, json.dumps(value))
        else:
            setattr(integration, field, value)
    
    db.commit()
    db.refresh(integration)
    return integration

@router.delete("/{integration_id}", status_code=204)
async def delete_integration(integration_id: str, db: Session = Depends(get_db)):
    """Delete integration"""
    integration = db.query(ClinicalIntegration).filter(
        ClinicalIntegration.id == integration_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Clear in-memory data
    if integration_id in integration_data_store:
        del integration_data_store[integration_id]
    
    db.delete(integration)
    db.commit()
    return None

@router.post("/{integration_id}/sync")
async def trigger_sync(integration_id: str, db: Session = Depends(get_db)):
    """Manually trigger data sync from external system"""
    integration = db.query(ClinicalIntegration).filter(
        ClinicalIntegration.id == integration_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    if integration.status != IntegrationStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Integration is not active")
    
    # Simulate sync (in production, make actual API call to external system)
    try:
        # Update last sync time
        integration.last_sync_time = datetime.now()
        integration.status = IntegrationStatus.ACTIVE
        db.commit()
        
        # Simulate fetching data
        simulated_data = {
            "sync_time": datetime.now().isoformat(),
            "records_fetched": 0,
            "status": "success",
            "message": f"Simulated sync for {integration.integration_type.value} integration"
        }
        
        # Store in memory
        if integration_id not in integration_data_store:
            integration_data_store[integration_id] = {"records": [], "last_sync": None}
        
        integration_data_store[integration_id]["last_sync"] = simulated_data
        
        return simulated_data
        
    except Exception as e:
        integration.status = IntegrationStatus.ERROR
        db.commit()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@router.get("/{integration_id}/data")
async def get_integration_data(
    integration_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get data from integration's in-memory storage"""
    integration = db.query(ClinicalIntegration).filter(
        ClinicalIntegration.id == integration_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Get data from in-memory store
    data = integration_data_store.get(integration_id, {"records": [], "last_sync": None})
    
    return {
        "integration_id": integration_id,
        "integration_name": integration.name,
        "integration_type": integration.integration_type.value,
        "last_sync": data.get("last_sync"),
        "records": data.get("records", [])[:limit],
        "total_records": len(data.get("records", []))
    }

@router.post("/{integration_id}/data")
async def add_integration_data(
    integration_id: str,
    data: dict,
    db: Session = Depends(get_db)
):
    """Add data to integration's in-memory storage (for testing)"""
    integration = db.query(ClinicalIntegration).filter(
        ClinicalIntegration.id == integration_id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Initialize if not exists
    if integration_id not in integration_data_store:
        integration_data_store[integration_id] = {"records": [], "last_sync": None}
    
    # Add data
    integration_data_store[integration_id]["records"].append({
        "timestamp": datetime.now().isoformat(),
        "data": data
    })
    
    return {
        "message": "Data added successfully",
        "total_records": len(integration_data_store[integration_id]["records"])
    }

@router.get("/types/available")
async def list_integration_types():
    """List available integration types"""
    return {
        "integration_types": [
            {"value": t.value, "name": t.value.upper().replace("_", " ")}
            for t in IntegrationType
        ]
    }
