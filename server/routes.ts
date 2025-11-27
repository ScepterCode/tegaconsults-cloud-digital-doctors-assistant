import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./production-storage";
import { loginSchema, registerSchema, insertPatientSchema, insertAppointmentSchema, insertNotificationSchema, type User } from "@shared/schema";
import { MLHealthService } from "./ml-service";
import { OpenAIService } from "./openai-service";
import { NLPService } from "./nlp-service";
import { AdvancedLLMService } from "./advanced-llm-service";
import { mlTrainingService } from "./ml-training-service";
import { departmentAutomation } from "./department-automation-service";
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

      // Create new user with optional department assignment
      const newUser = await storage.createUser({
        username: registerData.username,
        password: registerData.password,
        fullName: registerData.fullName,
        role: registerData.role,
        departmentId: registerData.departmentId || null,
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

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const user = await storage.getUserByUsername(username);
      
      // Always return success to prevent username enumeration
      if (!user) {
        return res.json({ 
          message: "If this username exists, a password reset link will be sent to the registered email" 
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      // In a real app, send email with reset link
      // For demo, return the token (in production, this would be in an email)
      const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5000"}/reset-password?token=${resetToken}`;
      
      console.log(`Password reset link for ${username}: ${resetLink}`);
      
      return res.json({ 
        message: "A password reset link has been sent to your email",
        // In production, remove this next line
        resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const user = await storage.getUser(resetToken.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user password
      await storage.updateUser(resetToken.userId, { password: newPassword });
      
      // Delete used token
      await storage.deletePasswordResetToken(token);

      return res.json({ message: "Password has been reset successfully" });
    } catch (error) {
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

  // Subscription routes (Hospital Admin only)
  app.get("/api/subscription/:adminUserId", async (req, res) => {
    try {
      const { adminUserId } = req.params;
      let subscription = await storage.getSubscriptionByAdminId(adminUserId);
      
      if (!subscription) {
        // Create subscription on first access (new admin gets trial)
        subscription = await storage.createSubscription({
          adminUserId,
          tier: "free",
          status: "trial",
        });
      }

      return res.json(subscription);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/subscription/:adminUserId/upgrade", async (req, res) => {
    try {
      const { adminUserId } = req.params;
      const { billingCycle, paymentMethod, cardDetails } = req.body; // "monthly" or "yearly"

      if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
        return res.status(400).json({ message: "Invalid billing cycle" });
      }

      if (!paymentMethod || !["bank", "paystack", "card"].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      const subscription = await storage.updateSubscription(adminUserId, {
        tier: "hospital",
        status: "active",
        billingCycle,
        paymentMethod,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + (billingCycle === "yearly" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)),
      });

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      return res.json({ message: "Upgraded to hospital plan", subscription });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/subscription/:adminUserId/cancel", async (req, res) => {
    try {
      const { adminUserId } = req.params;

      const subscription = await storage.updateSubscription(adminUserId, {
        status: "cancelled",
      });

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      return res.json({ message: "Subscription cancelled", subscription });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all departments (for registration and navigation)
  app.get("/api/departments", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const departments = await Promise.all(
        [...new Set(users
          .filter(u => u.departmentId)
          .map(u => u.departmentId))] as string[]
      ).then(async (deptIds) => {
        return Promise.all(deptIds.map(id => storage.getDepartment(id)));
      });
      return res.json(departments.filter(Boolean));
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Department Routes
  app.get("/api/admin/departments/:adminId", async (req, res) => {
    try {
      const { adminId } = req.params;
      const departments = await storage.getDepartmentsByHospital(adminId);
      return res.json(departments);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/departments/staff", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const staffCounts: Record<string, number> = {};
      
      users.forEach((u) => {
        if (u.departmentId && (u.role === "doctor" || u.role === "nurse")) {
          staffCounts[u.departmentId] = (staffCounts[u.departmentId] || 0) + 1;
        }
      });

      return res.json(staffCounts);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Department Notifications Routes
  app.get("/api/departments/:departmentId/notifications", async (req, res) => {
    try {
      const { departmentId } = req.params;
      const notifications = await storage.getDepartmentNotifications(departmentId);
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/departments/:departmentId/notifications", async (req, res) => {
    try {
      const { departmentId } = req.params;
      const notificationData = insertNotificationSchema.parse({
        ...req.body,
        departmentId,
      });

      const notification = await storage.createNotification(notificationData);
      return res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;
      const notification = await storage.updateNotification(notificationId, req.body);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      return res.json(notification);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Advanced ML/NLP Feature Routes
  // ============================================

  // NLP Analysis - Extract medical entities from text
  app.post("/api/nlp/analyze", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const analysis = NLPService.analyzeText(text);
      return res.json(analysis);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // NLP - Symptom normalization
  app.post("/api/nlp/normalize-symptoms", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const normalized = NLPService.normalizeSymptoms(text);
      return res.json({ symptoms: normalized });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // NLP - Medical entity extraction
  app.post("/api/nlp/extract-entities", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const entities = NLPService.extractEntities(text);
      return res.json({ entities });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // NLP - Detect urgency from text
  app.post("/api/nlp/detect-urgency", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const urgency = NLPService.detectUrgency(text);
      return res.json({ urgency });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Advanced LLM - Get drug alternatives
  app.post("/api/llm/drug-alternatives", async (req, res) => {
    try {
      const { primaryDrug, indication, allergies } = req.body;
      if (!primaryDrug || !indication) {
        return res.status(400).json({ message: "Primary drug and indication are required" });
      }

      const alternatives = await AdvancedLLMService.getDrugAlternatives(
        primaryDrug,
        indication,
        allergies
      );
      return res.json({ alternatives });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Advanced LLM - Generate treatment plan
  app.post("/api/llm/treatment-plan", async (req, res) => {
    try {
      const { diagnosis, symptoms, patientId } = req.body;
      if (!diagnosis || !symptoms || !patientId) {
        return res.status(400).json({ message: "Diagnosis, symptoms, and patientId are required" });
      }

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const plan = await AdvancedLLMService.generateTreatmentPlan(diagnosis, symptoms, patient);
      return res.json(plan);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Advanced LLM - Check drug interactions
  app.post("/api/llm/check-interactions", async (req, res) => {
    try {
      const { drugs } = req.body;
      if (!drugs || !Array.isArray(drugs)) {
        return res.status(400).json({ message: "Drugs array is required" });
      }

      const interactions = NLPService.checkDrugInteractions(drugs);
      return res.json({ interactions });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Advanced LLM - Check allergy conflicts
  app.post("/api/llm/check-allergies", async (req, res) => {
    try {
      const { allergies, prescribedDrugs } = req.body;
      if (!prescribedDrugs || !Array.isArray(prescribedDrugs)) {
        return res.status(400).json({ message: "Prescribed drugs array is required" });
      }

      const conflicts = NLPService.checkAllergyConflicts(allergies, prescribedDrugs);
      return res.json({ conflicts });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Advanced LLM - Predict patient outcomes
  app.post("/api/llm/predict-outcome", async (req, res) => {
    try {
      const { diagnosis, adherence, riskFactors, patientAge } = req.body;
      if (diagnosis === undefined || adherence === undefined || !patientAge) {
        return res.status(400).json({ message: "Diagnosis, adherence, and patientAge are required" });
      }

      const insight = await AdvancedLLMService.predictOutcome(
        diagnosis,
        adherence,
        riskFactors || [],
        patientAge
      );
      return res.json(insight);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Advanced LLM - Get evidence-based guidelines
  app.get("/api/llm/guidelines/:condition", async (req, res) => {
    try {
      const { condition } = req.params;
      if (!condition) {
        return res.status(400).json({ message: "Condition is required" });
      }

      const guidelines = AdvancedLLMService.getEvidenceBasedGuidelines(condition);
      return res.json({ guidelines });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Custom ML Training Routes
  // ============================================

  // Train a custom ML model
  app.post("/api/ml/train", async (req, res) => {
    try {
      const { modelType } = req.body;
      if (!modelType || !["risk_prediction", "diagnosis_classification", "patient_clustering"].includes(modelType)) {
        return res.status(400).json({ message: "Valid modelType required: risk_prediction, diagnosis_classification, patient_clustering" });
      }

      const session = await mlTrainingService.trainModel(modelType);
      return res.json({ session, message: "Model training completed successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Training failed" });
    }
  });

  // Get training session details
  app.get("/api/ml/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = mlTrainingService.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Training session not found" });
      }

      return res.json(session);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // List all training sessions
  app.get("/api/ml/sessions", async (req, res) => {
    try {
      const sessions = mlTrainingService.getAllSessions();
      return res.json({ sessions, total: sessions.length });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Make prediction using trained model
  app.post("/api/ml/predict", async (req, res) => {
    try {
      const { sessionId, patientId } = req.body;

      if (!sessionId || !patientId) {
        return res.status(400).json({ message: "sessionId and patientId required" });
      }

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const prediction = mlTrainingService.predict(sessionId, patient);
      return res.json(prediction);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Prediction failed" });
    }
  });

  // Cross-validation evaluation
  app.post("/api/ml/evaluate-cv", async (req, res) => {
    try {
      const { modelType, folds } = req.body;

      if (!modelType) {
        return res.status(400).json({ message: "modelType required" });
      }

      const cvResults = await mlTrainingService.evaluateWithCrossValidation(modelType, folds || 5);
      return res.json(cvResults);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Evaluation failed" });
    }
  });

  // Get feature importance
  app.get("/api/ml/feature-importance/:modelType", async (req, res) => {
    try {
      const { modelType } = req.params;

      if (!["risk_prediction", "diagnosis_classification", "patient_clustering"].includes(modelType)) {
        return res.status(400).json({ message: "Invalid modelType" });
      }

      const importance = await mlTrainingService.getFeatureImportance(modelType as any);
      return res.json(importance);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Feature importance calculation failed" });
    }
  });

  // =============================================
  // Department Automation Routes
  // =============================================

  // Auto-notify departments based on patient condition
  app.post("/api/automation/notify-departments", async (req, res) => {
    try {
      const { patientId, requestedBy } = req.body;

      if (!patientId || !requestedBy) {
        return res.status(400).json({ message: "patientId and requestedBy are required" });
      }

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const notifications = await departmentAutomation.autoNotifyDepartments(patient, requestedBy);
      return res.json({
        message: `Notified ${notifications.length} department(s)`,
        notifications,
        departments: notifications.map(n => n.departmentId),
      });
    } catch (error) {
      console.error("Automation error:", error);
      return res.status(500).json({ message: "Failed to notify departments" });
    }
  });

  // Analyze which departments a patient needs
  app.get("/api/automation/analyze-patient/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const matchedDepartments = await departmentAutomation.analyzePatientForDepartments(patient);
      return res.json({
        patient: {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          mrn: patient.mrn,
        },
        recommendedDepartments: matchedDepartments.map(d => ({
          department: d.departmentName,
          priority: d.priority,
          matchedSymptoms: d.symptoms.filter(s => 
            (patient.symptoms || "").toLowerCase().includes(s.toLowerCase())
          ),
        })),
      });
    } catch (error) {
      return res.status(500).json({ message: "Analysis failed" });
    }
  });

  // Get patients relevant to a department
  app.get("/api/automation/department-patients/:departmentId", async (req, res) => {
    try {
      const { departmentId } = req.params;
      const patients = await departmentAutomation.getDepartmentPatientRecords(departmentId);
      return res.json({ 
        departmentId,
        patientCount: patients.length,
        patients: patients.map(p => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          mrn: p.mrn,
          age: p.age,
          gender: p.gender,
          symptoms: p.symptoms,
          vitals: {
            bp: p.bloodPressureSystolic && p.bloodPressureDiastolic 
              ? `${p.bloodPressureSystolic}/${p.bloodPressureDiastolic}` 
              : null,
            hr: p.heartRate,
            temp: p.temperature,
          },
        })),
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to get department patients" });
    }
  });

  // Notify on vital sign changes
  app.post("/api/automation/vital-change-alert", async (req, res) => {
    try {
      const { patientId, previousVitals, requestedBy } = req.body;

      if (!patientId || !requestedBy) {
        return res.status(400).json({ message: "patientId and requestedBy are required" });
      }

      const patient = await storage.getPatient(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const notifications = await departmentAutomation.notifyOnVitalChange(
        patient,
        previousVitals || {},
        requestedBy
      );

      return res.json({
        message: notifications.length > 0 
          ? `Alert sent to ${notifications.length} department(s)` 
          : "No significant vital changes detected",
        notifications,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to process vital change alert" });
    }
  });

  // Notify on lab result
  app.post("/api/automation/lab-result-alert", async (req, res) => {
    try {
      const { patientId, labResultStatus, testName, requestedBy } = req.body;

      if (!patientId || !labResultStatus || !testName || !requestedBy) {
        return res.status(400).json({ 
          message: "patientId, labResultStatus, testName, and requestedBy are required" 
        });
      }

      const notifications = await departmentAutomation.notifyOnLabResult(
        patientId,
        labResultStatus,
        testName,
        requestedBy
      );

      return res.json({
        message: notifications.length > 0 
          ? `Notified ${notifications.length} department(s) about ${labResultStatus} lab result` 
          : "No notifications sent",
        notifications,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to process lab result alert" });
    }
  });

  // Get department notifications with filters
  app.get("/api/automation/department-notifications/:departmentId", async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { status, priority } = req.query;

      let notifications = await storage.getDepartmentNotifications(departmentId);

      if (status) {
        notifications = notifications.filter(n => n.status === status);
      }
      if (priority) {
        notifications = notifications.filter(n => n.priority === priority);
      }

      return res.json({
        departmentId,
        total: notifications.length,
        unread: notifications.filter(n => n.status === "unread").length,
        notifications,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  // Batch process all patients and notify relevant departments
  app.post("/api/automation/batch-notify", async (req, res) => {
    try {
      const { requestedBy } = req.body;

      if (!requestedBy) {
        return res.status(400).json({ message: "requestedBy is required" });
      }

      const patients = await storage.getAllPatients();
      const allNotifications = [];

      for (const patient of patients) {
        const notifications = await departmentAutomation.autoNotifyDepartments(patient, requestedBy);
        allNotifications.push(...notifications);
      }

      return res.json({
        message: `Processed ${patients.length} patients, sent ${allNotifications.length} notifications`,
        patientsProcessed: patients.length,
        notificationsSent: allNotifications.length,
      });
    } catch (error) {
      return res.status(500).json({ message: "Batch notification failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
