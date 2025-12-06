import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Bot, User, Sparkles, Heart, Activity, Brain, Moon, Apple, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function HealthChatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm Dr. Tega, your AI health assistant. I'm here to answer your health questions, provide wellness tips, and help you understand medical information. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: quickQuestions } = useQuery({
    queryKey: ["quick-questions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/health-chatbot/quick-questions");
      return res.json();
    }
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const res = await apiRequest("POST", "/api/health-chatbot/chat", {
        message,
        conversation_history: conversationHistory
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  });

  const tipsMutation = useMutation({
    mutationFn: async (category: string) => {
      const res = await apiRequest("POST", "/api/health-chatbot/health-tips", { category });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.tips,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    chatMutation.mutate(inputMessage);
  };

  const handleQuickQuestion = (question: string) => {
    const userMessage: Message = {
      role: "user",
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    chatMutation.mutate(question);
  };

  const handleHealthTips = (category: string) => {
    const userMessage: Message = {
      role: "user",
      content: `Give me ${category} health tips`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    tipsMutation.mutate(category);
  };

  const healthCategories = [
    { name: "General", icon: Heart, value: "general" },
    { name: "Nutrition", icon: Apple, value: "nutrition" },
    { name: "Exercise", icon: Activity, value: "exercise" },
    { name: "Mental Health", icon: Brain, value: "mental_health" },
    { name: "Sleep", icon: Moon, value: "sleep" },
    { name: "Preventive", icon: Shield, value: "preventive" }
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            Health Chatbot
          </h1>
          <p className="text-muted-foreground mt-1">
            Ask Dr. Tega anything about health and wellness
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
          Online
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {message.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask a health question..."
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Health Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {healthCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.value}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleHealthTips(category.value)}
                    disabled={isTyping}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions?.quick_questions?.slice(0, 5).map((question: string, index: number) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isTyping}
                >
                  <span className="text-xs line-clamp-2">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> Dr. Tega provides general health information. For medical emergencies or specific diagnoses, please consult a healthcare professional.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
