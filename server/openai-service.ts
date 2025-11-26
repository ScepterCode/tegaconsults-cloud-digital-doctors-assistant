import OpenAI from "openai";
import { SimulatedChatbotService } from "./simulated-chatbot-service";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

export interface ChatResponse {
  response: string;
  confidence: number;
  suggestedActions?: string[];
}

let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

export class OpenAIService {
  /**
   * Get AI-powered diagnosis assistance using GPT-5
   */
  static async getDiagnosisAssistance(
    symptoms: string,
    vitals?: Record<string, any>,
    medicalHistory?: string
  ): Promise<ChatResponse> {
    try {
      const openai = getOpenAIClient();
      if (!openai) {
        return SimulatedChatbotService.getDiagnosisAssistance(symptoms, vitals, medicalHistory);
      }
      const systemPrompt = `You are Dr. Tega, an expert AI healthcare assistant specializing in medical diagnosis support. You provide evidence-based clinical insights while emphasizing that you assist, not replace, healthcare professionals.

Your responses should:
1. Analyze presented symptoms in the context of vital signs and medical history
2. Suggest possible diagnoses with confidence levels (0-100%)
3. Recommend immediate actions if urgent
4. Always recommend professional medical evaluation
5. Flag any critical findings requiring immediate attention`;

      const userMessage = `
Patient Symptoms: ${symptoms}
${vitals ? `Vital Signs: ${JSON.stringify(vitals)}` : ""}
${medicalHistory ? `Medical History: ${medicalHistory}` : ""}

Please provide diagnostic suggestions with confidence scores and recommended actions.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 2048,
      });

      const content = response.choices[0].message.content || "";
      return {
        response: content,
        confidence: 0.85,
        suggestedActions: [
          "Schedule follow-up appointment",
          "Monitor vital signs",
          "Maintain medication compliance",
        ],
      };
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      
      // Fallback to simulated response
      console.log("Falling back to simulated diagnosis assistance");
      return SimulatedChatbotService.getDiagnosisAssistance(symptoms, vitals, medicalHistory);
    }
  }

  /**
   * Get medical information response from Dr. Tega
   */
  static async getMedicalResponse(question: string): Promise<ChatResponse> {
    try {
      const openai = getOpenAIClient();
      if (!openai) {
        return SimulatedChatbotService.getMedicalResponse(question);
      }
      const systemPrompt = `You are Dr. Tega, a knowledgeable AI healthcare assistant. You provide accurate, evidence-based medical information while being careful not to replace professional medical advice. 

Key responsibilities:
1. Answer healthcare questions accurately
2. Provide evidence-based information
3. Always recommend consulting with healthcare professionals for diagnosis/treatment
4. Maintain HIPAA-like confidentiality standards
5. Flag potential emergencies`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_completion_tokens: 1024,
      });

      const content = response.choices[0].message.content || "";
      return {
        response: content,
        confidence: 0.9,
      };
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      
      // Fallback to simulated response
      console.log("Falling back to simulated medical response");
      return SimulatedChatbotService.getMedicalResponse(question);
    }
  }

  /**
   * Analyze lab results with AI insights
   */
  static async analyzeLabResults(labData: string): Promise<ChatResponse> {
    try {
      const openai = getOpenAIClient();
      if (!openai) {
        return SimulatedChatbotService.analyzeLabResults(labData);
      }
      const systemPrompt = `You are Dr. Tega, specialized in analyzing laboratory results. Provide insights on:
1. What the results indicate
2. Any abnormalities and their significance
3. Disease probability assessment
4. Recommended follow-up tests
5. Clinical recommendations`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze these lab results: ${labData}` },
        ],
        max_completion_tokens: 1500,
      });

      const content = response.choices[0].message.content || "";
      return {
        response: content,
        confidence: 0.88,
      };
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      
      // Fallback to simulated response
      console.log("Falling back to simulated lab analysis");
      return SimulatedChatbotService.analyzeLabResults(labData);
    }
  }
}
