import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Digital Doctors Assistant. I can help you with:\n• Patient health information\n• Medication guidelines\n• Symptom analysis\n• Clinical recommendations\n• Health risk assessment\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const generateAnswer = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // Common questions and answers about the healthcare system
    if (lowerQuery.includes("allerg")) {
      return "Allergies are critical in patient care! Every patient assessment includes mandatory allergy documentation. This prevents dangerous drug interactions and adverse reactions. Our system checks all prescriptions against patient allergies to ensure safety.";
    }

    if (lowerQuery.includes("blood pressure") || lowerQuery.includes("bp")) {
      return "Blood pressure classification:\n• Normal: <120/80 mmHg\n• Elevated: 120-129/<80\n• Stage 1 Hypertension: 130-139/80-89\n• Stage 2 Hypertension: ≥140/≥90\n• Critical: >160/>110 (requires immediate attention)\n\nOur system flags critical BP readings automatically.";
    }

    if (lowerQuery.includes("contraindication")) {
      return "Contraindications are conditions where specific medications should NOT be prescribed due to risk of harm. Our system automatically checks:\n• Patient allergies\n• Current medications\n• Medical conditions\n• Blood type compatibility\n\nEvery prescription recommendation includes contraindication warnings.";
    }

    if (lowerQuery.includes("genotype") || lowerQuery.includes("sickle")) {
      return "Genotype information is crucial for personalized medicine:\n• AA: Normal (no sickle cell)\n• AS: Sickle cell trait (carrier)\n• SS: Sickle cell disease\n• AC/SC: Other hemoglobin variants\n\nThis affects drug metabolism, disease risk, and treatment protocols.";
    }

    if (lowerQuery.includes("biometric") || lowerQuery.includes("fingerprint") || lowerQuery.includes("facial")) {
      return "Our system supports 3 biometric identification methods:\n1. NIN (National ID Number): National identification\n2. Fingerprint: Digital fingerprint scanning\n3. Facial Recognition: AI-powered facial matching\n\nAll methods work equally well for secure patient identification.";
    }

    if (lowerQuery.includes("diagnosis") || lowerQuery.includes("diagnose")) {
      return "Our AI-powered diagnosis system:\n• Analyzes patient symptoms and vital signs\n• Cross-references medical history\n• Provides confidence scores for each condition\n• Suggests severity level (mild/moderate/severe)\n• Recommends evidence-based treatment options\n\nAlways validated by healthcare professionals.";
    }

    if (lowerQuery.includes("prescription") || lowerQuery.includes("drug") || lowerQuery.includes("medication")) {
      return "Prescription recommendations include:\n• Drug name and classification\n• Dosage and frequency\n• Duration of treatment\n• Indication (why it's prescribed)\n• Contraindications (who shouldn't take it)\n• Side effects\n• Drug interactions\n\nAll recommendations follow evidence-based guidelines.";
    }

    if (lowerQuery.includes("risk") || lowerQuery.includes("score")) {
      return "Health Risk Assessment calculates:\n• Overall risk score (0-100)\n• Risk level: LOW, MODERATE, HIGH, CRITICAL\n• Identified risk factors\n• Recommendation priority\n\nCritical scores (>75) trigger immediate alerts for healthcare provider review.";
    }

    if (lowerQuery.includes("vitals") || lowerQuery.includes("vital signs")) {
      return "Key vital signs monitored:\n• Blood Pressure (systolic/diastolic)\n• Heart Rate (bpm)\n• Temperature (°C)\n• Weight (kg)\n• Respiratory Rate\n\nOur system analyzes trends and flags abnormalities instantly.";
    }

    if (lowerQuery.includes("temperature") || lowerQuery.includes("fever")) {
      return "Temperature interpretation:\n• Normal: 36.5-37.5°C\n• Fever: >37.5°C\n• High fever: >39°C (medical attention needed)\n• Hypothermia: <36°C\n\nFever often indicates infection. Persistent fever >38°C warrants investigation.";
    }

    if (lowerQuery.includes("search") || lowerQuery.includes("find patient")) {
      return "Patient search supports multiple methods:\n• Name: Search by first or last name\n• NIN: National ID number lookup\n• MRN: Medical Record Number\n• Fingerprint: Biometric scanning\n• Facial Recognition: AI matching\n\nPartial searches work too - just enter part of the name or ID!";
    }

    if (lowerQuery.includes("heart") || lowerQuery.includes("hr") || lowerQuery.includes("bpm")) {
      return "Heart Rate interpretation:\n• Normal: 60-100 bpm at rest\n• Tachycardia: >100 bpm (elevated)\n• Bradycardia: <60 bpm (low)\n• Critical: >120 bpm (requires attention)\n\nAthletes may have lower resting heart rates (normal for them).";
    }

    if (lowerQuery.includes("health") || lowerQuery.includes("assistant")) {
      return "Digital Doctors Assistant features:\n✓ Multi-method patient identification (NIN, Fingerprint, Facial)\n✓ AI-powered health risk prediction\n✓ Symptom-based diagnosis suggestions\n✓ Evidence-based drug prescriptions\n✓ Contraindication checking\n✓ Clinical Decision Support tools\n✓ Patient status filtering\n✓ 8 advanced ML/DL modules\n\nSecure, comprehensive healthcare management.";
    }

    if (lowerQuery.includes("cds") || lowerQuery.includes("clinical decision")) {
      return "Clinical Decision Support (CDS) provides:\n• Evidence-based recommendations\n• Risk stratification\n• Treatment suggestions based on guidelines\n• Patient-specific considerations\n• Alternative treatment options\n• Supportive data and rationale\n\nDesigned to assist, not replace, clinical judgment.";
    }

    if (lowerQuery.includes("status") || lowerQuery.includes("filter")) {
      return "Patient status filters available:\n• All: Show all patients\n• New: Recently registered\n• Last Visit: Within 7 days\n• Critical: BP>160 or HR>120\n• Low Risk: Stable vitals\n• Booked: Has appointments\n• Discharged: Ready for discharge\n• Death: Deceased patients\n\nUse filters to prioritize patients efficiently.";
    }

    // Default response with helpful suggestions
    return "I can help with questions about:\n• Patient health information\n• Blood pressure, heart rate, temperature\n• Diagnoses and symptoms\n• Medications and prescriptions\n• Drug contraindications\n• Biometric identification\n• Health risk assessment\n• Clinical decision support\n\nWhat would you like to know more about?";
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate intelligent answer based on query
      const answer = generateAnswer(input);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:shadow-xl bg-blue-600 hover:bg-blue-700 z-40"
          data-testid="button-open-chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50 bg-white">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle className="text-lg">Ask DDA Assistant</CardTitle>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-blue-500"
              data-testid="button-close-chatbot"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 bg-gray-50">
            <div className="space-y-4" ref={scrollRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`chat-message-${msg.role}-${msg.id}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
                    <div className="flex gap-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <CardContent className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
                className="flex-1"
                data-testid="input-chatbot-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
