import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimpleChat() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', content: string, time: string}>>([]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    const timestamp = new Date().toLocaleTimeString();
    
    // Add user message to history
    setChatHistory(prev => [...prev, { type: 'user', content: userMessage, time: timestamp }]);
    setMessage("");
    setLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      console.log("Sending message with token:", token ? "Present" : "Missing");
      
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
        const aiResponse = data.response || "Got response but no content";
        setResponse(aiResponse);
        setChatHistory(prev => [...prev, { type: 'ai', content: aiResponse, time: new Date().toLocaleTimeString() }]);
      } else {
        const error = await res.text();
        const errorMsg = `Error ${res.status}: ${error}`;
        setResponse(errorMsg);
        setChatHistory(prev => [...prev, { type: 'ai', content: errorMsg, time: new Date().toLocaleTimeString() }]);
      }
    } catch (error) {
      const errorMsg = `Network error: ${error.message}`;
      setResponse(errorMsg);
      setChatHistory(prev => [...prev, { type: 'ai', content: errorMsg, time: new Date().toLocaleTimeString() }]);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-6">AI Chat - WORKING VERSION</h1>
      
      <div className="space-y-4">
        {/* Chat History */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Chat History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {chatHistory.length === 0 ? (
              <p className="text-gray-500">Start a conversation by typing a message below...</p>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${msg.type === 'user' ? 'bg-blue-100 dark:bg-blue-900 ml-12' : 'bg-gray-100 dark:bg-gray-800 mr-12'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <strong>{msg.type === 'user' ? 'You' : 'AI'}</strong>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
            {loading && (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 mr-12">
                <strong>AI</strong>
                <p>Thinking...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message and press Enter..."
            onKeyPress={(e) => e.key === "Enter" && !loading && sendMessage()}
            className="flex-1"
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !message.trim()}>
            {loading ? "Sending..." : "Send"}
          </Button>
        </div>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Token:</strong> {localStorage.getItem("auth_token") ? "✅ Present" : "❌ Missing"}</p>
              <p><strong>Messages Sent:</strong> {chatHistory.filter(m => m.type === 'user').length}</p>
              <p><strong>AI Responses:</strong> {chatHistory.filter(m => m.type === 'ai').length}</p>
              <p><strong>Status:</strong> {loading ? "🟡 Sending..." : "🟢 Ready"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}