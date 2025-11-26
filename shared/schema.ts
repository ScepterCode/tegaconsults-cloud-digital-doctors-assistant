import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access control
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'admin', 'doctor', 'nurse'
  fullName: text("full_name").notNull(),
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Patients table with comprehensive biodata and vitals
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mrn: text("mrn").notNull().unique(), // Medical Record Number
  
  // Biodata
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(), // 'male', 'female', 'other'
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  address: text("address"),
  nin: text("nin").notNull(), // National Identification Number
  
  // Medical Information
  bloodGroup: text("blood_group").notNull(), // 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  genotype: text("genotype").notNull(), // 'AA', 'AS', 'SS', 'AC', 'SC'
  allergies: text("allergies"), // Comma-separated or JSON
  symptoms: text("symptoms"), // Current presenting symptoms
  
  // Current Vitals
  bloodPressureSystolic: integer("bp_systolic"), // mmHg
  bloodPressureDiastolic: integer("bp_diastolic"), // mmHg
  temperature: text("temperature"), // Celsius (stored as text to allow decimal)
  heartRate: integer("heart_rate"), // bpm
  weight: text("weight"), // kg (stored as text to allow decimal)
  
  // Biometric Data (stored as base64 or file paths)
  facialRecognitionData: text("facial_recognition_data"),
  fingerprintData: text("fingerprint_data"),
  
  // Metadata
  registeredBy: text("registered_by").notNull(), // User ID who registered the patient
  lastUpdatedBy: text("last_updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Login schemas for different authentication methods
export const loginSchema = z.union([
  z.object({
    authMethod: z.literal("credentials"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
  z.object({
    authMethod: z.literal("nin"),
    nin: z.string().min(1, "NIN is required"),
  }),
  z.object({
    authMethod: z.literal("fingerprint"),
    fingerprintData: z.string().min(1, "Fingerprint data is required"),
  }),
  z.object({
    authMethod: z.literal("facial"),
    facialData: z.string().min(1, "Facial data is required"),
  }),
]);

export type LoginCredentials = z.infer<typeof loginSchema>;

// Health Assessment Schema for ML model outputs
export const healthAssessmentSchema = z.object({
  healthRiskScore: z.number().min(0).max(100),
  riskLevel: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]),
  riskFactors: z.array(z.string()),
  suggestedDiagnosis: z.array(
    z.object({
      condition: z.string(),
      confidence: z.number().min(0).max(1),
      symptoms: z.array(z.string()),
      severity: z.enum(["mild", "moderate", "severe"]),
    })
  ),
  recommendations: z.array(
    z.object({
      category: z.string(),
      recommendation: z.string(),
      priority: z.enum(["low", "medium", "high"]),
      action: z.string(),
    })
  ),
  prescribedDrugs: z.array(
    z.object({
      drugName: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string(),
      indication: z.string(),
      contraindications: z.array(z.string()),
      sideEffects: z.array(z.string()),
    })
  ),
  analysisDetails: z.object({
    bpAnalysis: z.string(),
    heartRateAnalysis: z.string(),
    temperatureAnalysis: z.string(),
    weightAnalysis: z.string(),
    ageRiskAnalysis: z.string(),
    genotypeBenefit: z.string(),
  }),
});

export type HealthAssessment = z.infer<typeof healthAssessmentSchema>;

// Lab Results table for test uploads and automated analysis
export const labResults = pgTable("lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull(), // Foreign key to patients
  testName: text("test_name").notNull(), // e.g., "Blood Test", "Urinalysis", "ECG"
  testCategory: text("test_category").notNull(), // e.g., "Hematology", "Biochemistry", "Imaging"
  fileData: text("file_data"), // Base64 encoded file or JSON data
  fileName: text("file_name").notNull(),
  fileType: text("file_type"), // e.g., "application/pdf", "image/png", "application/json"
  
  // Test Results/Values
  testValues: text("test_values"), // JSON string with key-value pairs of test results
  normalRange: text("normal_range"), // Expected normal range reference
  status: text("status").notNull(), // "normal", "abnormal", "critical"
  
  // Analysis
  automatedAnalysis: text("automated_analysis"), // JSON: AI-powered interpretation
  doctorNotes: text("doctor_notes"), // Clinical notes/interpretation
  recommendations: text("recommendations"), // Follow-up recommendations
  
  // Metadata
  uploadedBy: text("uploaded_by").notNull(), // User ID who uploaded
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  reviewedBy: text("reviewed_by"), // Doctor who reviewed
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLabResultSchema = createInsertSchema(labResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  automatedAnalysis: true,
});

export type InsertLabResult = z.infer<typeof insertLabResultSchema>;
export type LabResult = typeof labResults.$inferSelect;

// Lab Result Analysis Schema for ML outputs
export const labResultAnalysisSchema = z.object({
  testName: z.string(),
  overallStatus: z.enum(["normal", "abnormal", "critical"]),
  severity: z.enum(["low", "moderate", "high", "critical"]),
  flaggedAbnormalities: z.array(
    z.object({
      parameter: z.string(),
      value: z.string(),
      normalRange: z.string(),
      status: z.enum(["normal", "abnormal", "critical"]),
      clinicalSignificance: z.string(),
    })
  ),
  riskAssessment: z.object({
    diseaseProbability: z.record(z.number()), // Disease name -> probability
    acuteTreatmentNeeded: z.boolean(),
    recommendedFollowUp: z.string(),
  }),
  recommendations: z.array(z.string()),
  correlationWithVitals: z.string(),
  historicalComparison: z.string(),
});

export type LabResultAnalysis = z.infer<typeof labResultAnalysisSchema>;
