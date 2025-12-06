# Medical Records & Prescription Management System

## Overview
This system allows all healthcare staff (doctors, nurses, lab technicians, pharmacists) to contribute to a patient's medical history through file uploads and prescription management.

## Features

### 1. Patient Medical History (`/medical-history`)
**Access:** Doctors, Nurses, Lab Technicians, Pharmacists, Admins

#### File Upload Capabilities
All authorized staff can upload various types of medical files:

- **Lab Results** - Blood tests, urinalysis, cultures, etc.
- **Prescriptions** - Medication orders and prescriptions
- **Scans** - X-rays, MRI, CT scans, ultrasounds
- **Reports** - Medical reports, discharge summaries
- **Other** - Any other relevant medical documents

#### Features:
- Upload files with descriptions and categories
- Filter files by type (lab results, scans, prescriptions, etc.)
- Search files by name or description
- View who uploaded each file and when
- Download files
- Delete files (doctors and admins only)
- Track file size and metadata

#### File Categories:
- Blood Test
- X-Ray
- MRI
- CT Scan
- Ultrasound
- Custom categories

### 2. Prescription Management (`/prescriptions`)
**Access:** Pharmacists, Doctors, Admins

#### For Pharmacists:
- View all pending prescriptions
- Dispense medications with confirmation
- Add notes when dispensing
- Track dispensed prescriptions
- Search by patient name, MRN, or medication

#### For Doctors:
- Create new prescriptions
- View prescription history
- Track dispensing status

#### Prescription Information:
- Patient details (name, MRN)
- Medication name
- Dosage
- Frequency
- Duration
- Special instructions
- Prescribing doctor
- Dispensing pharmacist (when dispensed)
- Status tracking (pending/dispensed)

## API Endpoints

### Patient Files API

#### Upload File
```
POST /api/patient-files/upload
Headers: user-id: <user_id>
Body: {
  patient_id: string,
  file_type: "lab_result" | "prescription" | "scan" | "report" | "other",
  file_name: string,
  file_data: string (base64),
  description?: string,
  category?: string
}
```

#### Get Patient Files
```
GET /api/patient-files/patient/{patient_id}
Query Params: file_type?, category?
Headers: user-id: <user_id>
```

#### Delete File
```
DELETE /api/patient-files/{file_id}
Headers: user-id: <user_id>
```

### Prescriptions API

#### Create Prescription
```
POST /api/prescriptions
Headers: user-id: <doctor_id>
Body: {
  patient_id: string,
  medication_name: string,
  dosage: string,
  frequency: string,
  duration: string,
  instructions?: string
}
```

#### Get Patient Prescriptions
```
GET /api/prescriptions/patient/{patient_id}
Query Params: status?
```

#### Get Pending Prescriptions
```
GET /api/prescriptions/pending
```

#### Dispense Prescription
```
POST /api/prescriptions/{prescription_id}/dispense
Headers: user-id: <pharmacist_id>
Body: {
  notes?: string
}
```

## Database Models

### PatientFile
- id (UUID)
- patient_id
- uploaded_by (User ID)
- file_type
- file_name
- file_url
- file_size
- description
- category
- uploaded_by_role
- created_at

### Prescription
- id (UUID)
- patient_id
- doctor_id
- medication_name
- dosage
- frequency
- duration
- instructions
- status (pending/dispensed)
- dispensed_by (Pharmacist ID)
- dispensed_at
- notes
- created_at

## Role-Based Access

### Doctors
- Upload all file types
- Create prescriptions
- View all patient files
- Delete files

### Nurses
- Upload files (lab results, reports)
- View patient files
- Cannot delete files

### Lab Technicians
- Upload lab results and scans
- View patient files
- Cannot delete files

### Pharmacists
- Upload prescription-related files
- View and dispense prescriptions
- Add dispensing notes
- Cannot delete files

### Admins
- Full access to all features
- Can delete files
- Can manage all prescriptions

## Workflow Examples

### Lab Technician Workflow
1. Patient has blood work done
2. Lab tech logs into system
3. Navigates to Medical History
4. Selects patient
5. Uploads lab results PDF
6. Categorizes as "Blood Test"
7. Adds description: "Complete Blood Count - Fasting"
8. File is now part of patient's permanent record

### Pharmacist Workflow
1. Doctor creates prescription in system
2. Pharmacist sees prescription in "Pending" tab
3. Patient arrives at pharmacy
4. Pharmacist reviews prescription details
5. Prepares medication
6. Clicks "Dispense" button
7. Adds notes if needed (e.g., "Patient counseled on side effects")
8. Prescription marked as dispensed
9. Record includes who dispensed it and when

### Doctor Workflow
1. Reviews patient's complete medical history
2. Sees all uploaded files (labs, scans, reports)
3. Creates new prescription
4. Uploads additional medical reports
5. Can track if prescription has been dispensed

## Benefits

1. **Centralized Records** - All patient files in one place
2. **Audit Trail** - Track who uploaded what and when
3. **Role-Based Security** - Staff only access what they need
4. **Workflow Efficiency** - Streamlined prescription dispensing
5. **Comprehensive History** - Complete medical timeline
6. **Collaboration** - All staff contribute to patient care
7. **Accountability** - Clear tracking of all actions

## Navigation

The system is integrated into the main navigation:

- **Doctors**: Medical History, Prescriptions in main menu
- **Nurses**: Medical History for uploading vitals and reports
- **Lab Techs**: Medical History (labeled "Upload Results")
- **Pharmacists**: Prescriptions as primary feature

## Future Enhancements

- Electronic signature for prescriptions
- Automatic alerts for critical lab values
- Integration with external lab systems
- Prescription refill requests
- Drug interaction checking
- Inventory management integration
