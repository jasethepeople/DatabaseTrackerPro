import { useState, useEffect, useRef } from "react";
import { Minus, Maximize2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalWebSocket, TerminalMessage } from "@/lib/websocket";

interface TerminalProps {
  onToggle: () => void;
}

export default function Terminal({ onToggle }: TerminalProps) {
  const [output, setOutput] = useState<string[]>([
    "Welcome to LocalReplit Terminal",
    "Connected to VM: vm-12345",
    "user@localreplit:~/my-awesome-app$ "
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<TerminalWebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const vmId = "vm-12345"; // In real app, get from context/props
    
    wsRef.current = new TerminalWebSocket(
      vmId,
      handleWebSocketMessage,
      () => setIsConnected(true),
      () => setIsConnected(false)
    );

    try {
      wsRef.current.connect();
    } catch (error) {
      console.error("Failed to connect to terminal:", error);
      // Continue with mock terminal for demo
    }

    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const handleWebSocketMessage = (message: TerminalMessage) => {
    switch (message.type) {
      case "output":
        if (message.data) {
          setOutput(prev => [...prev, message.data!]);
        }
        break;
      case "echo":
        if (message.data) {
          setOutput(prev => [...prev, message.data!]);
        }
        break;
      case "error":
        if (message.data) {
          setOutput(prev => [...prev, `ERROR: ${message.data}`]);
        }
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const command = currentInput.trim();
      if (command) {
        // Add command to output
        setOutput(prev => [...prev, `$ ${command}`]);
        
        // Send to WebSocket if connected
        if (wsRef.current?.isConnected()) {
          wsRef.current.sendCommand(command);
        } else {
          // Mock command execution for demo
          handleMockCommand(command);
        }
        
        setCurrentInput("");
      }
    }
  };

  const handleMockCommand = (command: string) => {
    setTimeout(() => {
      let response = "";
      
      switch (command.toLowerCase()) {
        case "ls":
        case "dir":
          response = "src  components  package.json  README.md";
          break;
        case "pwd":
          response = "/home/user/my-awesome-app";
          break;
        case "whoami":
          response = "user";
          break;
        case "date":
          response = new Date().toString();
          break;
        case "clear":
          setOutput(["user@localreplit:~/my-awesome-app$ "]);
          return;
        case "help":
          response = "Available commands: ls, pwd, whoami, date, clear, help, npm, node";
          break;
        default:
          if (command.startsWith("npm")) {
            response = `npm: command executed successfully`;
          } else if (command.startsWith("node")) {
            response = "Node.js v18.17.0";
          } else {
            response = `bash: ${command}: command not found`;
          }
      }
      
      setOutput(prev => [...prev, response, "user@localreplit:~/my-awesome-app$ "]);
    }, 100);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col terminal">
      {/* Terminal Header */}
      <div className="github-surface px-4 py-2 border-b border-opacity-20 border-white flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-white">Terminal</span>
            {isConnected && (
              <span className="text-xs github-gray">(Connected)</span>
            )}
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" className="github-elevated text-white px-3 py-1 text-xs">
              bash
            </Button>
            <Button variant="ghost" size="sm" className="github-gray hover:text-white px-3 py-1 text-xs">
              <Plus size={12} />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="github-gray hover:text-white p-1">
            <Minus size={12} />
          </Button>
          <Button variant="ghost" size="sm" className="github-gray hover:text-white p-1">
            <Maximize2 size={12} />
          </Button>
          <Button variant="ghost" size="sm" className="github-gray hover:text-white p-1" onClick={onToggle}>
            <X size={12} />
          </Button>
        </div>
      </div>
      
      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 font-mono text-sm overflow-y-auto cursor-text"
        onClick={focusInput}
      >
        {output.map((line, index) => (
          <div key={index} className="mb-1 whitespace-pre-wrap">
            {line.includes("$") && line.includes("user@localreplit") ? (
              <div className="flex items-center">
                <span className="text-green-400">user@localreplit</span>
                <span className="github-gray">:</span>
                <span className="github-blue">~/my-awesome-app</span>
                <span className="github-gray">$ </span>
                {index === output.length - 1 && (
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-transparent outline-none text-white flex-1"
                    autoFocus
                  />
                )}
              </div>
            ) : line.startsWith("$") ? (
              <div className="text-white">{line}</div>
            ) : line.startsWith("ERROR:") ? (
              <div className="text-red-400">{line}</div>
            ) : (
              <div className="text-gray-300">{line}</div>
            )}
          </div>
        ))}
        
        {/* Cursor */}
        {output[output.length - 1]?.includes("$") && (
          <div className="inline-block w-2 h-4 bg-white animate-pulse ml-1"></div>
        )}
      </div>
    </div>
  );
}
