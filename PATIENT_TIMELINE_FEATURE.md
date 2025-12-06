# Patient Timeline Feature

## Overview
The Patient Timeline feature provides a comprehensive, chronological view of all patient interactions and medical events in one place. This makes it easy for healthcare providers to see the complete history of a patient's care journey.

## Features

### 1. Unified Timeline View
All patient events are displayed in a single, chronological timeline including:
- **Appointments** - Scheduled and completed visits
- **Lab Results** - All laboratory tests and results
- **Doctor Notes** - Clinical notes and observations
- **Prescriptions** - Medications prescribed and dispensed
- **File Uploads** - Medical records, scans, reports
- **Billing** - Bills generated for services
- **Payments** - Payment transactions

### 2. Event Filtering
Filter the timeline by specific event types to focus on:
- All events (default)
- Appointments only
- Lab results only
- Doctor notes only
- Prescriptions only
- File uploads only
- Billing records only
- Payments only

### 3. Visit Summary Statistics
Quick overview cards showing:
- **Total Visits** - Completed appointments vs total scheduled
- **Lab Tests** - Total number of tests conducted
- **Prescriptions** - Total medications prescribed
- **Outstanding Balance** - Current unpaid amount

### 4. Detailed Event Information
Each timeline event shows:
- Event type with color-coded icon
- Event title and description
- Date and time
- Status badge (completed, pending, etc.)
- Additional metadata specific to event type

### 5. Patient Summary
At-a-glance patient information:
- Full name and MRN (Medical Record Number)
- Age and gender
- Blood group and genotype
- First visit date
- Last visit date

## API Endpoints

### Get Patient Timeline
```
GET /api/patient-timeline/{patient_id}
```

**Query Parameters:**
- `limit` (optional, default: 100) - Maximum number of events to return
- `event_type` (optional) - Filter by specific event type

**Response:**
```json
{
  "patient": {
    "id": "...",
    "mrn": "MRN20250001",
    "name": "John Doe",
    "age": 45,
    "gender": "male",
    "blood_group": "O+",
    "genotype": "AA"
  },
  "timeline": [
    {
      "id": "...",
      "type": "appointment",
      "title": "Appointment - General Consultation",
      "description": "Follow-up visit",
      "date": "2025-12-06T10:00:00",
      "status": "completed",
      "doctor_id": "...",
      "metadata": {...}
    }
  ],
  "event_counts": {
    "total": 45,
    "appointments": 12,
    "lab_results": 8,
    "doctor_notes": 15,
    "file_uploads": 5,
    "prescriptions": 10,
    "billing": 8,
    "payments": 7
  },
  "total_events": 45
}
```

### Get Visit Summary
```
GET /api/patient-timeline/{patient_id}/summary
```

**Response:**
```json
{
  "patient_id": "...",
  "mrn": "MRN20250001",
  "name": "John Doe",
  "first_visit_date": "2024-01-15T09:00:00",
  "last_visit_date": "2025-12-06T10:00:00",
  "visit_statistics": {
    "total_appointments": 12,
    "completed_appointments": 10,
    "total_lab_tests": 8,
    "total_prescriptions": 10,
    "total_doctor_notes": 15,
    "total_medical_files": 5
  },
  "billing_summary": {
    "total_bills": 8,
    "total_payments": 7,
    "total_billed": 450000.00,
    "total_paid": 400000.00,
    "outstanding_balance": 50000.00
  }
}
```

## Frontend Route

**URL:** `/patient-timeline/:patientId`

**Access:** Doctors, Nurses, Hospital Admins, System Admins

**Example:** `/patient-timeline/abc123-def456-ghi789`

## Usage

### From Patient Detail Page
Add a "View Timeline" button that links to:
```typescript
navigate(`/patient-timeline/${patientId}`)
```

### From Patients List
Add a timeline icon/button in the actions column:
```typescript
<Button onClick={() => navigate(`/patient-timeline/${patient.id}`)}>
  <Activity className="h-4 w-4" />
  Timeline
</Button>
```

## Event Type Colors

Each event type has a distinct color for easy identification:
- **Appointments** - Blue
- **Lab Results** - Purple
- **Doctor Notes** - Green
- **File Uploads** - Orange
- **Prescriptions** - Pink
- **Billing** - Yellow
- **Payments** - Emerald

## Status Badges

Events display status with color-coded badges:
- **Completed** - Green
- **Pending** - Yellow
- **Cancelled** - Red
- **Scheduled** - Blue
- **Dispensed** - Green (prescriptions)
- **Paid** - Green (payments)
- **Partial** - Yellow (payments)
- **Unpaid** - Red (payments)

## Benefits

1. **Complete Patient History** - See all interactions in one place
2. **Better Care Coordination** - Understand the full context of patient care
3. **Quick Reference** - Easily find past events and decisions
4. **Audit Trail** - Complete record of all patient interactions
5. **Improved Communication** - Share comprehensive patient history with other providers
6. **Billing Transparency** - See all charges and payments in context

## Future Enhancements

Potential additions:
- Export timeline to PDF
- Print timeline report
- Add notes/comments to timeline events
- Share timeline with other providers
- Filter by date range
- Search within timeline
- Group events by visit/episode
- Add custom events/milestones
- Timeline analytics and insights

## Technical Details

**Backend:** Python FastAPI
**Frontend:** React + TypeScript
**Database:** SQLite (queries multiple tables)
**Styling:** Tailwind CSS + shadcn/ui

**Tables Queried:**
- patients
- appointments
- lab_results
- doctor_notes
- patient_files
- prescriptions
- patient_bills
- payments

---
*Created: December 6, 2025*
