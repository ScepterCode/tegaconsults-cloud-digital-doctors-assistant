/**
 * Advanced NLP Service for Medical Text Analysis
 * - Medical entity extraction
 * - Symptom normalization
 * - Clinical text understanding
 * - Drug interaction detection
 */

export interface MedicalEntity {
  text: string;
  type: "symptom" | "drug" | "disease" | "body_part" | "lab_value" | "allergy";
  confidence: number;
  alternatives?: string[];
}

export interface NLPResult {
  originalText: string;
  entities: MedicalEntity[];
  symptoms: string[];
  drugs: string[];
  diseases: string[];
  urgency: "low" | "medium" | "high" | "critical";
  keywords: string[];
  summary: string;
}

export class NLPService {
  // Medical terminology database
  private static readonly SYMPTOM_KEYWORDS = {
    fever: ["fever", "high temperature", "pyrexia", "elevated temp"],
    cough: ["cough", "persistent cough", "dry cough", "wet cough"],
    pain: ["pain", "ache", "discomfort", "soreness"],
    dyspnea: ["shortness of breath", "difficulty breathing", "SOB", "breathlessness"],
    nausea: ["nausea", "feeling sick", "queasiness"],
    fatigue: ["fatigue", "tiredness", "weakness", "lethargy"],
    headache: ["headache", "migraine", "head pain"],
    rash: ["rash", "skin eruption", "hives"],
    vomiting: ["vomiting", "throwing up", "emesis"],
    diarrhea: ["diarrhea", "loose stool", "bowel movement"],
  };

  private static readonly DRUG_KEYWORDS = {
    paracetamol: ["paracetamol", "acetaminophen", "tylenol"],
    ibuprofen: ["ibuprofen", "advil", "motrin"],
    aspirin: ["aspirin", "acetylsalicylic acid"],
    amoxicillin: ["amoxicillin", "amoxicillin"],
    penicillin: ["penicillin", "pen"],
    metformin: ["metformin", "glucophage"],
    lisinopril: ["lisinopril", "prinivil"],
    metoprolol: ["metoprolol", "lopressor"],
    cetirizine: ["cetirizine", "zyrtec"],
  };

  private static readonly DISEASE_KEYWORDS = {
    hypertension: ["hypertension", "high blood pressure", "HTN"],
    diabetes: ["diabetes", "diabetic"],
    asthma: ["asthma", "asthmatic"],
    pneumonia: ["pneumonia", "pneumonic"],
    influenza: ["influenza", "flu"],
    covid: ["covid", "coronavirus", "covid-19"],
    migraine: ["migraine", "migraines"],
    arthritis: ["arthritis", "arthritic"],
    "heart disease": ["heart disease", "cardiac", "heart condition"],
    "sickle cell": ["sickle cell", "sickle cell disease"],
  };

  private static readonly URGENCY_KEYWORDS = {
    critical: ["emergency", "urgent", "severe", "critical", "acute", "life-threatening", "collapse"],
    high: ["serious", "intense", "unbearable", "cannot function"],
    medium: ["moderate", "significant", "concerning"],
    low: ["mild", "slight", "minimal"],
  };

  /**
   * Extract medical entities from text
   */
  static extractEntities(text: string): MedicalEntity[] {
    const entities: MedicalEntity[] = [];
    const lowerText = text.toLowerCase();

    // Extract symptoms
    for (const [symptom, keywords] of Object.entries(this.SYMPTOM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          entities.push({
            text: keyword,
            type: "symptom",
            confidence: 0.95,
          });
          break;
        }
      }
    }

    // Extract drugs
    for (const [drug, keywords] of Object.entries(this.DRUG_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          entities.push({
            text: keyword,
            type: "drug",
            confidence: 0.9,
          });
          break;
        }
      }
    }

    // Extract diseases
    for (const [disease, keywords] of Object.entries(this.DISEASE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          entities.push({
            text: keyword,
            type: "disease",
            confidence: 0.92,
          });
          break;
        }
      }
    }

    return entities;
  }

  /**
   * Normalize symptom names
   */
  static normalizeSymptoms(text: string): string[] {
    const normalized: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [symptom, keywords] of Object.entries(this.SYMPTOM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          normalized.push(symptom);
          break;
        }
      }
    }

    return [...new Set(normalized)];
  }

  /**
   * Detect urgency level from clinical text
   */
  static detectUrgency(text: string): "low" | "medium" | "high" | "critical" {
    const lowerText = text.toLowerCase();

    // Check critical keywords first
    for (const keyword of this.URGENCY_KEYWORDS.critical) {
      if (lowerText.includes(keyword)) {
        return "critical";
      }
    }

    for (const keyword of this.URGENCY_KEYWORDS.high) {
      if (lowerText.includes(keyword)) {
        return "high";
      }
    }

    for (const keyword of this.URGENCY_KEYWORDS.medium) {
      if (lowerText.includes(keyword)) {
        return "medium";
      }
    }

    return "low";
  }

  /**
   * Full NLP analysis of medical text
   */
  static analyzeText(text: string): NLPResult {
    const entities = this.extractEntities(text);
    const symptoms = this.normalizeSymptoms(text);
    const urgency = this.detectUrgency(text);

    const drugs = entities
      .filter((e) => e.type === "drug")
      .map((e) => e.text);

    const diseases = entities
      .filter((e) => e.type === "disease")
      .map((e) => e.text);

    // Extract keywords (words > 3 chars that aren't common)
    const commonWords = new Set([
      "the", "and", "for", "with", "have", "this", "that", "from", "been", "are", "was", "were",
    ]);
    const keywords = text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !commonWords.has(w))
      .slice(0, 5);

    // Generate summary
    const summaryParts = [];
    if (symptoms.length > 0) {
      summaryParts.push(`Symptoms: ${symptoms.join(", ")}`);
    }
    if (diseases.length > 0) {
      summaryParts.push(`Conditions: ${diseases.join(", ")}`);
    }
    if (drugs.length > 0) {
      summaryParts.push(`Medications: ${drugs.join(", ")}`);
    }
    const summary =
      summaryParts.length > 0 ? summaryParts.join("; ") : "Clinical assessment required";

    return {
      originalText: text,
      entities,
      symptoms,
      drugs,
      diseases,
      urgency,
      keywords: keywords as string[],
      summary,
    };
  }

  /**
   * Check for drug interactions
   */
  static checkDrugInteractions(drugs: string[]): Array<{
    drug1: string;
    drug2: string;
    severity: "minor" | "moderate" | "severe";
    description: string;
  }> {
    const interactions = [];

    // Common known interactions
    const knownInteractions: Record<string, Record<string, { severity: string; description: string }>> = {
      ibuprofen: {
        aspirin: {
          severity: "moderate",
          description: "Increased risk of GI bleeding and ulcers when combined",
        },
        paracetamol: {
          severity: "minor",
          description: "Risk of liver toxicity if total paracetamol exceeds 4g/day",
        },
      },
      metformin: {
        "contrast dye": {
          severity: "severe",
          description: "Risk of lactic acidosis; avoid or use caution with contrast procedures",
        },
      },
      penicillin: {
        methotrexate: {
          severity: "moderate",
          description: "Penicillin may increase methotrexate levels",
        },
      },
    };

    // Check combinations
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const drug1Lower = drugs[i].toLowerCase();
        const drug2Lower = drugs[j].toLowerCase();

        if (knownInteractions[drug1Lower]?.[drug2Lower]) {
          interactions.push({
            drug1: drugs[i],
            drug2: drugs[j],
            ...knownInteractions[drug1Lower][drug2Lower],
          });
        } else if (knownInteractions[drug2Lower]?.[drug1Lower]) {
          interactions.push({
            drug1: drugs[j],
            drug2: drugs[i],
            ...knownInteractions[drug2Lower][drug1Lower],
          });
        }
      }
    }

    return interactions;
  }

  /**
   * Check for allergy conflicts
   */
  static checkAllergyConflicts(allergies: string | undefined, prescribedDrugs: string[]): Array<{
    drug: string;
    allergen: string;
    riskLevel: "low" | "medium" | "high";
  }> {
    if (!allergies) return [];

    const conflicts = [];
    const allergyList = allergies.toLowerCase().split(",").map((a) => a.trim());

    // Penicillin allergy conflicts
    if (allergyList.some((a) => a.includes("penicillin"))) {
      for (const drug of prescribedDrugs) {
        if (["amoxicillin", "ampicillin", "penicillin"].some((d) => drug.toLowerCase().includes(d))) {
          conflicts.push({
            drug,
            allergen: "Penicillin",
            riskLevel: "high",
          });
        }
      }
    }

    // NSAIDs allergy conflicts
    if (allergyList.some((a) => a.includes("nsaid") || a.includes("ibuprofen"))) {
      for (const drug of prescribedDrugs) {
        if (["ibuprofen", "naproxen", "aspirin"].some((d) => drug.toLowerCase().includes(d))) {
          conflicts.push({
            drug,
            allergen: "NSAIDs",
            riskLevel: "high",
          });
        }
      }
    }

    return conflicts;
  }
}
