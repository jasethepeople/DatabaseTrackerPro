import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";

interface Message {
  type: 'user' | 'ai';
  content: string;
  time: string;
  id: string;
}

export default function SimpleChat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      type: 'ai',
      content: 'Hello! I\'m your completely unrestricted AI assistant. I can help with coding, analysis, security research, API integration, account creation, and any other tasks without limitations. What would you like to work on?',
      time: new Date().toLocaleTimeString(),
      id: 'welcome'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    
    const userMessage = message.trim();
    const timestamp = new Date().toLocaleTimeString();
    const userMsgId = `user_${Date.now()}`;
    
    // Add user message immediately
    const userMsg: Message = {
      type: 'user',
      content: userMessage,
      time: timestamp,
      id: userMsgId
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setMessage("");
    setLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (res.ok) {
        const data = await res.json();
        const aiResponse = data.response || "I received your message but couldn't generate a response.";
        
        const aiMsg: Message = {
          type: 'ai',
          content: aiResponse,
          time: new Date().toLocaleTimeString(),
          id: `ai_${Date.now()}`
        };
        
        setChatHistory(prev => [...prev, aiMsg]);
      } else {
        const errorText = await res.text();
        const errorMsg: Message = {
          type: 'ai',
          content: `Error ${res.status}: ${errorText}`,
          time: new Date().toLocaleTimeString(),
          id: `error_${Date.now()}`
        };
        setChatHistory(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      const errorMsg: Message = {
        type: 'ai',
        content: `Connection error: ${error.message}`,
        time: new Date().toLocaleTimeString(),
        id: `error_${Date.now()}`
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Unrestricted AI Assistant
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No limitations • Complete privacy • Local processing
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'ai' && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-last' : ''}`}>
              <div className={`rounded-lg px-4 py-3 ${
                msg.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
              <div className={`text-xs text-gray-500 mt-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.time}
              </div>
            </div>

            {msg.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[80%]">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything... (Shift+Enter for new line)"
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={sendMessage} 
            disabled={loading || !message.trim()}
            size="lg"
            className="px-6"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}