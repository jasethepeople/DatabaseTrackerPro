import { useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. I can help you with coding, deployment, API integration, and much more. What would you like to work on today?",
      role: "assistant",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");

  // Debug authentication
  React.useEffect(() => {
    const token = localStorage.getItem("auth_token");
    console.log("Auth token present:", !!token);
    if (token) {
      console.log("Token prefix:", token.substring(0, 20));
    }
  }, []);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", { message });
      return await response.json();
    },
    onSuccess: (data) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: data.response || "I'm working on that for you!",
        role: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Connection error: ${error.message}. Please try refreshing the page or logging in again.`,
        role: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessage.mutate(input);
    setInput("");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d1117", color: "#e6edf3" }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "#21262d" }}>
        <h1 className="text-xl font-semibold">AI Assistant</h1>
        <p className="text-sm opacity-70">Your coding and development assistant</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div className="flex-shrink-0">
                {message.role === "user" ? (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100 border border-gray-700"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-300">AI is thinking...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t" style={{ borderColor: "#21262d" }}>
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about coding, deployment, APIs..."
              disabled={sendMessage.isPending}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              style={{ backgroundColor: "#21262d", borderColor: "#30363d" }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}