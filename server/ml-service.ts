import type { Patient } from "@shared/schema";

export interface HealthAssessment {
  healthRiskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  riskFactors: string[];
  suggestedDiagnosis: DiagnosisSuggestion[];
  recommendations: HealthRecommendation[];
  prescribedDrugs: DrugPrescription[];
  analysisDetails: AnalysisDetails;
}

export interface DiagnosisSuggestion {
  condition: string;
  confidence: number;
  symptoms: string[];
  severity: "mild" | "moderate" | "severe";
}

export interface DrugPrescription {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  indication: string;
  contraindications: string[];
  sideEffects: string[];
}

export interface HealthRecommendation {
  category: string;
  recommendation: string;
  priority: "low" | "medium" | "high";
  action: string;
}

export interface AnalysisDetails {
  bpAnalysis: string;
  heartRateAnalysis: string;
  temperatureAnalysis: string;
  weightAnalysis: string;
  ageRiskAnalysis: string;
  genotypeBenefit: string;
}

export class MLHealthService {
  /**
   * Calculate comprehensive health risk score (0-100)
   */
  static calculateHealthRiskScore(patient: Patient): number {
    let riskScore = 0;

    // Blood Pressure Analysis (0-30 points)
    if (patient.bloodPressureSystolic && patient.bloodPressureDiastolic) {
      const sys = patient.bloodPressureSystolic;
      const dia = patient.bloodPressureDiastolic;

      if (sys >= 180 || dia >= 120) {
        riskScore += 30; // Stage 3 Hypertension
      } else if (sys >= 160 || dia >= 100) {
        riskScore += 25; // Stage 2 Hypertension
      } else if (sys >= 140 || dia >= 90) {
        riskScore += 20; // Stage 1 Hypertension
      } else if (sys >= 130 && dia < 80) {
        riskScore += 10; // Elevated
      }
    }

    // Heart Rate Analysis (0-25 points)
    if (patient.heartRate) {
      if (patient.heartRate > 100 || patient.heartRate < 60) {
        riskScore += 15; // Tachycardia/Bradycardia
      } else if (patient.heartRate > 90 || patient.heartRate < 65) {
        riskScore += 8;
      }
    }

    // Temperature Analysis (0-20 points)
    if (patient.temperature) {
      const temp = parseFloat(patient.temperature);
      if (temp >= 39 || temp <= 35) {
        riskScore += 20; // Severe fever/hypothermia
      } else if (temp >= 38.5 || temp < 36) {
        riskScore += 12;
      }
    }

    // Weight-based BMI Analysis (0-15 points)
    if (patient.weight && patient.age) {
      const weight = parseFloat(patient.weight);
      const heightEstimate = 1.7; // Standard estimate
      const bmi = weight / (heightEstimate * heightEstimate);

      if (bmi > 35 || bmi < 16) {
        riskScore += 15; // Severe obesity/underweight
      } else if (bmi > 30 || bmi < 18.5) {
        riskScore += 10;
      } else if (bmi > 25) {
        riskScore += 5;
      }
    }

    // Age Risk Factor (0-10 points)
    if (patient.age >= 70) {
      riskScore += 10;
    } else if (patient.age >= 60) {
      riskScore += 7;
    } else if (patient.age >= 50) {
      riskScore += 4;
    }

    // Genotype Risk (0-5 points)
    if (patient.genotype === "SS") {
      riskScore += 5; // Sickle cell disease
    } else if (patient.genotype === "AS" || patient.genotype === "SC") {
      riskScore += 2; // Carrier traits
    }

    // Allergies indication (up to 2 points)
    if (patient.allergies && patient.allergies.length > 0) {
      riskScore += 2;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Determine risk level based on score
   */
  static getRiskLevel(score: number): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" {
    if (score >= 75) return "CRITICAL";
    if (score >= 50) return "HIGH";
    if (score >= 30) return "MODERATE";
    return "LOW";
  }

  /**
   * Identify risk factors
   */
  static identifyRiskFactors(patient: Patient): string[] {
    const factors: string[] = [];

    // Blood Pressure
    if (patient.bloodPressureSystolic && patient.bloodPressureSystolic >= 140) {
      factors.push("Hypertension");
    }

    // Heart Rate
    if (patient.heartRate && (patient.heartRate > 100 || patient.heartRate < 60)) {
      factors.push("Abnormal Heart Rate");
    }

    // Fever
    if (patient.temperature && parseFloat(patient.temperature) >= 38) {
      factors.push("Elevated Temperature");
    }

    // Genotype
    if (patient.genotype === "SS") {
      factors.push("Sickle Cell Disease");
    }

    // Age
    if (patient.age >= 60) {
      factors.push("Advanced Age");
    }

    // Weight issues
    if (patient.weight) {
      const weight = parseFloat(patient.weight);
      const bmi = weight / (1.7 * 1.7);
      if (bmi > 30) factors.push("Obesity");
      if (bmi < 18.5) factors.push("Underweight");
    }

    // Allergies
    if (patient.allergies) {
      factors.push("Known Allergies");
    }

    return factors;
  }

  /**
   * Generate diagnosis suggestions based on vitals and patient profile
   */
  static suggestDiagnosis(patient: Patient): DiagnosisSuggestion[] {
    const suggestions: DiagnosisSuggestion[] = [];

    // Hypertension Pattern
    if (patient.bloodPressureSystolic && patient.bloodPressureSystolic >= 140) {
      suggestions.push({
        condition: "Hypertension",
        confidence: 0.95,
        symptoms: ["High blood pressure", "Headaches", "Chest discomfort"],
        severity: patient.bloodPressureSystolic >= 160 ? "severe" : "moderate",
      });
    }

    // Tachycardia/Arrhythmia
    if (patient.heartRate && patient.heartRate > 100) {
      suggestions.push({
        condition: "Tachycardia/Arrhythmia",
        confidence: 0.85,
        symptoms: ["Rapid heartbeat", "Palpitations", "Shortness of breath"],
        severity: patient.heartRate > 120 ? "severe" : "moderate",
      });
    }

    // Fever/Infection
    if (patient.temperature && parseFloat(patient.temperature) >= 38) {
      suggestions.push({
        condition: "Fever/Acute Infection",
        confidence: 0.9,
        symptoms: ["Elevated body temperature", "Chills", "Malaise"],
        severity: parseFloat(patient.temperature) >= 39 ? "severe" : "moderate",
      });
    }

    // Obesity-related conditions
    if (patient.weight) {
      const weight = parseFloat(patient.weight);
      const bmi = weight / (1.7 * 1.7);
      if (bmi > 30) {
        suggestions.push({
          condition: "Obesity & Metabolic Syndrome",
          confidence: 0.88,
          symptoms: ["Excess weight", "Metabolic complications", "Joint stress"],
          severity: bmi > 35 ? "severe" : "moderate",
        });
      }
    }

    // Sickle Cell
    if (patient.genotype === "SS") {
      suggestions.push({
        condition: "Sickle Cell Disease",
        confidence: 1.0,
        symptoms: ["Vaso-occlusive crises", "Pain episodes", "Hemolysis"],
        severity: "severe",
      });
    }

    // Hypothermia
    if (patient.temperature && parseFloat(patient.temperature) < 36) {
      suggestions.push({
        condition: "Hypothermia",
        confidence: 0.92,
        symptoms: ["Low body temperature", "Shivering", "Confusion"],
        severity: "severe",
      });
    }

    return suggestions;
  }

  /**
   * Prescribe appropriate medications based on diagnosis
   */
  static prescribeDrugs(patient: Patient, diagnoses: DiagnosisSuggestion[]): DrugPrescription[] {
    const prescriptions: DrugPrescription[] = [];

    for (const diagnosis of diagnoses) {
      switch (diagnosis.condition) {
        case "Hypertension":
          prescriptions.push({
            drugName: "Amlodipine (Calcium Channel Blocker)",
            dosage: "5-10 mg",
            frequency: "Once daily",
            duration: "Ongoing",
            indication: "Control high blood pressure",
            contraindications: ["Hypersensitivity to amlodipine"],
            sideEffects: ["Headache", "Flushed face", "Edema"],
          });
          prescriptions.push({
            drugName: "Lisinopril (ACE Inhibitor)",
            dosage: "10-20 mg",
            frequency: "Once daily",
            duration: "Ongoing",
            indication: "Blood pressure management",
            contraindications: ["Pregnancy", "History of angioedema"],
            sideEffects: ["Dry cough", "Dizziness", "Fatigue"],
          });
          break;

        case "Tachycardia/Arrhythmia":
          prescriptions.push({
            drugName: "Metoprolol (Beta-Blocker)",
            dosage: "25-50 mg",
            frequency: "Twice daily",
            duration: "14 days, review",
            indication: "Control heart rate",
            contraindications: ["Asthma", "Bradycardia", "Heart block"],
            sideEffects: ["Fatigue", "Cold extremities", "Dizziness"],
          });
          break;

        case "Fever/Acute Infection":
          prescriptions.push({
            drugName: "Paracetamol (Acetaminophen)",
            dosage: "500-1000 mg",
            frequency: "Every 4-6 hours",
            duration: "7 days",
            indication: "Reduce fever and pain",
            contraindications: ["Hepatic disease"],
            sideEffects: ["Rare", "Liver toxicity in overdose"],
          });
          prescriptions.push({
            drugName: "Amoxicillin (Antibiotic)",
            dosage: "500 mg",
            frequency: "Three times daily",
            duration: "7 days",
            indication: "Bacterial infection treatment",
            contraindications: ["Penicillin allergy"],
            sideEffects: ["Rash", "GI upset", "Allergic reactions"],
          });
          break;

        case "Obesity & Metabolic Syndrome":
          prescriptions.push({
            drugName: "Metformin",
            dosage: "500-1000 mg",
            frequency: "Twice daily",
            duration: "Ongoing",
            indication: "Metabolic syndrome management",
            contraindications: ["Renal impairment", "Liver disease"],
            sideEffects: ["GI upset", "Metallic taste", "B12 deficiency"],
          });
          break;

        case "Sickle Cell Disease":
          prescriptions.push({
            drugName: "Hydroxyurea",
            dosage: "15-20 mg/kg",
            frequency: "Once daily",
            duration: "Ongoing specialist supervision",
            indication: "Sickle cell disease management",
            contraindications: ["Severe bone marrow suppression"],
            sideEffects: ["Bone marrow suppression", "GI upset"],
          });
          prescriptions.push({
            drugName: "Folic Acid",
            dosage: "1 mg",
            frequency: "Once daily",
            duration: "Ongoing",
            indication: "Support blood production",
            contraindications: ["Pernicious anemia without B12"],
            sideEffects: ["Minimal"],
          });
          break;

        case "Hypothermia":
          prescriptions.push({
            drugName: "Supportive Care + Warming",
            dosage: "N/A",
            frequency: "Continuous",
            duration: "Until normothermia achieved",
            indication: "Severe hypothermia management",
            contraindications: [],
            sideEffects: ["Afterdrop"],
          });
          break;
      }
    }

    return prescriptions;
  }

  /**
   * Generate detailed analysis recommendations
   */
  static generateRecommendations(patient: Patient): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Blood Pressure Recommendations
    if (patient.bloodPressureSystolic && patient.bloodPressureSystolic >= 140) {
      recommendations.push({
        category: "Cardiovascular",
        recommendation: "Initiate antihypertensive therapy and monitor daily",
        priority: "high",
        action: "Schedule follow-up BP monitoring in 2 weeks",
      });
    }

    // Lifestyle Recommendations
    if (patient.weight) {
      const weight = parseFloat(patient.weight);
      const bmi = weight / (1.7 * 1.7);
      if (bmi > 25) {
        recommendations.push({
          category: "Lifestyle",
          recommendation: "Implement weight loss program and dietary changes",
          priority: bmi > 30 ? "high" : "medium",
          action: "Refer to nutritionist and fitness program",
        });
      }
    }

    // Infection Control
    if (patient.temperature && parseFloat(patient.temperature) >= 38) {
      recommendations.push({
        category: "Infection Control",
        recommendation: "Monitor for infection progression and complications",
        priority: "high",
        action: "Schedule follow-up in 3-5 days",
      });
    }

    // Specialist Referral
    if (patient.genotype === "SS") {
      recommendations.push({
        category: "Specialist Care",
        recommendation: "Refer to hematology specialist for sickle cell management",
        priority: "high",
        action: "Book hematology appointment",
      });
    }

    // Age-related Screening
    if (patient.age >= 50) {
      recommendations.push({
        category: "Preventive Care",
        recommendation: "Schedule routine cancer and cardiovascular screening",
        priority: "medium",
        action: "Book screening appointments",
      });
    }

    // Regular Monitoring
    recommendations.push({
      category: "General",
      recommendation: "Regular health monitoring and vital signs tracking",
      priority: "medium",
      action: "Return for follow-up visit in 1 month",
    });

    return recommendations;
  }

  /**
   * Generate detailed analysis of vital signs
   */
  static generateAnalysisDetails(patient: Patient): AnalysisDetails {
    let bpAnalysis = "Blood pressure within normal range";
    if (patient.bloodPressureSystolic && patient.bloodPressureDiastolic) {
      if (patient.bloodPressureSystolic >= 180) {
        bpAnalysis = "CRITICAL: Hypertensive crisis - immediate intervention needed";
      } else if (patient.bloodPressureSystolic >= 160) {
        bpAnalysis = "Severe hypertension - start pharmacological treatment";
      } else if (patient.bloodPressureSystolic >= 140) {
        bpAnalysis = "Stage 2 hypertension - requires treatment";
      } else if (patient.bloodPressureSystolic >= 130) {
        bpAnalysis = "Elevated blood pressure - lifestyle modifications advised";
      }
    }

    let heartRateAnalysis = "Heart rate within normal range (60-100 bpm)";
    if (patient.heartRate) {
      if (patient.heartRate > 120) {
        heartRateAnalysis = "Severe tachycardia - investigate underlying cause";
      } else if (patient.heartRate > 100) {
        heartRateAnalysis = "Mild to moderate tachycardia - monitor and evaluate";
      } else if (patient.heartRate < 60) {
        heartRateAnalysis = "Bradycardia - may require monitoring";
      }
    }

    let temperatureAnalysis = "Normal body temperature";
    if (patient.temperature) {
      const temp = parseFloat(patient.temperature);
      if (temp >= 39) {
        temperatureAnalysis = "High fever - suggests severe infection";
      } else if (temp >= 38) {
        temperatureAnalysis = "Moderate fever - consistent with infection";
      } else if (temp < 36) {
        temperatureAnalysis = "Hypothermia - requires intervention";
      }
    }

    let weightAnalysis = "Weight assessment pending";
    if (patient.weight) {
      const weight = parseFloat(patient.weight);
      const bmi = weight / (1.7 * 1.7);
      if (bmi > 35) {
        weightAnalysis = "Severe obesity - high-risk for comorbidities";
      } else if (bmi > 30) {
        weightAnalysis = "Obesity - weight reduction recommended";
      } else if (bmi > 25) {
        weightAnalysis = "Overweight - lifestyle changes advised";
      } else if (bmi < 18.5) {
        weightAnalysis = "Underweight - nutritional assessment needed";
      } else {
        weightAnalysis = "Weight within healthy range";
      }
    }

    const ageRiskAnalysis =
      patient.age >= 70
        ? "Elderly patient - increased risk for age-related conditions"
        : patient.age >= 60
          ? "Senior patient - increased monitoring recommended"
          : patient.age >= 50
            ? "Middle-aged patient - preventive care important"
            : "Younger patient - focus on health maintenance";

    const genotypeBenefit =
      patient.genotype === "AA"
        ? "Normal genotype - no hemoglobinopathy concerns"
        : patient.genotype === "AS"
          ? "Sickle cell trait carrier - generally benign but monitor"
          : patient.genotype === "SS"
            ? "Sickle cell disease - requires ongoing specialist care"
            : patient.genotype === "SC"
              ? "Sickle cell-C disease - requires monitoring"
              : "Genotype assessment pending";

    return {
      bpAnalysis,
      heartRateAnalysis,
      temperatureAnalysis,
      weightAnalysis,
      ageRiskAnalysis,
      genotypeBenefit,
    };
  }

  /**
   * Generate comprehensive health assessment
   */
  static assessPatientHealth(patient: Patient): HealthAssessment {
    const healthRiskScore = this.calculateHealthRiskScore(patient);
    const riskLevel = this.getRiskLevel(healthRiskScore);
    const riskFactors = this.identifyRiskFactors(patient);
    const suggestedDiagnosis = this.suggestDiagnosis(patient);
    const recommendations = this.generateRecommendations(patient);
    const prescribedDrugs = this.prescribeDrugs(patient, suggestedDiagnosis);
    const analysisDetails = this.generateAnalysisDetails(patient);

    return {
      healthRiskScore,
      riskLevel,
      riskFactors,
      suggestedDiagnosis,
      recommendations,
      prescribedDrugs,
      analysisDetails,
    };
  }
}
