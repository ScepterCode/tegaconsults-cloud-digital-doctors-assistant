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

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
