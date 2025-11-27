import { type User, type InsertUser, type Patient, type InsertPatient, type LabResult, type InsertLabResult, type Appointment, type InsertAppointment, type Subscription, type InsertSubscription, type Department, type InsertDepartment, type Notification, type InsertNotification, users, patients, labResults, appointments, subscriptions, departments, notifications } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, ilike } from "drizzle-orm";
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

  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionByAdminId(adminUserId: string): Promise<Subscription | undefined>;
  updateSubscription(adminUserId: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Department operations
  createDepartment(department: InsertDepartment): Promise<Department>;
  getDepartment(id: string): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  getDepartmentsByHospital(hospitalAdminId: string): Promise<Department[]>;
  updateDepartment(id: string, updates: Partial<Department>): Promise<Department | undefined>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotification(id: string): Promise<Notification | undefined>;
  getDepartmentNotifications(departmentId: string): Promise<Notification[]>;
  updateNotification(id: string, updates: Partial<Notification>): Promise<Notification | undefined>;

  // Database initialization
  initialize(): Promise<void>;
}

export class ProductionStorage implements IStorage {
  async initialize(): Promise<void> {
    // Check if we already have data
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already initialized with", existingUsers.length, "users");
      return;
    }

    console.log("Initializing database with seed data...");
    
    // Seed users
    const defaultUsers: InsertUser[] = [
      {
        username: "admin",
        password: "paypass",
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

    const createdUsers = await Promise.all(
      defaultUsers.map(user => this.createUser(user))
    );

    const adminUser = createdUsers[0];
    const doctorUser = createdUsers[1];

    // Seed departments
    const defaultDepartments: InsertDepartment[] = [
      {
        hospitalAdminId: adminUser.id,
        name: "Cardiology",
        description: "Heart and cardiovascular diseases",
        status: "active",
      },
      {
        hospitalAdminId: adminUser.id,
        name: "Emergency",
        description: "Emergency and trauma care",
        status: "active",
      },
      {
        hospitalAdminId: adminUser.id,
        name: "Pediatrics",
        description: "Children's health services",
        status: "active",
      },
    ];

    await Promise.all(
      defaultDepartments.map(dept => this.createDepartment(dept))
    );

    // Seed patients
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
        registeredBy: doctorUser.id,
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
        registeredBy: doctorUser.id,
      },
    ];

    await Promise.all(
      defaultPatients.map(patient => this.createPatient(patient))
    );

    console.log("Database initialization complete");
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByNIN(nin: string): Promise<User | undefined> {
    const patientList = await db.select().from(patients).where(eq(patients.nin, nin));
    if (patientList.length === 0) return undefined;
    const patientData = patientList[0];
    const userList = await db.select().from(users).where(eq(users.id, patientData.registeredBy));
    return userList[0];
  }

  async getUserByFingerprint(fingerprintData: string): Promise<User | undefined> {
    const patientList = await db.select().from(patients).where(eq(patients.fingerprintData, fingerprintData));
    if (patientList.length === 0) return undefined;
    const patientData = patientList[0];
    const userList = await db.select().from(users).where(eq(users.id, patientData.registeredBy));
    return userList[0];
  }

  async getUserByFacial(facialData: string): Promise<User | undefined> {
    const patientList = await db.select().from(patients).where(eq(patients.facialRecognitionData, facialData));
    if (patientList.length === 0) return undefined;
    const patientData = patientList[0];
    const userList = await db.select().from(users).where(eq(users.id, patientData.registeredBy));
    return userList[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const result = await db.insert(users).values({
      id,
      ...insertUser,
    }).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Patient methods
  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id));
    return result[0];
  }

  async getPatientByMRN(mrn: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.mrn, mrn));
    return result[0];
  }

  async getPatientByNIN(nin: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.nin, nin));
    return result[0];
  }

  async getPatientByFingerprint(fingerprintData: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.fingerprintData, fingerprintData));
    return result[0];
  }

  async getPatientByFacial(facialData: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.facialRecognitionData, facialData));
    return result[0];
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return await db.select().from(patients).where(
      or(
        ilike(patients.firstName, `%${query}%`),
        ilike(patients.lastName, `%${query}%`),
        ilike(patients.nin, `%${query}%`),
        ilike(patients.mrn, `%${query}%`)
      )
    );
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const result = await db.insert(patients).values({
      id,
      ...insertPatient,
    }).returning();
    return result[0];
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients);
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const result = await db.update(patients).set({ ...updates, updatedAt: new Date() }).where(eq(patients.id, id)).returning();
    return result[0];
  }

  async deletePatient(id: string): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return !!result;
  }

  // Lab Results methods
  async createLabResult(insertLabResult: InsertLabResult): Promise<LabResult> {
    const id = randomUUID();
    const result = await db.insert(labResults).values({
      id,
      ...insertLabResult,
    }).returning();
    return result[0];
  }

  async getLabResult(id: string): Promise<LabResult | undefined> {
    const result = await db.select().from(labResults).where(eq(labResults.id, id));
    return result[0];
  }

  async getPatientLabResults(patientId: string): Promise<LabResult[]> {
    return await db.select().from(labResults).where(eq(labResults.patientId, patientId));
  }

  async updateLabResult(id: string, updates: Partial<LabResult>): Promise<LabResult | undefined> {
    const result = await db.update(labResults).set({ ...updates, updatedAt: new Date() }).where(eq(labResults.id, id)).returning();
    return result[0];
  }

  async deleteLabResult(id: string): Promise<boolean> {
    const result = await db.delete(labResults).where(eq(labResults.id, id));
    return !!result;
  }

  // Appointment methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const result = await db.insert(appointments).values({
      id,
      status: "pending",
      ...insertAppointment,
    }).returning();
    return result[0];
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.patientId, patientId));
  }

  async getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.doctorId, doctorId));
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const result = await db.update(appointments).set({ ...updates, updatedAt: new Date() }).where(eq(appointments.id, id)).returning();
    return result[0];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return !!result;
  }

  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    
    const result = await db.insert(subscriptions).values({
      id,
      ...insertSubscription,
      trialStartDate: now,
      trialEndDate,
    }).returning();
    return result[0];
  }

  async getSubscriptionByAdminId(adminUserId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.adminUserId, adminUserId));
    return result[0];
  }

  async updateSubscription(adminUserId: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions).set({ ...updates, updatedAt: new Date() }).where(eq(subscriptions.adminUserId, adminUserId)).returning();
    return result[0];
  }

  // Department methods
  async createDepartment(department: InsertDepartment): Promise<Department> {
    const id = randomUUID();
    const result = await db.insert(departments).values({
      id,
      ...department,
    }).returning();
    return result[0];
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartmentsByHospital(hospitalAdminId: string): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.hospitalAdminId, hospitalAdminId));
  }

  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department | undefined> {
    const result = await db.update(departments).set({ ...updates, updatedAt: new Date() }).where(eq(departments.id, id)).returning();
    return result[0];
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const result = await db.insert(notifications).values({
      id,
      ...notification,
    }).returning();
    return result[0];
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id));
    return result[0];
  }

  async getDepartmentNotifications(departmentId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.departmentId, departmentId));
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification | undefined> {
    const result = await db.update(notifications).set({ ...updates, updatedAt: new Date() }).where(eq(notifications.id, id)).returning();
    return result[0];
  }
}

// Import at the end to avoid circular dependencies
import { or } from "drizzle-orm";

export const storage = new ProductionStorage();
