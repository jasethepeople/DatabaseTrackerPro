import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { vmManager } from "./services/vm-manager";
import { authService } from "./services/auth";

interface TerminalSession {
  vmId: string;
  userId: number;
  ws: WebSocket;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  const sessions = new Map<string, TerminalSession>();

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const vmId = url.searchParams.get("vmId");

    if (!token || !vmId) {
      ws.close(4001, "Missing token or vmId");
      return;
    }

    // Verify auth token
    const user = await authService.verifyToken(token);
    if (!user) {
      ws.close(4002, "Invalid token");
      return;
    }

    const sessionId = `${user.id}-${vmId}`;
    sessions.set(sessionId, { vmId, userId: user.id, ws });

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "command") {
          // Execute command in VM
          const output = await vmManager.executeCommand(vmId, message.command);
          ws.send(JSON.stringify({
            type: "output",
            data: output
          }));
        } else if (message.type === "input") {
          // Send input to terminal
          ws.send(JSON.stringify({
            type: "echo",
            data: message.data
          }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({
          type: "error",
          data: "Failed to process command"
        }));
      }
    });

    ws.on("close", () => {
      sessions.delete(sessionId);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: "output",
      data: `Welcome to LocalReplit Terminal\nConnected to VM: ${vmId}\n$ `
    }));
  });

  return wss;
}
