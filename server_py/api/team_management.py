from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from server_py.db.session import get_db
from server_py.models.team import Team
from server_py.models.team_member import TeamMember
from server_py.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/team-management", tags=["team-management"])

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    team_type: str
    department_id: Optional[str] = None
    team_lead_id: Optional[str] = None
    hospital_id: Optional[str] = None

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    team_type: Optional[str] = None
    team_lead_id: Optional[str] = None
    status: Optional[str] = None

class TeamMemberAdd(BaseModel):
    user_id: str
    role_in_team: Optional[str] = "member"

@router.post("")
def create_team(team_data: TeamCreate, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create teams")
    
    team = Team(
        id=str(uuid.uuid4()),
        name=team_data.name,
        description=team_data.description,
        team_type=team_data.team_type,
        department_id=team_data.department_id,
        team_lead_id=team_data.team_lead_id,
        hospital_id=team_data.hospital_id or admin.hospital_id,
        status="active",
        created_by=admin_id
    )
    
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # If team lead is specified, add them as a member
    if team_data.team_lead_id:
        team_member = TeamMember(
            id=str(uuid.uuid4()),
            team_id=team.id,
            user_id=team_data.team_lead_id,
            role_in_team="lead"
        )
        db.add(team_member)
        db.commit()
    
    return {"team": serialize_team(team, db)}

@router.get("")
def get_teams(
    hospital_id: Optional[str] = None,
    department_id: Optional[str] = None,
    team_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Team)
    
    if hospital_id:
        query = query.filter(Team.hospital_id == hospital_id)
    if department_id:
        query = query.filter(Team.department_id == department_id)
    if team_type:
        query = query.filter(Team.team_type == team_type)
    if status:
        query = query.filter(Team.status == status)
    
    teams = query.all()
    return {"teams": [serialize_team(t, db) for t in teams]}

@router.get("/{team_id}")
def get_team(team_id: str, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get team members
    team_members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    members = []
    
    for tm in team_members:
        user = db.query(User).filter(User.id == tm.user_id).first()
        if user:
            members.append({
                "id": tm.id,
                "user": {
                    "id": user.id,
                    "name": user.full_name,
                    "role": user.role,
                    "departmentId": user.department_id
                },
                "roleInTeam": tm.role_in_team,
                "joinedAt": tm.joined_at.isoformat() if tm.joined_at else None
            })
    
    return {
        "team": serialize_team(team, db),
        "members": members,
        "member_count": len(members)
    }

@router.patch("/{team_id}")
def update_team(team_id: str, updates: TeamUpdate, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update teams")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if updates.name:
        team.name = updates.name
    if updates.description is not None:
        team.description = updates.description
    if updates.team_type:
        team.team_type = updates.team_type
    if updates.team_lead_id is not None:
        team.team_lead_id = updates.team_lead_id
    if updates.status:
        team.status = updates.status
    
    team.updated_at = datetime.now()
    db.commit()
    db.refresh(team)
    
    return {"team": serialize_team(team, db)}

@router.delete("/{team_id}")
def delete_team(team_id: str, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete teams")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Delete all team members first
    db.query(TeamMember).filter(TeamMember.team_id == team_id).delete()
    db.delete(team)
    db.commit()
    
    return {"message": "Team deleted successfully"}

@router.post("/{team_id}/members")
def add_team_member(team_id: str, member_data: TeamMemberAdd, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can add team members")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already a member
    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == member_data.user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User is already a team member")
    
    team_member = TeamMember(
        id=str(uuid.uuid4()),
        team_id=team_id,
        user_id=member_data.user_id,
        role_in_team=member_data.role_in_team
    )
    
    db.add(team_member)
    db.commit()
    
    return {"message": "Team member added successfully"}

@router.delete("/{team_id}/members/{member_id}")
def remove_team_member(team_id: str, member_id: str, admin_id: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role not in ["hospital_admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can remove team members")
    
    team_member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not team_member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    db.delete(team_member)
    db.commit()
    
    return {"message": "Team member removed successfully"}

@router.get("/stats/overview")
def get_team_stats(hospital_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Team)
    if hospital_id:
        query = query.filter(Team.hospital_id == hospital_id)
    
    total_teams = query.count()
    active_teams = query.filter(Team.status == "active").count()
    
    # Get team type distribution
    teams = query.all()
    team_types = {}
    
    for team in teams:
        team_types[team.team_type] = team_types.get(team.team_type, 0) + 1
    
    return {
        "total_teams": total_teams,
        "active_teams": active_teams,
        "team_types": team_types
    }

def serialize_team(team: Team, db: Session):
    team_lead = None
    if team.team_lead_id:
        lead = db.query(User).filter(User.id == team.team_lead_id).first()
        if lead:
            team_lead = {"id": lead.id, "name": lead.full_name, "role": lead.role}
    
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "teamType": team.team_type,
        "teamLead": team_lead,
        "departmentId": team.department_id,
        "hospitalId": team.hospital_id,
        "status": team.status,
        "memberCount": member_count,
        "createdBy": team.created_by,
        "createdAt": team.created_at.isoformat() if team.created_at else None,
        "updatedAt": team.updated_at.isoformat() if team.updated_at else None
    }
