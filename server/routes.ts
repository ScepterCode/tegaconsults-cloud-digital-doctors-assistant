import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertPatientSchema, type User } from "@shared/schema";
import { MLHealthService } from "./ml-service";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      let user: User | undefined;

      // Handle different authentication methods
      if ("authMethod" in loginData) {
        if (loginData.authMethod === "credentials") {
          user = await storage.getUserByUsername(loginData.username);
          if (user && user.password !== loginData.password) {
            return res.status(401).json({ message: "Invalid credentials" });
          }
        } else if (loginData.authMethod === "nin") {
          user = await storage.getUserByNIN(loginData.nin);
        } else if (loginData.authMethod === "fingerprint") {
          user = await storage.getUserByFingerprint(loginData.fingerprintData);
        } else if (loginData.authMethod === "facial") {
          user = await storage.getUserByFacial(loginData.facialData);
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive. Contact administrator." });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all users (admin only - frontend should enforce)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      return res.json(usersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user (admin only - frontend should enforce)
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      return res.json(patients);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get single patient by ID
  app.get("/api/patients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      return res.json(patient);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new patient
  app.post("/api/patients", async (req, res) => {
    try {
      // Validate patient data
      const patientData = insertPatientSchema.parse(req.body);
      
      // Check if MRN already exists
      const existingPatient = await storage.getPatientByMRN(patientData.mrn);
      if (existingPatient) {
        return res.status(400).json({ message: "Patient with this MRN already exists" });
      }

      const patient = await storage.createPatient(patientData);
      return res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update patient (admin and doctor only - frontend should enforce)
  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedPatient = await storage.updatePatient(id, updates);
      
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      return res.json(updatedPatient);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete patient (admin only - frontend should enforce)
  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePatient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Patient not found" });
      }

      return res.json({ message: "Patient deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ML Health Analysis - Predict health risk, suggest diagnosis, prescribe drugs
  app.get("/api/patients/:id/health-analysis", async (req, res) => {
    try {
      const { id } = req.params;
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const healthAssessment = MLHealthService.assessPatientHealth(patient);
      return res.json(healthAssessment);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
