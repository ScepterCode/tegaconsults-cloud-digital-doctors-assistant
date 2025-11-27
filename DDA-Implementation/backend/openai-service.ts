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

// Response cache for common queries (expires after 5 minutes)
const responseCache = new Map<string, { response: ChatResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(key: string): ChatResponse | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  if (cached) {
    responseCache.delete(key);
  }
  return null;
}

function setCachedResponse(key: string, response: ChatResponse): void {
  responseCache.set(key, { response, timestamp: Date.now() });
  // Limit cache size
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
}

// Quick response patterns for EXACT greeting matches only
const QUICK_RESPONSES: Record<string, ChatResponse> = {
  "hello": { response: "Hello! I'm Dr. Tega, your AI healthcare assistant. How can I help you today?", confidence: 1.0 },
  "hi": { response: "Hi there! I'm Dr. Tega. What health questions can I assist you with?", confidence: 1.0 },
  "hey": { response: "Hey! I'm Dr. Tega, ready to assist with your health questions.", confidence: 1.0 },
  "help": { response: "I'm Dr. Tega, here to help with:\n- Symptom analysis and health assessments\n- Medication information and guidelines\n- Lab result interpretation\n- Clinical recommendations\n- Health risk evaluations\n\nWhat would you like to know?", confidence: 1.0 },
  "thank you": { response: "You're welcome! If you have any more health questions, feel free to ask. Take care!", confidence: 1.0 },
  "thanks": { response: "You're welcome! Stay healthy and don't hesitate to ask if you need more assistance.", confidence: 1.0 },
  "bye": { response: "Goodbye! Remember to take care of your health. I'm always here if you need medical guidance.", confidence: 1.0 },
  "goodbye": { response: "Goodbye! Take care of your health. I'm here whenever you need assistance.", confidence: 1.0 },
};

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
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
   * Optimized for speed with caching and quick responses
   */
  static async getMedicalResponse(question: string): Promise<ChatResponse> {
    const normalizedQuestion = normalizeQuery(question);
    
    // Check for EXACT quick responses first (instant) - only for simple greetings
    const quickResponse = QUICK_RESPONSES[normalizedQuestion];
    if (quickResponse && normalizedQuestion.split(' ').length <= 3) {
      return quickResponse;
    }

    // Check cache for similar queries
    const cacheKey = normalizedQuestion.slice(0, 100);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const openai = getOpenAIClient();
      if (!openai) {
        return SimulatedChatbotService.getMedicalResponse(question);
      }
      
      // Optimized concise prompt for faster responses
      const systemPrompt = `You are Dr. Tega, a knowledgeable AI healthcare assistant. Provide accurate, concise, evidence-based medical information. Keep responses focused and actionable. Always recommend consulting healthcare professionals for diagnosis/treatment. Flag emergencies clearly.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_completion_tokens: 800, // Reduced for faster responses
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || "";
      const result: ChatResponse = {
        response: content,
        confidence: 0.9,
      };
      
      // Cache the response
      setCachedResponse(cacheKey, result);
      
      return result;
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
