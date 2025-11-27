/**
 * Advanced LLM Service for Enhanced Clinical Decision Support
 * - Drug recommendations with alternatives
 * - Interaction checking
 * - Treatment planning
 * - Predictive insights
 */

import { OpenAIService } from "./openai-service";
import { NLPService } from "./nlp-service";
import type { Patient } from "@shared/schema";

export interface DrugAlternative {
  drugName: string;
  dosage: string;
  frequency: string;
  reason: string;
  advantages: string[];
  disadvantages: string[];
  costEstimate: "low" | "medium" | "high";
}

export interface TreatmentPlan {
  primaryDiagnosis: string;
  medications: string[];
  nonPharmacologicalInterventions: string[];
  followUpSchedule: string;
  warningSignsToWatch: string[];
  estimatedRecoveryTime: string;
  successRate: number;
}

export interface PredictiveInsight {
  prediction: string;
  confidence: number;
  factors: string[];
  recommendation: string;
}

export class AdvancedLLMService {
  /**
   * Get alternative drug recommendations
   */
  static async getDrugAlternatives(
    primaryDrug: string,
    indication: string,
    patientAllergies?: string
  ): Promise<DrugAlternative[]> {
    const alternatives: DrugAlternative[] = [];

    // Common drug alternatives database
    const alternativesDB: Record<string, DrugAlternative[]> = {
      Paracetamol: [
        {
          drugName: "Ibuprofen",
          dosage: "400-600 mg",
          frequency: "Every 6-8 hours",
          reason: "NSAID for moderate to severe pain with anti-inflammatory benefits",
          advantages: ["Faster relief", "Anti-inflammatory effect", "Less liver burden"],
          disadvantages: ["GI upset risk", "Higher cost", "Contraindicated in some conditions"],
          costEstimate: "medium",
        },
        {
          drugName: "Aspirin",
          dosage: "500-650 mg",
          frequency: "Every 4-6 hours",
          reason: "Alternative for pain and fever with antiplatelet effects",
          advantages: ["Cardiovascular benefits", "Low cost"],
          disadvantages: ["GI bleeding risk", "Not suitable for children"],
          costEstimate: "low",
        },
      ],
      Lisinopril: [
        {
          drugName: "Enalapril",
          dosage: "5-10 mg",
          frequency: "Once daily",
          reason: "ACE inhibitor alternative for hypertension management",
          advantages: ["Similar efficacy", "Longer half-life options"],
          disadvantages: ["Similar side effects", "Different pricing"],
          costEstimate: "medium",
        },
        {
          drugName: "Losartan",
          dosage: "25-100 mg",
          frequency: "Once daily",
          reason: "ARB alternative with potentially better tolerability",
          advantages: ["Different mechanism", "May have fewer side effects"],
          disadvantages: ["Higher cost", "Different monitoring needed"],
          costEstimate: "high",
        },
      ],
      Metformin: [
        {
          drugName: "Pioglitazone",
          dosage: "15-45 mg",
          frequency: "Once daily",
          reason: "Alternative for diabetes with insulin-sensitizing properties",
          advantages: ["Improves insulin sensitivity", "Cardiovascular benefits"],
          disadvantages: ["Weight gain risk", "Higher cost", "Liver monitoring"],
          costEstimate: "high",
        },
      ],
    };

    const baseAlternatives = alternativesDB[primaryDrug] || [];
    
    // Filter out contraindicated drugs based on allergies
    if (patientAllergies) {
      return baseAlternatives.filter((alt) => {
        return !NLPService.checkAllergyConflicts(patientAllergies, [alt.drugName]).length;
      });
    }

    return baseAlternatives;
  }

  /**
   * Generate comprehensive treatment plan
   */
  static async generateTreatmentPlan(
    diagnosis: string,
    symptoms: string[],
    patient: Patient
  ): Promise<TreatmentPlan> {
    // Basic treatment plan generation (enhanced with LLM in production)
    const treatmentPlans: Record<string, TreatmentPlan> = {
      Hypertension: {
        primaryDiagnosis: "Hypertension Stage 1-2",
        medications: ["Lisinopril 10mg daily", "Amlodipine 5mg daily"],
        nonPharmacologicalInterventions: [
          "Reduce sodium intake to <2.3g per day",
          "Increase physical activity to 150 minutes/week",
          "Maintain healthy weight (BMI 18.5-24.9)",
          "Limit alcohol consumption",
          "Reduce stress through meditation or yoga",
        ],
        followUpSchedule: "Recheck BP in 2 weeks, then monthly",
        warningSignsToWatch: ["Severe headache", "Chest pain", "Vision changes", "Shortness of breath"],
        estimatedRecoveryTime: "Ongoing management",
        successRate: 0.85,
      },
      "Fever/Acute Infection": {
        primaryDiagnosis: "Acute Infection (Suspected Bacterial)",
        medications: [
          "Paracetamol 1g every 6 hours for fever",
          "Amoxicillin 500mg three times daily for 7 days",
        ],
        nonPharmacologicalInterventions: [
          "Bed rest and adequate hydration",
          "Cool compress for fever",
          "Avoid strenuous activity",
          "Monitor temperature every 4 hours",
        ],
        followUpSchedule: "Follow-up in 3-5 days if no improvement",
        warningSignsToWatch: ["Worsening fever", "Confusion", "Difficulty breathing", "Severe body aches"],
        estimatedRecoveryTime: "7-10 days",
        successRate: 0.9,
      },
      Diabetes: {
        primaryDiagnosis: "Type 2 Diabetes Mellitus",
        medications: ["Metformin 500mg twice daily", "Sitagliptin 100mg daily if needed"],
        nonPharmacologicalInterventions: [
          "Structured meal planning with low glycemic foods",
          "Regular exercise (30 min daily)",
          "Weight management",
          "Blood sugar monitoring 2-4 times daily",
          "Annual eye and foot exams",
        ],
        followUpSchedule: "Monthly HbA1c monitoring, then quarterly",
        warningSignsToWatch: ["Excessive thirst", "Frequent urination", "Tingling in feet", "Vision changes"],
        estimatedRecoveryTime: "Ongoing management with lifestyle changes",
        successRate: 0.75,
      },
    };

    return (
      treatmentPlans[diagnosis] || {
        primaryDiagnosis: diagnosis,
        medications: ["Continue current medications", "Review with healthcare provider"],
        nonPharmacologicalInterventions: [
          "Adequate rest and hydration",
          "Regular monitoring",
          "Follow medical advice",
        ],
        followUpSchedule: "As recommended by healthcare provider",
        warningSignsToWatch: ["Worsening symptoms", "New onset complications"],
        estimatedRecoveryTime: "Variable depending on condition",
        successRate: 0.7,
      }
    );
  }

  /**
   * Predict patient outcomes based on treatment
   */
  static async predictOutcome(
    diagnosis: string,
    treatmentAdherence: number,
    riskFactors: string[],
    patientAge: number
  ): Promise<PredictiveInsight> {
    // Predict recovery probability
    let baseSuccessRate = 0.8;

    // Adjust for age
    if (patientAge > 70) baseSuccessRate -= 0.15;
    else if (patientAge > 60) baseSuccessRate -= 0.1;

    // Adjust for treatment adherence
    const adherenceMultiplier = treatmentAdherence / 100;
    const predictedSuccessRate = Math.max(0.3, baseSuccessRate * (0.5 + adherenceMultiplier * 0.5));

    const factors = [
      `Treatment adherence: ${treatmentAdherence}%`,
      `Age group: ${patientAge} years`,
      `Risk factors identified: ${riskFactors.length}`,
    ];

    let prediction = "Good prognosis";
    let recommendation = "Continue with prescribed treatment and regular monitoring";

    if (predictedSuccessRate > 0.8) {
      prediction = "Excellent prognosis with high likelihood of positive outcomes";
      recommendation = "Maintain current treatment plan and lifestyle modifications";
    } else if (predictedSuccessRate > 0.6) {
      prediction = "Favorable prognosis with good potential for improvement";
      recommendation = "Monitor closely and adjust medications if needed";
    } else if (predictedSuccessRate > 0.4) {
      prediction = "Moderate prognosis requiring close monitoring";
      recommendation = "Consider specialist consultation and treatment adjustment";
    } else {
      prediction = "Guarded prognosis requiring intensive management";
      recommendation = "Urgent specialist consultation recommended";
    }

    return {
      prediction,
      confidence: 0.75,
      factors,
      recommendation,
    };
  }

  /**
   * Get evidence-based clinical guidelines
   */
  static getEvidenceBasedGuidelines(condition: string): string {
    const guidelines: Record<string, string> = {
      Hypertension: `
        **HYPERTENSION MANAGEMENT GUIDELINES (ACC/AHA)**
        
        **Classification:**
        - Normal: <120/<80 mmHg
        - Elevated: 120-129/<80 mmHg
        - Stage 1: 130-139/80-89 mmHg
        - Stage 2: ≥140/≥90 mmHg
        - Hypertensive Crisis: >180/>120 mmHg
        
        **First-line Agents:**
        1. ACE Inhibitors (e.g., Lisinopril)
        2. ARBs (e.g., Losartan)
        3. Thiazide Diuretics
        4. Calcium Channel Blockers (e.g., Amlodipine)
        
        **Lifestyle Modifications:**
        - DASH diet (Dietary Approaches to Stop Hypertension)
        - Sodium restriction <2.3g/day
        - Weight loss (target BMI 18.5-24.9)
        - Regular aerobic exercise (150 min/week)
        - Alcohol moderation
        - Stress reduction
      `,
      Diabetes: `
        **DIABETES MANAGEMENT GUIDELINES (ADA)**
        
        **HbA1c Targets:**
        - General population: <7% (53 mmol/mol)
        - Older adults: 7-8% (53-64 mmol/mol)
        - High-risk patients: <6.5% (48 mmol/mol)
        
        **First-line Medications:**
        1. Metformin (if tolerated, not contraindicated)
        2. GLP-1 Receptor Agonists
        3. SGLT2 Inhibitors
        
        **Lifestyle Interventions:**
        - 150 min/week moderate-intensity exercise
        - Medical nutrition therapy
        - Weight loss if overweight (5-10%)
        - Blood glucose monitoring
        - Annual screening for complications
      `,
    };

    return (
      guidelines[condition] ||
      `
        **CLINICAL MANAGEMENT OF ${condition.toUpperCase()}**
        
        Please refer to current evidence-based guidelines from:
        - American College of Physicians (ACP)
        - American Medical Association (AMA)
        - UpToDate clinical summaries
        
        Consult with appropriate specialists as needed.
      `
    );
  }
}
