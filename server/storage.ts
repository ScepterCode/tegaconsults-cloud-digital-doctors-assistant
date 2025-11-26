import { type User, type InsertUser, type Patient, type InsertPatient } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.seedDefaultUsers();
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
}

export const storage = new MemStorage();
