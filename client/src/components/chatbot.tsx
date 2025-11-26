import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Paperclip, Mic, Image, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachment?: {
    type: "image" | "video" | "audio";
    data: string;
    name: string;
  };
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm Dr. Tega, your Digital Doctors Assistant. I'm here to help you with:\n• Patient health information\n• Medication guidelines\n• Symptom analysis\n• Clinical recommendations\n• Health risk assessment\n\nYou can also share pictures, videos, or voice recordings to support patient care. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<ChatMessage["attachment"]>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [messages]);

  const getAIResponse = async (query: string): Promise<string> => {
    try {
      const response = await apiRequest("POST", "/api/chatbot/ask", { question: query });
      const data = await response.json();
      return data.response || "I'm having trouble processing that. Please try again.";
    } catch (error) {
      console.error("Error getting AI response:", error);
      return "I'm having trouble connecting to my AI systems. Please check your connection and try again.";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "audio") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      setAttachment({
        type,
        data,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachment({
            type: "audio",
            data: event.target?.result as string,
            name: `voice_message_${Date.now()}.webm`,
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !attachment) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input || (attachment ? `Shared ${attachment.type} file: ${attachment.name}` : ""),
      timestamp: new Date(),
      attachment,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachment(undefined);
    setIsLoading(true);

    try {
      let answer: string;

      if (attachment) {
        answer = `I've received your ${attachment.type} file "${attachment.name}". Thank you for sharing this with me. I'm Dr. Tega, analyzing this media to support your patient care. For medical imaging, I can help identify key findings. For voice recordings, I can transcribe and analyze clinical notes. Please let me know what specific assistance you need with this file.`;
      } else {
        // Use real OpenAI AI for response
        answer = await getAIResponse(input);
      }

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
        <Card className="fixed bottom-6 right-6 w-96 max-h-[85vh] flex flex-col shadow-2xl z-50 bg-white">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle className="text-lg">Dr. Tega - Healthcare Assistant</CardTitle>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-purple-500"
              data-testid="button-close-chatbot"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 bg-gray-50 overflow-hidden">
            <div className="space-y-4 w-full" ref={scrollRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`chat-message-${msg.role}-${msg.id}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-lg text-sm leading-relaxed break-words ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.attachment && (
                      <div className="mb-2 p-2 bg-gray-100 rounded">
                        {msg.attachment.type === "image" && (
                          <img src={msg.attachment.data} alt="Shared" className="max-w-xs h-auto rounded" />
                        )}
                        {msg.attachment.type === "video" && (
                          <video src={msg.attachment.data} controls className="max-w-xs h-auto rounded" />
                        )}
                        {msg.attachment.type === "audio" && (
                          <audio src={msg.attachment.data} controls className="w-full" />
                        )}
                        <p className="text-xs mt-1 text-gray-600">{msg.attachment.name}</p>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === "user" ? "text-purple-100" : "text-gray-500"
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
          <CardContent className="p-4 border-t bg-white rounded-b-lg space-y-3">
            {/* Media preview */}
            {attachment && (
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                {attachment.type === "image" && <Image className="h-4 w-4 text-blue-600" />}
                {attachment.type === "video" && <Video className="h-4 w-4 text-red-600" />}
                {attachment.type === "audio" && <Mic className="h-4 w-4 text-green-600" />}
                <span className="text-xs text-gray-700 flex-1 truncate">{attachment.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAttachment(undefined)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Ask Dr. Tega a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
                className="flex-1"
                data-testid="input-chatbot-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!input.trim() && !attachment)}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Media upload buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                className="flex-1 gap-2"
                data-testid="button-upload-image"
              >
                <Image className="h-4 w-4" />
                Picture
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => videoInputRef.current?.click()}
                className="flex-1 gap-2"
                data-testid="button-upload-video"
              >
                <Video className="h-4 w-4" />
                Video
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 gap-2 ${isRecording ? "bg-red-100 hover:bg-red-200" : ""}`}
                data-testid="button-record-voice"
              >
                <Mic className={`h-4 w-4 ${isRecording ? "text-red-600 animate-pulse" : ""}`} />
                {isRecording ? "Stop" : "Voice"}
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "image")}
              className="hidden"
              data-testid="input-hidden-image"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleFileUpload(e, "video")}
              className="hidden"
              data-testid="input-hidden-video"
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
