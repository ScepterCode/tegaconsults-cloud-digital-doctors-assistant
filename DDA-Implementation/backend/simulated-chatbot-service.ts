export interface ChatResponse {
  response: string;
  confidence: number;
  suggestedActions?: string[];
}

export class SimulatedChatbotService {
  /**
   * Simulated medical responses without OpenAI
   */
  static getMedicalResponse(question: string): ChatResponse {
    const lowerQuestion = question.toLowerCase();

    // Symptom-related queries
    if (lowerQuestion.includes("fever") || lowerQuestion.includes("temperature")) {
      return {
        response: `Hello! I'm Dr. Tega. Fever is typically the body's response to infection. 

Key points to consider:
• Normal fever ranges from 100.4°F (38°C) to 103°F (39.4°C)
• Fevers below 103°F are usually safe and help fight infection
• Stay hydrated - drink plenty of water
• Rest is essential for recovery

I recommend:
1. Monitor your temperature regularly
2. Drink warm fluids (tea, broth)
3. Take over-the-counter fever reducers if needed
4. Get adequate rest

When to seek immediate care:
• Temperature above 103°F (39.4°C)
• Fever lasting more than 3 days
• Severe headache or stiff neck
• Difficulty breathing

Please consult with your healthcare provider for proper diagnosis and treatment.`,
        confidence: 0.82,
        suggestedActions: [
          "Schedule doctor appointment",
          "Monitor vital signs",
          "Stay hydrated",
          "Get adequate rest"
        ]
      };
    }

    if (lowerQuestion.includes("headache") || lowerQuestion.includes("migraine")) {
      return {
        response: `I'm Dr. Tega. Headaches can have various causes:

Common causes:
• Stress and tension
• Dehydration
• Poor sleep
• Eye strain
• Caffeine withdrawal
• Migraines

Relief strategies:
1. Rest in a quiet, dark room
2. Apply warm or cold compress to the head/neck
3. Stay hydrated - drink water consistently
4. Avoid screen time temporarily
5. Take over-the-counter pain relievers

When to see a doctor:
• Sudden severe headache (thunderclap)
• Headache with fever, stiff neck, or rash
• Headache after head injury
• Recurring headaches requiring frequent medication

Preventive measures:
• Maintain regular sleep schedule
• Manage stress through exercise/relaxation
• Stay hydrated throughout the day
• Limit caffeine intake

Please seek professional medical evaluation if symptoms persist.`,
        confidence: 0.8,
        suggestedActions: [
          "Rest and hydrate",
          "Apply compress",
          "Reduce screen time",
          "Schedule follow-up if persistent"
        ]
      };
    }

    if (lowerQuestion.includes("diabetes") || lowerQuestion.includes("blood sugar")) {
      return {
        response: `I'm Dr. Tega. Diabetes is a chronic condition affecting how your body regulates blood sugar.

Types:
• Type 1: Pancreas doesn't produce insulin
• Type 2: Body doesn't use insulin effectively
• Gestational: Occurs during pregnancy

Key management strategies:
1. Monitor blood glucose regularly
2. Follow a balanced diet (limit sugar)
3. Exercise regularly (150+ minutes weekly)
4. Maintain healthy weight
5. Take prescribed medications consistently

Important considerations:
• Check blood pressure and cholesterol regularly
• Get annual eye and foot examinations
• Monitor for signs of complications

Warning signs:
• Excessive thirst
• Frequent urination
• Fatigue
• Blurred vision
• Slow-healing wounds

Lifestyle modifications:
• Choose whole grains over refined carbs
• Include plenty of vegetables and lean proteins
• Limit salt and sugary drinks
• Manage stress effectively

Please work with an endocrinologist or your primary care physician for personalized diabetes management.`,
        confidence: 0.85,
        suggestedActions: [
          "Schedule diabetes screening",
          "Modify diet and exercise",
          "Monitor blood glucose",
          "Consult endocrinologist"
        ]
      };
    }

    if (lowerQuestion.includes("blood pressure") || lowerQuestion.includes("hypertension")) {
      return {
        response: `I'm Dr. Tega. Hypertension (high blood pressure) is a serious condition affecting your cardiovascular health.

Blood pressure categories:
• Normal: Less than 120/80 mmHg
• Elevated: 120-129/<80 mmHg
• Stage 1: 130-139/80-89 mmHg
• Stage 2: 140+ or 90+ mmHg

Management strategies:
1. Regular exercise (30 minutes, 5 days/week)
2. DASH diet (low sodium, rich in potassium)
3. Reduce sodium intake (<2,300mg daily)
4. Maintain healthy weight
5. Limit alcohol consumption
6. Manage stress

Monitoring:
• Check blood pressure regularly at home
• Keep a blood pressure log
• Monitor for symptoms (headaches, shortness of breath)

Medications may include:
• ACE inhibitors
• Beta-blockers
• Calcium channel blockers
• Diuretics

Risk factors:
• Age and family history
• Stress and poor sleep
• Sedentary lifestyle
• High-sodium diet

Please visit your doctor regularly for blood pressure monitoring and medication adjustments.`,
        confidence: 0.84,
        suggestedActions: [
          "Get regular BP checks",
          "Start DASH diet",
          "Increase physical activity",
          "Consult cardiologist"
        ]
      };
    }

    if (lowerQuestion.includes("appointment") || lowerQuestion.includes("book")) {
      return {
        response: `I'm Dr. Tega. To book an appointment:

Patient Steps:
1. Navigate to "My Appointments" from the sidebar
2. Click "Book Appointment" button
3. Select your preferred doctor
4. Choose date and time
5. Describe reason for visit
6. Submit booking request

Doctor Confirmation:
• Your doctor will review your booking request
• You'll see "Pending" status in your appointments list
• Once approved, status changes to "Confirmed"
• You'll receive appointment confirmation

Appointment Management:
• View all your appointments
• See appointment status
• Track confirmation from doctor

Tips:
• Provide detailed reason for visit
• Choose convenient time slots
• Have any relevant medical records ready
• Arrive 10 minutes early

If you have questions about your appointment, please contact your healthcare provider directly.`,
        confidence: 0.9,
        suggestedActions: [
          "Go to My Appointments",
          "Click Book Appointment",
          "Select doctor and time",
          "Submit request"
        ]
      };
    }

    if (lowerQuestion.includes("medication") || lowerQuestion.includes("drug")) {
      return {
        response: `I'm Dr. Tega. Important information about medications:

Before taking any medication:
1. Always follow your doctor's prescription
2. Read medication labels carefully
3. Understand dosage and frequency
4. Know potential side effects
5. Report allergies to your doctor

General guidelines:
• Take medications exactly as prescribed
• Don't skip doses
• Don't share medications with others
• Store in cool, dry place
• Keep away from children

Common side effects:
• Nausea, dizziness, headache
• Allergic reactions (rash, swelling)
• Interactions with other medications

Report immediately:
• Severe allergic reactions
• Unusual symptoms
• Medication ineffectiveness
• Severe side effects

Drug interactions:
• Inform doctor of all medications
• Include supplements and herbal products
• Report OTC medications
• Discuss alcohol consumption

Medication storage:
• Store at room temperature
• Keep away from moisture
• Don't use expired medications
• Dispose safely

Please consult your pharmacist or doctor for medication-specific advice.`,
        confidence: 0.83,
        suggestedActions: [
          "Review medication list",
          "Check for interactions",
          "Consult pharmacist",
          "Report side effects to doctor"
        ]
      };
    }

    // Default health-related response
    return {
      response: `Hello! I'm Dr. Tega, your AI healthcare assistant. I'm here to provide health information and guidance.

I can help you with:
• Symptom information and management
• General health questions
• Medication information
• Appointment booking guidance
• Lab result insights
• Health recommendations

However, I cannot:
• Replace professional medical diagnosis
• Prescribe medications
• Provide emergency medical care
• Access your actual medical records

For your specific concern about "${question}":
While I don't have specific information, I recommend:
1. Consult with your primary care physician
2. Describe symptoms in detail
3. Provide relevant medical history
4. Ask about recommended treatments

For emergencies:
• Call 911 or emergency services immediately
• Don't rely solely on AI assistance

How can I better assist you today? Feel free to ask about specific health topics, symptoms, or appointments.`,
      confidence: 0.7,
      suggestedActions: [
        "Consult healthcare provider",
        "Describe symptoms in detail",
        "Schedule appointment",
        "Provide medical history"
      ]
    };
  }

  static getDiagnosisAssistance(
    symptoms: string,
    vitals?: Record<string, any>,
    medicalHistory?: string
  ): ChatResponse {
    const symptomLower = symptoms.toLowerCase();

    // Analyze symptoms and vitals
    let diagnosis = "Based on the information provided, potential considerations include:\n\n";
    let confidence = 0.75;

    if (symptomLower.includes("fever") && vitals?.temperature && parseFloat(vitals.temperature) > 38) {
      diagnosis += "• Acute infection (bacterial or viral)\n";
      diagnosis += "• Recommended: Blood work, urinalysis\n";
      confidence = 0.8;
    }

    if (symptomLower.includes("cough") || symptomLower.includes("shortness")) {
      diagnosis += "• Respiratory condition (cold, flu, pneumonia)\n";
      diagnosis += "• Recommended: Chest X-ray if persistent\n";
      confidence = 0.78;
    }

    if (symptomLower.includes("chest pain")) {
      diagnosis += "• ⚠️ URGENT: Cardiac evaluation recommended\n";
      diagnosis += "• Seek immediate medical attention\n";
      confidence = 0.85;
    }

    if (vitals?.bloodPressureSystolic && vitals.bloodPressureSystolic > 140) {
      diagnosis += "• Elevated blood pressure (Hypertension)\n";
      diagnosis += "• Recommended: Lifestyle modifications, medication review\n";
      confidence = 0.82;
    }

    if (vitals?.heartRate && vitals.heartRate > 100) {
      diagnosis += "• Elevated heart rate (Tachycardia)\n";
      diagnosis += "• Consider: Stress, infection, or cardiac evaluation\n";
      confidence = 0.75;
    }

    diagnosis += "\n⚠️ IMPORTANT: This is not a medical diagnosis. Please consult a healthcare professional for accurate diagnosis and treatment.";

    return {
      response: diagnosis,
      confidence,
      suggestedActions: [
        "Schedule doctor appointment",
        "Get laboratory tests",
        "Monitor vital signs",
        "Maintain medical records"
      ]
    };
  }

  static analyzeLabResults(labData: string): ChatResponse {
    const dataLower = labData.toLowerCase();

    let analysis = "Lab Result Analysis:\n\n";
    let hasAbnormalities = false;

    if (dataLower.includes("blood") || dataLower.includes("hematology")) {
      analysis += "• Blood Test: Monitor hemoglobin, white blood cells, platelets\n";
      if (dataLower.includes("high") || dataLower.includes("elevated")) {
        analysis += "  - Elevated values may indicate infection or other conditions\n";
        hasAbnormalities = true;
      }
    }

    if (dataLower.includes("glucose") || dataLower.includes("sugar")) {
      analysis += "• Glucose Level: Check fasting vs. non-fasting\n";
      if (dataLower.includes("high")) {
        analysis += "  - May indicate diabetes risk\n";
        hasAbnormalities = true;
      }
    }

    if (dataLower.includes("cholesterol")) {
      analysis += "• Cholesterol: Check LDL, HDL, triglycerides\n";
      analysis += "  - Important for cardiovascular health\n";
    }

    if (dataLower.includes("liver") || dataLower.includes("kidney")) {
      analysis += "• Organ Function: Enzymes and creatinine levels\n";
      if (dataLower.includes("abnormal")) {
        analysis += "  - May require follow-up evaluation\n";
        hasAbnormalities = true;
      }
    }

    if (!hasAbnormalities && analysis === "Lab Result Analysis:\n\n") {
      analysis = "Lab results received. For detailed analysis, please share specific test values with normal ranges.";
    }

    analysis += "\n\nRecommendations:\n";
    analysis += "• Follow up with your doctor for interpretation\n";
    analysis += "• Discuss any abnormal findings\n";
    analysis += "• Get repeat tests if recommended\n";
    analysis += "• Maintain healthy lifestyle habits";

    return {
      response: analysis,
      confidence: 0.8,
      suggestedActions: [
        "Discuss with doctor",
        "Schedule follow-up",
        "Get repeat tests if needed",
        "Maintain health habits"
      ]
    };
  }
}
