import { auth } from "./auth";

export interface TerminalMessage {
  type: "command" | "input" | "output" | "error" | "echo";
  data?: string;
  command?: string;
}

export class TerminalWebSocket {
  private ws: WebSocket | null = null;
  private vmId: string;
  private onMessage: (message: TerminalMessage) => void;
  private onConnect: () => void;
  private onDisconnect: () => void;

  constructor(
    vmId: string,
    onMessage: (message: TerminalMessage) => void,
    onConnect: () => void = () => {},
    onDisconnect: () => void = () => {}
  ) {
    this.vmId = vmId;
    this.onMessage = onMessage;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
  }

  connect(): void {
    const token = auth.getToken();
    if (!token) {
      throw new Error("No authentication token");
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}&vmId=${this.vmId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.onConnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: TerminalMessage = JSON.parse(event.data);
        this.onMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.onDisconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  sendCommand(command: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "command",
        command
      }));
    }
  }

  sendInput(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "input",
        data
      }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
