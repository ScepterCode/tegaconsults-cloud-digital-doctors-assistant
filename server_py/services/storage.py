from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
import uuid

from server_py.models.user import User
from server_py.models.patient import Patient
from server_py.models.appointment import Appointment
from server_py.models.lab_result import LabResult
from server_py.models.subscription import Subscription
from server_py.models.department import Department
from server_py.models.notification import Notification

class StorageService:
    def __init__(self, db: Session):
        self.db = db
    
    # User operations
    def get_user(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_nin(self, nin: str) -> Optional[User]:
        return None
    
    def get_user_by_fingerprint(self, fingerprint_data: str) -> Optional[User]:
        return None
    
    def get_user_by_facial(self, facial_data: str) -> Optional[User]:
        return None
    
    def create_user(self, user_data: dict) -> User:
        user = User(
            id=str(uuid.uuid4()),
            username=user_data.get("username"),
            password=user_data.get("password"),
            role=user_data.get("role"),
            full_name=user_data.get("full_name") or user_data.get("fullName"),
            hospital_admin_id=user_data.get("hospital_admin_id") or user_data.get("hospitalAdminId"),
            department_id=user_data.get("department_id") or user_data.get("departmentId"),
            is_active=user_data.get("is_active", 1)
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_all_users(self) -> List[User]:
        return self.db.query(User).all()
    
    def update_user(self, user_id: str, updates: dict) -> Optional[User]:
        user = self.get_user(user_id)
        if user:
            for key, value in updates.items():
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)
            self.db.commit()
            self.db.refresh(user)
        return user
    
    # Patient operations
    def get_patient(self, patient_id: str) -> Optional[Patient]:
        return self.db.query(Patient).filter(Patient.id == patient_id).first()
    
    def get_patient_by_mrn(self, mrn: str) -> Optional[Patient]:
        return self.db.query(Patient).filter(Patient.mrn == mrn).first()
    
    def get_patient_by_nin(self, nin: str) -> Optional[Patient]:
        return self.db.query(Patient).filter(Patient.nin == nin).first()
    
    def get_patient_by_fingerprint(self, fingerprint_data: str) -> Optional[Patient]:
        return self.db.query(Patient).filter(Patient.fingerprint_data == fingerprint_data).first()
    
    def get_patient_by_facial(self, facial_data: str) -> Optional[Patient]:
        return self.db.query(Patient).filter(Patient.facial_recognition_data == facial_data).first()
    
    def search_patients(self, query: str) -> List[Patient]:
        search_term = f"%{query}%"
        return self.db.query(Patient).filter(
            or_(
                Patient.first_name.ilike(search_term),
                Patient.last_name.ilike(search_term),
                Patient.mrn.ilike(search_term),
                Patient.nin.ilike(search_term)
            )
        ).all()
    
    def create_patient(self, patient_data: dict) -> Patient:
        patient = Patient(
            id=str(uuid.uuid4()),
            mrn=patient_data.get("mrn"),
            first_name=patient_data.get("first_name") or patient_data.get("firstName"),
            last_name=patient_data.get("last_name") or patient_data.get("lastName"),
            age=patient_data.get("age"),
            gender=patient_data.get("gender"),
            phone_number=patient_data.get("phone_number") or patient_data.get("phoneNumber"),
            email=patient_data.get("email"),
            address=patient_data.get("address"),
            nin=patient_data.get("nin"),
            blood_group=patient_data.get("blood_group") or patient_data.get("bloodGroup"),
            genotype=patient_data.get("genotype"),
            allergies=patient_data.get("allergies"),
            symptoms=patient_data.get("symptoms"),
            bp_systolic=patient_data.get("bp_systolic") or patient_data.get("bloodPressureSystolic"),
            bp_diastolic=patient_data.get("bp_diastolic") or patient_data.get("bloodPressureDiastolic"),
            temperature=patient_data.get("temperature"),
            heart_rate=patient_data.get("heart_rate") or patient_data.get("heartRate"),
            weight=patient_data.get("weight"),
            facial_recognition_data=patient_data.get("facial_recognition_data") or patient_data.get("facialRecognitionData"),
            fingerprint_data=patient_data.get("fingerprint_data") or patient_data.get("fingerprintData"),
            registered_by=patient_data.get("registered_by") or patient_data.get("registeredBy")
        )
        self.db.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        return patient
    
    def get_all_patients(self) -> List[Patient]:
        return self.db.query(Patient).all()
    
    def update_patient(self, patient_id: str, updates: dict) -> Optional[Patient]:
        patient = self.get_patient(patient_id)
        if patient:
            for key, value in updates.items():
                if hasattr(patient, key) and value is not None:
                    setattr(patient, key, value)
            self.db.commit()
            self.db.refresh(patient)
        return patient
    
    def delete_patient(self, patient_id: str) -> bool:
        patient = self.get_patient(patient_id)
        if patient:
            self.db.delete(patient)
            self.db.commit()
            return True
        return False
    
    # Appointment operations
    def create_appointment(self, appointment_data: dict) -> Appointment:
        appointment = Appointment(
            id=str(uuid.uuid4()),
            patient_id=appointment_data.get("patient_id") or appointment_data.get("patientId"),
            doctor_id=appointment_data.get("doctor_id") or appointment_data.get("doctorId"),
            appointment_date=appointment_data.get("appointment_date") or appointment_data.get("appointmentDate"),
            appointment_time=appointment_data.get("appointment_time") or appointment_data.get("appointmentTime"),
            reason=appointment_data.get("reason"),
            status=appointment_data.get("status", "scheduled"),
            notes=appointment_data.get("notes"),
            created_by=appointment_data.get("created_by") or appointment_data.get("createdBy")
        )
        self.db.add(appointment)
        self.db.commit()
        self.db.refresh(appointment)
        return appointment
    
    def get_appointment(self, appointment_id: str) -> Optional[Appointment]:
        return self.db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    def get_patient_appointments(self, patient_id: str) -> List[Appointment]:
        return self.db.query(Appointment).filter(Appointment.patient_id == patient_id).all()
    
    def get_doctor_appointments(self, doctor_id: str) -> List[Appointment]:
        return self.db.query(Appointment).filter(Appointment.doctor_id == doctor_id).all()
    
    def get_all_appointments(self) -> List[Appointment]:
        return self.db.query(Appointment).all()
    
    def update_appointment(self, appointment_id: str, updates: dict) -> Optional[Appointment]:
        appointment = self.get_appointment(appointment_id)
        if appointment:
            for key, value in updates.items():
                if hasattr(appointment, key) and value is not None:
                    setattr(appointment, key, value)
            self.db.commit()
            self.db.refresh(appointment)
        return appointment
    
    def delete_appointment(self, appointment_id: str) -> bool:
        appointment = self.get_appointment(appointment_id)
        if appointment:
            self.db.delete(appointment)
            self.db.commit()
            return True
        return False
    
    # Lab Result operations
    def create_lab_result(self, lab_result_data: dict) -> LabResult:
        lab_result = LabResult(
            id=str(uuid.uuid4()),
            patient_id=lab_result_data.get("patient_id") or lab_result_data.get("patientId"),
            test_name=lab_result_data.get("test_name") or lab_result_data.get("testName"),
            test_category=lab_result_data.get("test_category") or lab_result_data.get("testCategory"),
            file_data=lab_result_data.get("file_data") or lab_result_data.get("fileData"),
            file_name=lab_result_data.get("file_name") or lab_result_data.get("fileName"),
            file_type=lab_result_data.get("file_type") or lab_result_data.get("fileType"),
            test_values=lab_result_data.get("test_values") or lab_result_data.get("testValues"),
            normal_range=lab_result_data.get("normal_range") or lab_result_data.get("normalRange"),
            status=lab_result_data.get("status"),
            uploaded_by=lab_result_data.get("uploaded_by") or lab_result_data.get("uploadedBy")
        )
        self.db.add(lab_result)
        self.db.commit()
        self.db.refresh(lab_result)
        return lab_result
    
    def get_lab_result(self, lab_result_id: str) -> Optional[LabResult]:
        return self.db.query(LabResult).filter(LabResult.id == lab_result_id).first()
    
    def get_patient_lab_results(self, patient_id: str) -> List[LabResult]:
        return self.db.query(LabResult).filter(LabResult.patient_id == patient_id).all()
    
    def update_lab_result(self, lab_result_id: str, updates: dict) -> Optional[LabResult]:
        lab_result = self.get_lab_result(lab_result_id)
        if lab_result:
            for key, value in updates.items():
                if hasattr(lab_result, key) and value is not None:
                    setattr(lab_result, key, value)
            self.db.commit()
            self.db.refresh(lab_result)
        return lab_result
    
    def delete_lab_result(self, lab_result_id: str) -> bool:
        lab_result = self.get_lab_result(lab_result_id)
        if lab_result:
            self.db.delete(lab_result)
            self.db.commit()
            return True
        return False
    
    # Department operations
    def create_department(self, department_data: dict) -> Department:
        department = Department(
            id=str(uuid.uuid4()),
            hospital_admin_id=department_data.get("hospital_admin_id") or department_data.get("hospitalAdminId"),
            name=department_data.get("name"),
            description=department_data.get("description"),
            head_staff_id=department_data.get("head_staff_id") or department_data.get("headStaffId"),
            status=department_data.get("status", "active")
        )
        self.db.add(department)
        self.db.commit()
        self.db.refresh(department)
        return department
    
    def get_department(self, department_id: str) -> Optional[Department]:
        return self.db.query(Department).filter(Department.id == department_id).first()
    
    def get_departments_by_hospital(self, hospital_admin_id: str) -> List[Department]:
        return self.db.query(Department).filter(Department.hospital_admin_id == hospital_admin_id).all()
    
    def get_all_departments(self) -> List[Department]:
        return self.db.query(Department).all()
    
    def update_department(self, department_id: str, updates: dict) -> Optional[Department]:
        department = self.get_department(department_id)
        if department:
            for key, value in updates.items():
                if hasattr(department, key) and value is not None:
                    setattr(department, key, value)
            self.db.commit()
            self.db.refresh(department)
        return department
    
    # Subscription operations
    def create_subscription(self, subscription_data: dict) -> Subscription:
        subscription = Subscription(
            id=str(uuid.uuid4()),
            hospital_name=subscription_data.get("hospital_name") or subscription_data.get("hospitalName"),
            admin_user_id=subscription_data.get("admin_user_id") or subscription_data.get("adminUserId"),
            tier=subscription_data.get("tier", "free"),
            status=subscription_data.get("status", "trial")
        )
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def get_subscription_by_admin_id(self, admin_user_id: str) -> Optional[Subscription]:
        return self.db.query(Subscription).filter(Subscription.admin_user_id == admin_user_id).first()
    
    def update_subscription(self, admin_user_id: str, updates: dict) -> Optional[Subscription]:
        subscription = self.get_subscription_by_admin_id(admin_user_id)
        if subscription:
            for key, value in updates.items():
                if hasattr(subscription, key) and value is not None:
                    setattr(subscription, key, value)
            self.db.commit()
            self.db.refresh(subscription)
        return subscription
    
    # Notification operations
    def create_notification(self, notification_data: dict) -> Notification:
        notification = Notification(
            id=str(uuid.uuid4()),
            department_id=notification_data.get("department_id") or notification_data.get("departmentId"),
            patient_id=notification_data.get("patient_id") or notification_data.get("patientId"),
            appointment_id=notification_data.get("appointment_id") or notification_data.get("appointmentId"),
            type=notification_data.get("type"),
            title=notification_data.get("title"),
            message=notification_data.get("message"),
            priority=notification_data.get("priority", "normal"),
            requested_by=notification_data.get("requested_by") or notification_data.get("requestedBy"),
            status=notification_data.get("status", "unread"),
            action_data=notification_data.get("action_data") or notification_data.get("actionData")
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def get_notification(self, notification_id: str) -> Optional[Notification]:
        return self.db.query(Notification).filter(Notification.id == notification_id).first()
    
    def get_department_notifications(self, department_id: str) -> List[Notification]:
        return self.db.query(Notification).filter(Notification.department_id == department_id).all()
    
    def update_notification(self, notification_id: str, updates: dict) -> Optional[Notification]:
        notification = self.get_notification(notification_id)
        if notification:
            for key, value in updates.items():
                if hasattr(notification, key) and value is not None:
                    setattr(notification, key, value)
            self.db.commit()
            self.db.refresh(notification)
        return notification
