import { type User, type InsertUser, type Patient, type InsertPatient, type LabResult, type InsertLabResult, type Appointment, type InsertAppointment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByNIN(nin: string): Promise<User | undefined>;
  getUserByFingerprint(fingerprintData: string): Promise<User | undefined>;
  getUserByFacial(facialData: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Patient operations
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByMRN(mrn: string): Promise<Patient | undefined>;
  getPatientByNIN(nin: string): Promise<Patient | undefined>;
  getPatientByFingerprint(fingerprintData: string): Promise<Patient | undefined>;
  getPatientByFacial(facialData: string): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  getAllPatients(): Promise<Patient[]>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;
  
  // Lab Results operations
  createLabResult(labResult: InsertLabResult): Promise<LabResult>;
  getLabResult(id: string): Promise<LabResult | undefined>;
  getPatientLabResults(patientId: string): Promise<LabResult[]>;
  updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult | undefined>;
  deleteLabResult(id: string): Promise<boolean>;
  
  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getPatientAppointments(patientId: string): Promise<Appointment[]>;
  getDoctorAppointments(doctorId: string): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;
  private labResults: Map<string, LabResult>;
  private appointments: Map<string, Appointment>;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.labResults = new Map();
    this.appointments = new Map();
    this.seedDefaultUsers();
    this.seedDefaultPatients();
  }

  private seedDefaultUsers() {
    // Seed default users
    const defaultUsers: InsertUser[] = [
      {
        username: "admin",
        password: "adminpass",
        role: "admin",
        fullName: "System Administrator",
        isActive: 1,
      },
      {
        username: "doctor1",
        password: "pass123",
        role: "doctor",
        fullName: "Dr. Sarah Johnson",
        isActive: 1,
      },
      {
        username: "nurse1",
        password: "nursepass",
        role: "nurse",
        fullName: "Nurse Emily Davis",
        isActive: 1,
      },
      {
        username: "patient",
        password: "paypass",
        role: "patient",
        fullName: "Patient User",
        isActive: 1,
      },
    ];

    defaultUsers.forEach(user => {
      const id = randomUUID();
      const newUser: User = { 
        ...user,
        id,
        createdAt: new Date(),
        isActive: user.isActive ?? 1,
      };
      this.users.set(id, newUser);
    });
  }

  private seedDefaultPatients() {
    // Get a doctor user for registering patients
    const doctorUser = Array.from(this.users.values()).find(u => u.role === "doctor");
    const registeredBy = doctorUser?.id || "system";

    // Seed default patients with comprehensive data
    const defaultPatients: InsertPatient[] = [
      {
        firstName: "Tega",
        lastName: "Team",
        age: 20,
        gender: "male",
        phoneNumber: "08123456789",
        email: "tega.team@email.com",
        address: "123 Health Street, Medical District",
        mrn: "MRN-20250001",
        nin: "12345678901",
        bloodGroup: "O+",
        genotype: "AA",
        allergies: "None",
        symptoms: "Fever, fatigue",
        bloodPressureSystolic: 130,
        bloodPressureDiastolic: 90,
        temperature: "45",
        heartRate: 88,
        weight: "75",
        facialRecognitionData: "facial_tega_team_001",
        fingerprintData: "fingerprint_tega_team_001",
        registeredBy,
      },
      {
        firstName: "Chioma",
        lastName: "Okafor",
        age: 35,
        gender: "female",
        phoneNumber: "08198765432",
        email: "chioma.okafor@email.com",
        address: "456 Wellness Avenue, Health Hub",
        mrn: "MRN-20250002",
        nin: "98765432101",
        bloodGroup: "A+",
        genotype: "AS",
        allergies: "Penicillin",
        symptoms: "Hypertension, fatigue",
        bloodPressureSystolic: 165,
        bloodPressureDiastolic: 105,
        temperature: "36.8",
        heartRate: 92,
        weight: "68",
        facialRecognitionData: "facial_chioma_okafor_001",
        fingerprintData: "fingerprint_chioma_okafor_001",
        registeredBy,
      },
      {
        firstName: "Adeyemi",
        lastName: "Adeleke",
        age: 62,
        gender: "male",
        phoneNumber: "08134567890",
        email: "adeyemi.adeleke@email.com",
        address: "789 Senior Care Lane, Retirement Community",
        mrn: "MRN-20250003",
        nin: "11223344556",
        bloodGroup: "B+",
        genotype: "AA",
        allergies: "Aspirin",
        symptoms: "Chest pain, shortness of breath",
        bloodPressureSystolic: 175,
        bloodPressureDiastolic: 110,
        temperature: "37.2",
        heartRate: 105,
        weight: "82",
        facialRecognitionData: "facial_adeyemi_adeleke_001",
        fingerprintData: "fingerprint_adeyemi_adeleke_001",
        registeredBy,
      },
      {
        firstName: "Zainab",
        lastName: "Hassan",
        age: 28,
        gender: "female",
        phoneNumber: "07089876543",
        email: "zainab.hassan@email.com",
        address: "321 Young Adults Plaza, Downtown",
        mrn: "MRN-20250004",
        nin: "55667788990",
        bloodGroup: "AB-",
        genotype: "AA",
        allergies: "Sulfonamides",
        symptoms: "Migraine, nausea",
        bloodPressureSystolic: 118,
        bloodPressureDiastolic: 76,
        temperature: "36.5",
        heartRate: 72,
        weight: "62",
        facialRecognitionData: "facial_zainab_hassan_001",
        fingerprintData: "fingerprint_zainab_hassan_001",
        registeredBy,
      },
      {
        firstName: "Emeka",
        lastName: "Nwankwo",
        age: 19,
        gender: "male",
        phoneNumber: "08156789012",
        email: "emeka.nwankwo@email.com",
        address: "654 Youth Center, Campus District",
        mrn: "MRN-20250005",
        nin: "44556677889",
        bloodGroup: "O-",
        genotype: "SS",
        allergies: "None documented",
        symptoms: "Acute pain, fever",
        bloodPressureSystolic: 128,
        bloodPressureDiastolic: 82,
        temperature: "38.5",
        heartRate: 95,
        weight: "70",
        facialRecognitionData: "facial_emeka_nwankwo_001",
        fingerprintData: "fingerprint_emeka_nwankwo_001",
        registeredBy,
      },
    ];

    defaultPatients.forEach(patient => {
      const id = randomUUID();
      const now = new Date();
      const newPatient: Patient = {
        ...patient,
        id,
        createdAt: now,
        updatedAt: now,
        lastUpdatedBy: registeredBy,
      };
      this.patients.set(id, newPatient);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByNIN(nin: string): Promise<User | undefined> {
    // Look up user by NIN from patients table - find patient with this NIN and get their registering user
    // For now, return first user as demo - in production would query patient's registeredBy
    return Array.from(this.users.values()).find(
      (user) => user.role === "doctor" || user.role === "admin",
    );
  }

  async getUserByFingerprint(fingerprintData: string): Promise<User | undefined> {
    // In production, would look up patient by fingerprint and get their associated user
    // For demo, verify the fingerprint contains timestamp (our demo format)
    if (fingerprintData.includes("fingerprint_")) {
      return Array.from(this.users.values()).find(
        (user) => user.role === "doctor" || user.role === "admin",
      );
    }
    return undefined;
  }

  async getUserByFacial(facialData: string): Promise<User | undefined> {
    // In production, would look up patient by facial data and get their associated user
    // For demo, verify the facial data contains timestamp (our demo format)
    if (facialData.includes("facial_")) {
      return Array.from(this.users.values()).find(
        (user) => user.role === "doctor" || user.role === "admin",
      );
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id,
      createdAt: new Date(),
      isActive: insertUser.isActive ?? 1,
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Patient methods
  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByMRN(mrn: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.mrn === mrn,
    );
  }

  async getPatientByNIN(nin: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.nin.toLowerCase() === nin.toLowerCase(),
    );
  }

  async getPatientByFingerprint(fingerprintData: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.fingerprintData === fingerprintData,
    );
  }

  async getPatientByFacial(facialData: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.facialRecognitionData === facialData,
    );
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.patients.values()).filter((patient) => 
      patient.firstName.toLowerCase().includes(lowerQuery) ||
      patient.lastName.toLowerCase().includes(lowerQuery) ||
      patient.nin.toLowerCase().includes(lowerQuery) ||
      patient.mrn.toLowerCase().includes(lowerQuery)
    );
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const now = new Date();
    const patient: Patient = { 
      ...insertPatient,
      id,
      createdAt: now,
      updatedAt: now,
      address: insertPatient.address ?? null,
    };
    this.patients.set(id, patient);
    return patient;
  }

  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient = { 
      ...patient, 
      ...updates,
      updatedAt: new Date(),
    };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: string): Promise<boolean> {
    return this.patients.delete(id);
  }

  // Lab Results methods
  async createLabResult(insertLabResult: InsertLabResult): Promise<LabResult> {
    const id = randomUUID();
    const now = new Date();
    const labResult: LabResult = {
      ...insertLabResult,
      id,
      createdAt: now,
      updatedAt: now,
      automatedAnalysis: null,
    };
    this.labResults.set(id, labResult);
    return labResult;
  }

  async getLabResult(id: string): Promise<LabResult | undefined> {
    return this.labResults.get(id);
  }

  async getPatientLabResults(patientId: string): Promise<LabResult[]> {
    return Array.from(this.labResults.values()).filter(
      (result) => result.patientId === patientId
    );
  }

  async updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult | undefined> {
    const labResult = this.labResults.get(id);
    if (!labResult) return undefined;

    const updatedLabResult = {
      ...labResult,
      ...updates,
      updatedAt: new Date(),
    };
    this.labResults.set(id, updatedLabResult);
    return updatedLabResult;
  }

  async deleteLabResult(id: string): Promise<boolean> {
    return this.labResults.delete(id);
  }

  // Appointment methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const now = new Date();
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (apt) => apt.patientId === patientId
    );
  }

  async getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (apt) => apt.doctorId === doctorId
    );
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    const updatedAppointment = {
      ...appointment,
      ...updates,
      updatedAt: new Date(),
    };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.appointments.delete(id);
  }
}

export const storage = new MemStorage();
