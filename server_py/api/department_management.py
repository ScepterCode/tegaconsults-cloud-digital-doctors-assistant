from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from server_py.db.session import get_db
from server_py.models.department import Department
from server_py.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/department-management", tags=["department-management"])

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    head_staff_id: Optional[str] = None
    hospital_id: Optional[str] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    head_staff_id: Optional[str] = None
    status: Optional[str] = None

class StaffAssignment(BaseModel):
    user_id: str
    department_id: str

@router.post("")
def create_department(dept_data: DepartmentCreate, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create departments")
    
    department = Department(
        id=str(uuid.uuid4()),
        name=dept_data.name,
        description=dept_data.description,
        head_staff_id=dept_data.head_staff_id,
        hospital_id=dept_data.hospital_id or admin.hospital_id,
        hospital_admin_id=admin_id,
        status="active",
        created_by=admin_id
    )
    
    db.add(department)
    db.commit()
    db.refresh(department)
    
    return {"department": serialize_department(department, db)}

@router.get("")
def get_departments(
    hospital_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Department)
    
    if hospital_id:
        query = query.filter(Department.hospital_id == hospital_id)
    if status:
        query = query.filter(Department.status == status)
    
    departments = query.all()
    return {"departments": [serialize_department(d, db) for d in departments]}

@router.get("/{department_id}")
def get_department(department_id: str, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Get staff in this department
    staff = db.query(User).filter(User.department_id == department_id).all()
    
    return {
        "department": serialize_department(department, db),
        "staff": [serialize_staff(s) for s in staff],
        "staff_count": len(staff)
    }

@router.patch("/{department_id}")
def update_department(
    department_id: str,
    updates: DepartmentUpdate,
    admin_id: str,
    db: Session = Depends(get_db)
):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update departments")
    
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if updates.name:
        department.name = updates.name
    if updates.description is not None:
        department.description = updates.description
    if updates.head_staff_id is not None:
        department.head_staff_id = updates.head_staff_id
    if updates.status:
        department.status = updates.status
    
    department.updated_at = datetime.now()
    db.commit()
    db.refresh(department)
    
    return {"department": serialize_department(department, db)}

@router.delete("/{department_id}")
def delete_department(department_id: str, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete departments")
    
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if there are staff in this department
    staff_count = db.query(User).filter(User.department_id == department_id).count()
    if staff_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department with {staff_count} staff members. Reassign them first."
        )
    
    db.delete(department)
    db.commit()
    
    return {"message": "Department deleted successfully"}

@router.post("/assign-staff")
def assign_staff_to_department(assignment: StaffAssignment, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can assign staff")
    
    user = db.query(User).filter(User.id == assignment.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    department = db.query(Department).filter(Department.id == assignment.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    user.department_id = assignment.department_id
    db.commit()
    
    return {"message": "Staff assigned to department successfully", "user": serialize_staff(user)}

@router.post("/unassign-staff/{user_id}")
def unassign_staff_from_department(user_id: str, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can unassign staff")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.department_id = None
    db.commit()
    
    return {"message": "Staff unassigned from department successfully"}

@router.get("/stats/overview")
def get_department_stats(hospital_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Department)
    if hospital_id:
        query = query.filter(Department.hospital_id == hospital_id)
    
    total_departments = query.count()
    active_departments = query.filter(Department.status == "active").count()
    
    # Get staff distribution
    departments = query.all()
    dept_stats = []
    
    for dept in departments:
        staff_count = db.query(User).filter(User.department_id == dept.id).count()
        dept_stats.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "staff_count": staff_count,
            "status": dept.status
        })
    
    return {
        "total_departments": total_departments,
        "active_departments": active_departments,
        "department_stats": dept_stats
    }

@router.get("/user/{user_id}")
def get_user_department_info(user_id: str, db: Session = Depends(get_db)):
    """Get department and team information for a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = {
        "user_id": user_id,
        "department": None,
        "departments_leading": [],
        "teams": []
    }
    
    # Get department info (if user is a member)
    if user.department_id:
        department = db.query(Department).filter(Department.id == user.department_id).first()
        if department:
            head_staff = None
            if department.head_staff_id:
                head = db.query(User).filter(User.id == department.head_staff_id).first()
                if head:
                    head_staff = {"id": head.id, "name": head.full_name}
            
            result["department"] = {
                "id": department.id,
                "name": department.name,
                "description": department.description,
                "head_staff": head_staff,
                "status": department.status,
                "is_head": department.head_staff_id == user_id
            }
    
    # Get departments where user is the head (even if not a member)
    departments_as_head = db.query(Department).filter(Department.head_staff_id == user_id).all()
    for dept in departments_as_head:
        # Skip if already included as member
        if result["department"] and result["department"]["id"] == dept.id:
            continue
        
        result["departments_leading"].append({
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "status": dept.status,
            "is_head": True
        })
    
    # Get teams the user is part of
    from server_py.models.team import Team
    from server_py.models.team_member import TeamMember
    team_memberships = db.query(TeamMember).filter(TeamMember.user_id == user_id).all()
    
    for membership in team_memberships:
        team = db.query(Team).filter(Team.id == membership.team_id).first()
        if team:
            team_lead = None
            if team.team_lead_id:
                lead = db.query(User).filter(User.id == team.team_lead_id).first()
                if lead:
                    team_lead = {"id": lead.id, "name": lead.full_name}
            
            result["teams"].append({
                "id": team.id,
                "name": team.name,
                "team_type": team.team_type,
                "description": team.description,
                "team_lead": team_lead,
                "is_lead": team.team_lead_id == user_id,
                "status": team.status
            })
    
    # Also get teams where user is lead but not a member
    teams_as_lead = db.query(Team).filter(Team.team_lead_id == user_id).all()
    for team in teams_as_lead:
        # Skip if already included as member
        if any(t["id"] == team.id for t in result["teams"]):
            continue
        
        result["teams"].append({
            "id": team.id,
            "name": team.name,
            "team_type": team.team_type,
            "description": team.description,
            "team_lead": {"id": user_id, "name": user.full_name},
            "is_lead": True,
            "status": team.status
        })
    
    return result

def serialize_department(department: Department, db: Session):
    head_staff = None
    if department.head_staff_id:
        staff = db.query(User).filter(User.id == department.head_staff_id).first()
        if staff:
            head_staff = {"id": staff.id, "name": staff.full_name, "role": staff.role}
    
    staff_count = db.query(User).filter(User.department_id == department.id).count()
    
    return {
        "id": department.id,
        "name": department.name,
        "description": department.description,
        "headStaff": head_staff,
        "hospitalId": department.hospital_id,
        "status": department.status,
        "staffCount": staff_count,
        "createdBy": department.created_by,
        "createdAt": department.created_at.isoformat() if department.created_at else None,
        "updatedAt": department.updated_at.isoformat() if department.updated_at else None
    }

def serialize_staff(user: User):
    return {
        "id": user.id,
        "username": user.username,
        "fullName": user.full_name,
        "role": user.role,
        "departmentId": user.department_id,
        "hospitalId": user.hospital_id,
        "isActive": user.is_active
    }
