import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertPatientSchema, insertAppointmentSchema, type User } from "@shared/schema";
import { MLHealthService } from "./ml-service";
import { OpenAIService } from "./openai-service";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication - Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerData = registerSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(registerData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user
      const newUser = await storage.createUser({
        username: registerData.username,
        password: registerData.password,
        fullName: registerData.fullName,
        role: registerData.role,
        isActive: 1,
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json({ user: userWithoutPassword, message: "User registered successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Authentication - Login
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

  // Search patients by name, NIN, fingerprint, or facial recognition
  app.post("/api/patients/search", async (req, res) => {
    try {
      const { query, searchType } = req.body;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      let patient: any = null;

      if (searchType === "nin") {
        patient = await storage.getPatientByNIN(query);
      } else if (searchType === "fingerprint") {
        patient = await storage.getPatientByFingerprint(query);
      } else if (searchType === "facial") {
        patient = await storage.getPatientByFacial(query);
      } else {
        // Default: search by name or NIN
        const results = await storage.searchPatients(query);
        return res.json(results);
      }

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      return res.json([patient]);
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

  // Lab Results endpoints
  app.post("/api/lab-results", async (req, res) => {
    try {
      const labResultData = req.body;
      const labResult = await storage.createLabResult(labResultData);
      
      // Perform automated analysis
      const analysis = MLHealthService.analyzeLaboratoryResult(labResult);
      const updatedLabResult = await storage.updateLabResult(labResult.id, {
        automatedAnalysis: JSON.stringify(analysis),
      });

      return res.status(201).json(updatedLabResult);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/lab-results/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const labResult = await storage.getLabResult(id);
      
      if (!labResult) {
        return res.status(404).json({ message: "Lab result not found" });
      }

      return res.json(labResult);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patients/:patientId/lab-results", async (req, res) => {
    try {
      const { patientId } = req.params;
      const labResults = await storage.getPatientLabResults(patientId);
      return res.json(labResults);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/lab-results/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedLabResult = await storage.updateLabResult(id, updates);
      
      if (!updatedLabResult) {
        return res.status(404).json({ message: "Lab result not found" });
      }

      return res.json(updatedLabResult);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/lab-results/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteLabResult(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Lab result not found" });
      }

      return res.json({ message: "Lab result deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Chatbot - Dr. Tega responses powered by OpenAI
  app.post("/api/chatbot/ask", async (req, res) => {
    try {
      const { question, symptoms, vitals, medicalHistory } = req.body;

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      let response;

      // Route to appropriate AI service based on query type
      if (symptoms) {
        response = await OpenAIService.getDiagnosisAssistance(symptoms, vitals, medicalHistory);
      } else {
        response = await OpenAIService.getMedicalResponse(question);
      }

      return res.json(response);
    } catch (error) {
      console.error("Chatbot error:", error);
      return res.status(500).json({ 
        message: "Error processing request",
        response: "I'm having trouble connecting to my AI systems. Please try again or contact support.",
        confidence: 0
      });
    }
  });

  // Appointments - Patient booking
  app.post("/api/appointments", async (req, res) => {
    try {
      const validated = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validated);
      return res.status(201).json(appointment);
    } catch (error) {
      return res.status(400).json({ message: "Invalid appointment data" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      return res.json(appointments);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/appointments/patient/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const appointments = await storage.getPatientAppointments(patientId);
      return res.json(appointments);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/appointments/doctor/:doctorId", async (req, res) => {
    try {
      const { doctorId } = req.params;
      const appointments = await storage.getDoctorAppointments(doctorId);
      return res.json(appointments);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const appointment = await storage.updateAppointment(id, updates);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.json(appointment);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAppointment(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
