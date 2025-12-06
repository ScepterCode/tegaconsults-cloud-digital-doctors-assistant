"""
Patient Timeline API - Comprehensive view of all patient interactions
Shows chronological history of visits, appointments, lab results, prescriptions, etc.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from server_py.db.session import get_db
from server_py.models.patient import Patient
from server_py.models.appointment import Appointment
from server_py.models.lab_result import LabResult
from server_py.models.doctor_note import DoctorNote
from server_py.models.patient_file import PatientFile
from server_py.models.prescription import Prescription
from server_py.models.billing import PatientBill, Payment
from datetime import datetime
from typing import List, Dict, Any

router = APIRouter(prefix="/api/patient-timeline", tags=["patient-timeline"])

@router.get("/{patient_id}")
def get_patient_timeline(
    patient_id: str,
    limit: int = 100,
    event_type: str = None,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive timeline of all patient events
    
    Event types: appointment, lab_result, doctor_note, file_upload, prescription, billing, payment
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    timeline_events = []
    
    # Get appointments (if no filter or filter is appointment)
    if not event_type or event_type == "appointment":
        appointments = db.query(Appointment).filter(
            Appointment.patient_id == patient_id
        ).all()
        
        for apt in appointments:
            timeline_events.append({
                "id": apt.id,
                "type": "appointment",
                "title": f"Appointment - {apt.appointment_type or 'General'}",
                "description": apt.reason or "No reason provided",
                "date": apt.appointment_date.isoformat() if apt.appointment_date else apt.created_at.isoformat(),
                "status": apt.status,
                "doctor_id": apt.doctor_id,
                "metadata": {
                    "appointment_type": apt.appointment_type,
                    "status": apt.status
                }
            })
    
    # Get lab results
    if not event_type or event_type == "lab_result":
        lab_results = db.query(LabResult).filter(
            LabResult.patient_id == patient_id
        ).all()
        
        for lr in lab_results:
            timeline_events.append({
                "id": lr.id,
                "type": "lab_result",
                "title": f"Lab Test - {lr.test_name}",
                "description": f"Result: {lr.result or 'Pending'}",
                "date": lr.test_date.isoformat() if lr.test_date else lr.created_at.isoformat(),
                "status": lr.status,
                "metadata": {
                    "test_name": lr.test_name,
                    "result": lr.result,
                    "test_values": lr.test_values,
                    "reference_range": lr.reference_range,
                    "status": lr.status
                }
            })
    
    # Get doctor notes
    if not event_type or event_type == "doctor_note":
        doctor_notes = db.query(DoctorNote).filter(
            DoctorNote.patient_id == patient_id
        ).all()
        
        for note in doctor_notes:
            timeline_events.append({
                "id": note.id,
                "type": "doctor_note",
                "title": f"Clinical Note - {note.note_type or 'General'}",
                "description": note.content[:100] + "..." if len(note.content) > 100 else note.content,
                "date": note.created_at.isoformat(),
                "doctor_id": note.doctor_id,
                "metadata": {
                    "note_type": note.note_type,
                    "is_private": note.is_private,
                    "full_content": note.content
                }
            })
    
    # Get patient files (medical records uploads)
    if not event_type or event_type == "file_upload":
        patient_files = db.query(PatientFile).filter(
            PatientFile.patient_id == patient_id
        ).all()
        
        for file in patient_files:
            timeline_events.append({
                "id": file.id,
                "type": "file_upload",
                "title": f"Medical Record - {file.file_type or 'Document'}",
                "description": file.description or file.file_name,
                "date": file.uploaded_at.isoformat() if file.uploaded_at else file.created_at.isoformat(),
                "uploaded_by": file.uploaded_by,
                "metadata": {
                    "file_name": file.file_name,
                    "file_type": file.file_type,
                    "file_path": file.file_path,
                    "file_size": file.file_size
                }
            })
    
    # Get prescriptions
    if not event_type or event_type == "prescription":
        prescriptions = db.query(Prescription).filter(
            Prescription.patient_id == patient_id
        ).all()
        
        for rx in prescriptions:
            timeline_events.append({
                "id": rx.id,
                "type": "prescription",
                "title": f"Prescription - {rx.medication_name}",
                "description": f"{rx.dosage}, {rx.frequency} for {rx.duration}",
                "date": rx.prescribed_date.isoformat() if rx.prescribed_date else rx.created_at.isoformat(),
                "doctor_id": rx.doctor_id,
                "status": rx.status,
                "metadata": {
                    "medication_name": rx.medication_name,
                    "dosage": rx.dosage,
                    "frequency": rx.frequency,
                    "duration": rx.duration,
                    "instructions": rx.instructions,
                    "status": rx.status,
                    "dispensed_by": rx.dispensed_by,
                    "dispensed_date": rx.dispensed_date.isoformat() if rx.dispensed_date else None
                }
            })
    
    # Get billing records
    if not event_type or event_type == "billing":
        bills = db.query(PatientBill).filter(
            PatientBill.patient_id == patient_id
        ).all()
        
        for bill in bills:
            timeline_events.append({
                "id": bill.id,
                "type": "billing",
                "title": f"Bill Generated - ₦{bill.total_amount:,.2f}",
                "description": f"Status: {bill.status}, Balance: ₦{bill.balance:,.2f}",
                "date": bill.bill_date.isoformat() if bill.bill_date else bill.created_at.isoformat(),
                "status": bill.status,
                "metadata": {
                    "bill_number": bill.bill_number,
                    "total_amount": float(bill.total_amount),
                    "paid_amount": float(bill.paid_amount),
                    "balance": float(bill.balance),
                    "status": bill.status,
                    "discount_amount": float(bill.discount_amount) if bill.discount_amount else 0
                }
            })
    
    # Get payments
    if not event_type or event_type == "payment":
        payments = db.query(Payment).filter(
            Payment.patient_id == patient_id
        ).all()
        
        for payment in payments:
            timeline_events.append({
                "id": payment.id,
                "type": "payment",
                "title": f"Payment Received - ₦{payment.amount:,.2f}",
                "description": f"Method: {payment.payment_method}, Ref: {payment.reference_number}",
                "date": payment.payment_date.isoformat() if payment.payment_date else payment.created_at.isoformat(),
                "status": payment.status,
                "metadata": {
                    "amount": float(payment.amount),
                    "payment_method": payment.payment_method,
                    "reference_number": payment.reference_number,
                    "status": payment.status,
                    "processed_by": payment.processed_by
                }
            })
    
    # Sort all events by date (most recent first)
    timeline_events.sort(key=lambda x: x["date"], reverse=True)
    
    # Apply limit
    if limit:
        timeline_events = timeline_events[:limit]
    
    # Get patient summary
    patient_summary = {
        "id": patient.id,
        "mrn": patient.mrn,
        "name": f"{patient.first_name} {patient.last_name}",
        "age": patient.age,
        "gender": patient.gender,
        "blood_group": patient.blood_group,
        "genotype": patient.genotype
    }
    
    # Get event counts
    event_counts = {
        "total": len(timeline_events),
        "appointments": len([e for e in timeline_events if e["type"] == "appointment"]),
        "lab_results": len([e for e in timeline_events if e["type"] == "lab_result"]),
        "doctor_notes": len([e for e in timeline_events if e["type"] == "doctor_note"]),
        "file_uploads": len([e for e in timeline_events if e["type"] == "file_upload"]),
        "prescriptions": len([e for e in timeline_events if e["type"] == "prescription"]),
        "billing": len([e for e in timeline_events if e["type"] == "billing"]),
        "payments": len([e for e in timeline_events if e["type"] == "payment"])
    }
    
    return {
        "patient": patient_summary,
        "timeline": timeline_events,
        "event_counts": event_counts,
        "total_events": len(timeline_events)
    }

@router.get("/{patient_id}/summary")
def get_patient_visit_summary(patient_id: str, db: Session = Depends(get_db)):
    """
    Get summary statistics of patient visits and interactions
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Count various events
    total_appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).count()
    completed_appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.status == "completed"
    ).count()
    
    total_lab_tests = db.query(LabResult).filter(LabResult.patient_id == patient_id).count()
    total_prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient_id).count()
    total_doctor_notes = db.query(DoctorNote).filter(DoctorNote.patient_id == patient_id).count()
    total_files = db.query(PatientFile).filter(PatientFile.patient_id == patient_id).count()
    
    # Get last visit date (most recent appointment)
    last_appointment = db.query(Appointment).filter(
        Appointment.patient_id == patient_id
    ).order_by(Appointment.appointment_date.desc()).first()
    
    last_visit_date = None
    if last_appointment:
        last_visit_date = last_appointment.appointment_date.isoformat() if last_appointment.appointment_date else None
    
    # Get first visit date (registration or first appointment)
    first_visit_date = patient.created_at.isoformat() if patient.created_at else None
    
    # Billing summary
    total_bills = db.query(PatientBill).filter(PatientBill.patient_id == patient_id).count()
    total_payments = db.query(Payment).filter(Payment.patient_id == patient_id).count()
    
    # Calculate total billed and paid
    bills = db.query(PatientBill).filter(PatientBill.patient_id == patient_id).all()
    total_billed = sum([float(bill.total_amount) for bill in bills])
    total_paid = sum([float(bill.paid_amount) for bill in bills])
    outstanding_balance = sum([float(bill.balance) for bill in bills])
    
    return {
        "patient_id": patient_id,
        "mrn": patient.mrn,
        "name": f"{patient.first_name} {patient.last_name}",
        "first_visit_date": first_visit_date,
        "last_visit_date": last_visit_date,
        "visit_statistics": {
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "total_lab_tests": total_lab_tests,
            "total_prescriptions": total_prescriptions,
            "total_doctor_notes": total_doctor_notes,
            "total_medical_files": total_files
        },
        "billing_summary": {
            "total_bills": total_bills,
            "total_payments": total_payments,
            "total_billed": total_billed,
            "total_paid": total_paid,
            "outstanding_balance": outstanding_balance
        }
    }
