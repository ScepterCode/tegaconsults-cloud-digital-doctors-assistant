from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime
import uuid

from server_py.db.session import get_db
from server_py.models.ticket import Ticket
from server_py.models.ticket_comment import TicketComment
from server_py.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    priority: str
    category: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    hospital_id: Optional[str] = None
    department_id: Optional[str] = None

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    resolution: Optional[str] = None

class CommentCreate(BaseModel):
    comment: str

@router.post("")
def create_ticket(ticket_data: TicketCreate, user_id: str, db: Session = Depends(get_db)):
    ticket_number = f"TKT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    ticket = Ticket(
        id=str(uuid.uuid4()),
        ticket_number=ticket_number,
        title=ticket_data.title,
        description=ticket_data.description,
        type=ticket_data.type,
        priority=ticket_data.priority,
        category=ticket_data.category,
        status="open",
        created_by=user_id,
        assigned_to=ticket_data.assigned_to,
        hospital_id=ticket_data.hospital_id,
        department_id=ticket_data.department_id,
        due_date=datetime.fromisoformat(ticket_data.due_date) if ticket_data.due_date else None
    )
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    return {"ticket": serialize_ticket(ticket, db)}

@router.get("")
def get_tickets(
    user_id: str,
    user_role: str,
    status: Optional[str] = None,
    type: Optional[str] = None,
    assigned_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Ticket)
    
    # Filter based on role
    if user_role not in ["system_admin", "hospital_admin"]:
        query = query.filter(or_(
            Ticket.created_by == user_id,
            Ticket.assigned_to == user_id
        ))
    
    if status:
        query = query.filter(Ticket.status == status)
    if type:
        query = query.filter(Ticket.type == type)
    if assigned_to:
        query = query.filter(Ticket.assigned_to == assigned_to)
    
    tickets = query.order_by(Ticket.created_at.desc()).all()
    return {"tickets": [serialize_ticket(t, db) for t in tickets]}

@router.get("/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    comments = db.query(TicketComment).filter(TicketComment.ticket_id == ticket_id).order_by(TicketComment.created_at).all()
    
    return {
        "ticket": serialize_ticket(ticket, db),
        "comments": [serialize_comment(c, db) for c in comments]
    }

@router.patch("/{ticket_id}")
def update_ticket(ticket_id: str, updates: TicketUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if updates.title:
        ticket.title = updates.title
    if updates.description:
        ticket.description = updates.description
    if updates.priority:
        ticket.priority = updates.priority
    if updates.status:
        ticket.status = updates.status
        if updates.status == "resolved":
            ticket.resolved_at = datetime.now()
    if updates.assigned_to is not None:
        ticket.assigned_to = updates.assigned_to
    if updates.due_date:
        ticket.due_date = datetime.fromisoformat(updates.due_date)
    if updates.notes:
        ticket.notes = updates.notes
    if updates.resolution:
        ticket.resolution = updates.resolution
    
    ticket.updated_at = datetime.now()
    db.commit()
    db.refresh(ticket)
    
    return {"ticket": serialize_ticket(ticket, db)}

@router.post("/{ticket_id}/comments")
def add_comment(ticket_id: str, comment_data: CommentCreate, user_id: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    comment = TicketComment(
        id=str(uuid.uuid4()),
        ticket_id=ticket_id,
        user_id=user_id,
        comment=comment_data.comment
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return {"comment": serialize_comment(comment, db)}

@router.get("/stats/summary")
def get_ticket_stats(user_id: str, user_role: str, db: Session = Depends(get_db)):
    query = db.query(Ticket)
    
    if user_role not in ["system_admin", "hospital_admin"]:
        query = query.filter(or_(
            Ticket.created_by == user_id,
            Ticket.assigned_to == user_id
        ))
    
    total = query.count()
    open_tickets = query.filter(Ticket.status == "open").count()
    in_progress = query.filter(Ticket.status == "in_progress").count()
    resolved = query.filter(Ticket.status == "resolved").count()
    
    return {
        "total": total,
        "open": open_tickets,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": query.filter(Ticket.status == "closed").count()
    }

def serialize_ticket(ticket: Ticket, db: Session):
    created_by_user = db.query(User).filter(User.id == ticket.created_by).first()
    assigned_to_user = db.query(User).filter(User.id == ticket.assigned_to).first() if ticket.assigned_to else None
    
    return {
        "id": ticket.id,
        "ticketNumber": ticket.ticket_number,
        "title": ticket.title,
        "description": ticket.description,
        "type": ticket.type,
        "priority": ticket.priority,
        "status": ticket.status,
        "category": ticket.category,
        "createdBy": {
            "id": created_by_user.id,
            "name": created_by_user.full_name,
            "role": created_by_user.role
        } if created_by_user else None,
        "assignedTo": {
            "id": assigned_to_user.id,
            "name": assigned_to_user.full_name,
            "role": assigned_to_user.role
        } if assigned_to_user else None,
        "hospitalId": ticket.hospital_id,
        "departmentId": ticket.department_id,
        "dueDate": ticket.due_date.isoformat() if ticket.due_date else None,
        "createdAt": ticket.created_at.isoformat() if ticket.created_at else None,
        "updatedAt": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "resolvedAt": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        "notes": ticket.notes,
        "resolution": ticket.resolution
    }

def serialize_comment(comment: TicketComment, db: Session):
    user = db.query(User).filter(User.id == comment.user_id).first()
    
    return {
        "id": comment.id,
        "ticketId": comment.ticket_id,
        "user": {
            "id": user.id,
            "name": user.full_name,
            "role": user.role
        } if user else None,
        "comment": comment.comment,
        "createdAt": comment.created_at.isoformat() if comment.created_at else None
    }
