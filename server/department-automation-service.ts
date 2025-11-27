import { storage } from "./production-storage";
import type { Patient, Notification, Department, InsertNotification } from "@shared/schema";

interface DepartmentMapping {
  departmentName: string;
  keywords: string[];
  symptoms: string[];
  conditions: string[];
  vitalThresholds?: {
    bpSystolicHigh?: number;
    bpSystolicLow?: number;
    bpDiastolicHigh?: number;
    bpDiastolicLow?: number;
    heartRateHigh?: number;
    heartRateLow?: number;
    temperatureHigh?: number;
    temperatureLow?: number;
  };
  ageRange?: { min?: number; max?: number };
  priority: "low" | "normal" | "high" | "critical";
}

const DEPARTMENT_MAPPINGS: DepartmentMapping[] = [
  {
    departmentName: "Emergency",
    keywords: ["emergency", "urgent", "critical", "severe", "unconscious", "bleeding", "trauma", "accident"],
    symptoms: ["chest pain", "difficulty breathing", "severe pain", "unconscious", "seizure", "stroke symptoms", "heart attack"],
    conditions: ["cardiac arrest", "stroke", "severe trauma", "respiratory failure", "anaphylaxis"],
    vitalThresholds: {
      bpSystolicHigh: 180,
      bpSystolicLow: 90,
      bpDiastolicHigh: 120,
      heartRateHigh: 150,
      heartRateLow: 40,
      temperatureHigh: 40,
    },
    priority: "critical",
  },
  {
    departmentName: "Cardiology",
    keywords: ["heart", "cardiac", "cardiovascular", "chest", "blood pressure", "hypertension"],
    symptoms: ["chest pain", "palpitations", "shortness of breath", "irregular heartbeat", "swelling in legs", "fatigue"],
    conditions: ["hypertension", "arrhythmia", "heart failure", "coronary artery disease", "angina", "myocardial infarction"],
    vitalThresholds: {
      bpSystolicHigh: 160,
      bpDiastolicHigh: 100,
      heartRateHigh: 120,
      heartRateLow: 50,
    },
    priority: "high",
  },
  {
    departmentName: "Pediatrics",
    keywords: ["child", "infant", "baby", "pediatric", "childhood", "newborn", "toddler"],
    symptoms: ["fever in child", "rash", "cough", "vomiting", "diarrhea", "growth concerns"],
    conditions: ["childhood infections", "asthma", "allergies", "developmental delay", "ADHD"],
    ageRange: { min: 0, max: 18 },
    priority: "normal",
  },
  {
    departmentName: "Orthopedics",
    keywords: ["bone", "joint", "fracture", "sprain", "muscle", "back pain", "spine", "arthritis"],
    symptoms: ["joint pain", "back pain", "swelling", "limited mobility", "bone pain", "stiffness"],
    conditions: ["fracture", "arthritis", "osteoporosis", "herniated disc", "tendinitis", "carpal tunnel"],
    priority: "normal",
  },
  {
    departmentName: "Neurology",
    keywords: ["brain", "nerve", "neurological", "headache", "migraine", "seizure", "numbness"],
    symptoms: ["headache", "dizziness", "numbness", "tingling", "memory loss", "confusion", "tremors"],
    conditions: ["migraine", "epilepsy", "Parkinson's", "multiple sclerosis", "neuropathy", "dementia"],
    priority: "high",
  },
  {
    departmentName: "Pulmonology",
    keywords: ["lung", "respiratory", "breathing", "asthma", "cough", "pneumonia"],
    symptoms: ["cough", "shortness of breath", "wheezing", "chest tightness", "sputum production"],
    conditions: ["asthma", "COPD", "pneumonia", "bronchitis", "pulmonary fibrosis", "sleep apnea"],
    priority: "normal",
  },
  {
    departmentName: "Gastroenterology",
    keywords: ["stomach", "digestive", "intestinal", "liver", "abdomen", "gut"],
    symptoms: ["abdominal pain", "nausea", "vomiting", "diarrhea", "constipation", "bloating", "heartburn"],
    conditions: ["GERD", "ulcer", "IBS", "Crohn's disease", "hepatitis", "cirrhosis", "pancreatitis"],
    priority: "normal",
  },
  {
    departmentName: "Endocrinology",
    keywords: ["diabetes", "thyroid", "hormone", "metabolic", "endocrine"],
    symptoms: ["fatigue", "weight changes", "excessive thirst", "frequent urination", "hair loss"],
    conditions: ["diabetes", "hypothyroidism", "hyperthyroidism", "PCOS", "adrenal disorders"],
    priority: "normal",
  },
  {
    departmentName: "Oncology",
    keywords: ["cancer", "tumor", "oncology", "chemotherapy", "radiation"],
    symptoms: ["unexplained weight loss", "persistent fatigue", "unusual bleeding", "lumps"],
    conditions: ["cancer", "leukemia", "lymphoma", "carcinoma", "sarcoma"],
    priority: "high",
  },
  {
    departmentName: "Dermatology",
    keywords: ["skin", "rash", "dermatology", "acne", "eczema", "psoriasis"],
    symptoms: ["rash", "itching", "skin lesions", "discoloration", "hair loss", "nail changes"],
    conditions: ["eczema", "psoriasis", "acne", "dermatitis", "skin cancer", "fungal infections"],
    priority: "low",
  },
  {
    departmentName: "Ophthalmology",
    keywords: ["eye", "vision", "ophthalmology", "sight", "blindness"],
    symptoms: ["vision changes", "eye pain", "redness", "discharge", "floaters", "double vision"],
    conditions: ["cataracts", "glaucoma", "macular degeneration", "diabetic retinopathy", "conjunctivitis"],
    priority: "normal",
  },
  {
    departmentName: "Psychiatry",
    keywords: ["mental", "psychiatric", "depression", "anxiety", "psychological"],
    symptoms: ["anxiety", "depression", "mood swings", "insomnia", "panic attacks", "hallucinations"],
    conditions: ["depression", "anxiety disorder", "bipolar disorder", "schizophrenia", "PTSD", "OCD"],
    priority: "normal",
  },
  {
    departmentName: "General Medicine",
    keywords: ["general", "primary", "wellness", "checkup", "routine"],
    symptoms: ["fever", "fatigue", "general weakness", "malaise"],
    conditions: ["common cold", "flu", "infections", "general illness"],
    priority: "low",
  },
];

export class DepartmentAutomationService {
  private static instance: DepartmentAutomationService;
  private notificationQueue: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): DepartmentAutomationService {
    if (!DepartmentAutomationService.instance) {
      DepartmentAutomationService.instance = new DepartmentAutomationService();
    }
    return DepartmentAutomationService.instance;
  }

  async analyzePatientForDepartments(patient: Patient): Promise<DepartmentMapping[]> {
    const matchedDepartments: DepartmentMapping[] = [];
    const symptoms = (patient.symptoms || "").toLowerCase();
    const allergies = (patient.allergies || "").toLowerCase();
    const combinedText = `${symptoms} ${allergies}`;

    for (const dept of DEPARTMENT_MAPPINGS) {
      let score = 0;
      let matched = false;

      if (dept.ageRange) {
        if (dept.ageRange.min !== undefined && patient.age >= dept.ageRange.min &&
            (dept.ageRange.max === undefined || patient.age <= dept.ageRange.max)) {
          score += 10;
          matched = true;
        }
      }

      for (const keyword of dept.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          score += 5;
          matched = true;
        }
      }

      for (const symptom of dept.symptoms) {
        if (combinedText.includes(symptom.toLowerCase())) {
          score += 10;
          matched = true;
        }
      }

      for (const condition of dept.conditions) {
        if (combinedText.includes(condition.toLowerCase())) {
          score += 15;
          matched = true;
        }
      }

      if (dept.vitalThresholds) {
        const bp = patient.bloodPressureSystolic;
        const bpDia = patient.bloodPressureDiastolic;
        const hr = patient.heartRate;
        const temp = patient.temperature ? parseFloat(patient.temperature) : null;

        if (bp !== null && bp !== undefined) {
          if (dept.vitalThresholds.bpSystolicHigh && bp >= dept.vitalThresholds.bpSystolicHigh) {
            score += 20;
            matched = true;
          }
          if (dept.vitalThresholds.bpSystolicLow && bp <= dept.vitalThresholds.bpSystolicLow) {
            score += 20;
            matched = true;
          }
        }

        if (bpDia !== null && bpDia !== undefined) {
          if (dept.vitalThresholds.bpDiastolicHigh && bpDia >= dept.vitalThresholds.bpDiastolicHigh) {
            score += 20;
            matched = true;
          }
        }

        if (hr !== null && hr !== undefined) {
          if (dept.vitalThresholds.heartRateHigh && hr >= dept.vitalThresholds.heartRateHigh) {
            score += 15;
            matched = true;
          }
          if (dept.vitalThresholds.heartRateLow && hr <= dept.vitalThresholds.heartRateLow) {
            score += 15;
            matched = true;
          }
        }

        if (temp !== null) {
          if (dept.vitalThresholds.temperatureHigh && temp >= dept.vitalThresholds.temperatureHigh) {
            score += 20;
            matched = true;
          }
        }
      }

      if (matched && score > 5) {
        matchedDepartments.push(dept);
      }
    }

    matchedDepartments.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return matchedDepartments;
  }

  async createDepartmentNotification(
    departmentId: string,
    patient: Patient,
    type: string,
    title: string,
    message: string,
    priority: "low" | "normal" | "high" | "critical",
    requestedBy: string
  ): Promise<Notification | null> {
    try {
      const notification = await storage.createNotification({
        departmentId,
        patientId: patient.id,
        type,
        title,
        message,
        priority,
        requestedBy,
        status: "unread",
      });
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  async autoNotifyDepartments(patient: Patient, requestedBy: string): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const departments = await storage.getAllDepartments();
    const matchedMappings = await this.analyzePatientForDepartments(patient);

    for (const mapping of matchedMappings) {
      const dept = departments.find(
        (d) => d.name.toLowerCase() === mapping.departmentName.toLowerCase()
      );

      if (dept) {
        const title = `New ${mapping.priority === "critical" ? "URGENT " : ""}Patient Referral - ${patient.firstName} ${patient.lastName}`;
        const message = this.generateNotificationMessage(patient, mapping);

        const notification = await this.createDepartmentNotification(
          dept.id,
          patient,
          "consultation_request",
          title,
          message,
          mapping.priority,
          requestedBy
        );

        if (notification) {
          notifications.push(notification);
        }
      }
    }

    return notifications;
  }

  private generateNotificationMessage(patient: Patient, mapping: DepartmentMapping): string {
    const vitals = [];
    if (patient.bloodPressureSystolic && patient.bloodPressureDiastolic) {
      vitals.push(`BP: ${patient.bloodPressureSystolic}/${patient.bloodPressureDiastolic} mmHg`);
    }
    if (patient.heartRate) {
      vitals.push(`HR: ${patient.heartRate} bpm`);
    }
    if (patient.temperature) {
      vitals.push(`Temp: ${patient.temperature}°C`);
    }

    return `Patient ${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn}) requires ${mapping.departmentName} evaluation.

Demographics: ${patient.age} year old ${patient.gender}
Blood Group: ${patient.bloodGroup} | Genotype: ${patient.genotype}
${vitals.length > 0 ? `\nVitals: ${vitals.join(" | ")}` : ""}
${patient.symptoms ? `\nPresenting Symptoms: ${patient.symptoms}` : ""}
${patient.allergies ? `\nKnown Allergies: ${patient.allergies}` : ""}

Priority: ${mapping.priority.toUpperCase()}
Please review and respond accordingly.`;
  }

  async notifyOnVitalChange(
    patient: Patient,
    previousVitals: Partial<Patient>,
    requestedBy: string
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const departments = await storage.getAllDepartments();
    
    const significantChanges: string[] = [];
    
    if (patient.bloodPressureSystolic && previousVitals.bloodPressureSystolic) {
      const bpChange = Math.abs(patient.bloodPressureSystolic - previousVitals.bloodPressureSystolic);
      if (bpChange >= 20) {
        significantChanges.push(`Systolic BP changed by ${bpChange} mmHg`);
      }
    }

    if (patient.heartRate && previousVitals.heartRate) {
      const hrChange = Math.abs(patient.heartRate - previousVitals.heartRate);
      if (hrChange >= 20) {
        significantChanges.push(`Heart rate changed by ${hrChange} bpm`);
      }
    }

    if (patient.temperature && previousVitals.temperature) {
      const tempChange = Math.abs(parseFloat(patient.temperature) - parseFloat(previousVitals.temperature));
      if (tempChange >= 1) {
        significantChanges.push(`Temperature changed by ${tempChange.toFixed(1)}°C`);
      }
    }

    if (significantChanges.length > 0) {
      const matchedMappings = await this.analyzePatientForDepartments(patient);
      
      for (const mapping of matchedMappings) {
        const dept = departments.find(
          (d) => d.name.toLowerCase() === mapping.departmentName.toLowerCase()
        );

        if (dept) {
          const notification = await this.createDepartmentNotification(
            dept.id,
            patient,
            "status_update",
            `Vital Signs Alert - ${patient.firstName} ${patient.lastName}`,
            `Significant vital sign changes detected:\n${significantChanges.join("\n")}\n\nCurrent Status:\n${this.generateNotificationMessage(patient, mapping)}`,
            mapping.priority === "critical" ? "critical" : "high",
            requestedBy
          );

          if (notification) {
            notifications.push(notification);
          }
        }
      }
    }

    return notifications;
  }

  async notifyOnLabResult(
    patientId: string,
    labResultStatus: "normal" | "abnormal" | "critical",
    testName: string,
    requestedBy: string
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const patient = await storage.getPatient(patientId);
    if (!patient) return notifications;

    const departments = await storage.getAllDepartments();

    if (labResultStatus === "critical" || labResultStatus === "abnormal") {
      const priority = labResultStatus === "critical" ? "critical" : "high";
      
      const labDept = departments.find(d => d.name.toLowerCase().includes("lab"));
      const generalDept = departments.find(d => 
        d.name.toLowerCase().includes("general") || 
        d.name.toLowerCase().includes("medicine")
      );

      const targetDepts = [labDept, generalDept].filter(Boolean) as typeof departments;
      
      if (targetDepts.length === 0 && departments.length > 0) {
        targetDepts.push(departments[0]);
      }

      for (const dept of targetDepts) {
        const notification = await this.createDepartmentNotification(
          dept.id,
          patient,
          "lab_result",
          `${labResultStatus.toUpperCase()} Lab Result - ${testName}`,
          `Lab result for patient ${patient.firstName} ${patient.lastName} (MRN: ${patient.mrn}) shows ${labResultStatus} findings.\n\nTest: ${testName}\nStatus: ${labResultStatus.toUpperCase()}\n\nImmediate review recommended.`,
          priority,
          requestedBy
        );

        if (notification) {
          notifications.push(notification);
        }
      }
    }

    return notifications;
  }

  async getDepartmentPatientRecords(departmentId: string): Promise<Patient[]> {
    const department = await storage.getDepartment(departmentId);
    if (!department) return [];

    const allPatients = await storage.getAllPatients();
    const matchedPatients: Patient[] = [];

    for (const patient of allPatients) {
      const mappings = await this.analyzePatientForDepartments(patient);
      const isMatch = mappings.some(
        m => m.departmentName.toLowerCase() === department.name.toLowerCase()
      );
      if (isMatch) {
        matchedPatients.push(patient);
      }
    }

    return matchedPatients;
  }

  async getUnreadNotificationsForDepartment(departmentId: string): Promise<Notification[]> {
    return storage.getDepartmentNotifications(departmentId);
  }
}

export const departmentAutomation = DepartmentAutomationService.getInstance();
