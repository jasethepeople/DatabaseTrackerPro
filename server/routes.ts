import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authService } from "./services/auth";
import { vmManager } from "./services/vm-manager";
import { toolManager } from "./services/tool-manager";
import { fileManager } from "./services/file-manager";
import { setupWebSocket } from "./websocket";
import { insertUserSchema, insertProjectSchema, insertFileSchema, insertToolSchema } from "@shared/schema";

// Middleware to verify auth token
async function authenticateUser(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const user = await authService.verifyToken(token);
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = user;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup WebSocket for terminal
  setupWebSocket(httpServer);

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const result = await authService.register(userData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateUser, (req: any, res) => {
    const { password, ...user } = req.user;
    res.json(user);
  });

  // Project routes
  app.get("/api/projects", authenticateUser, async (req: any, res) => {
    try {
      const projects = await storage.getProjectsByUserId(req.user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", authenticateUser, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({ ...projectData, userId: req.user.id });
      
      // Create a VM for the project
      const vm = await vmManager.createVM(req.user.id, project.id);
      await storage.updateProject(project.id, { vmId: vm.vmId });
      
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", authenticateUser, async (req: any, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // File routes
  app.get("/api/projects/:id/files", authenticateUser, async (req: any, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== req.user.id) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const files = await fileManager.getProjectFiles(project.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/files", authenticateUser, async (req: any, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      
      // Verify user owns the project
      const project = await storage.getProject(fileData.projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const file = await fileManager.createFile(fileData);
      res.json(file);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create file" });
    }
  });

  app.put("/api/files/:id", authenticateUser, async (req: any, res) => {
    try {
      const file = await storage.getFile(parseInt(req.params.id));
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Verify user owns the project
      const project = await storage.getProject(file.projectId);
      if (!project || project.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedFile = await fileManager.updateFile(file.id, req.body.content);
      res.json(updatedFile);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update file" });
    }
  });

  // VM routes
  app.get("/api/vm/status", authenticateUser, async (req: any, res) => {
    try {
      const vm = await storage.getVMByUserId(req.user.id);
      if (!vm) {
        return res.status(404).json({ message: "VM not found" });
      }
      
      const status = await vmManager.getVMStatus(vm.vmId);
      res.json({ vmId: vm.vmId, status });
    } catch (error) {
      res.status(500).json({ message: "Failed to get VM status" });
    }
  });

  app.post("/api/vm/start", authenticateUser, async (req: any, res) => {
    try {
      const vm = await storage.getVMByUserId(req.user.id);
      if (!vm) {
        return res.status(404).json({ message: "VM not found" });
      }
      
      await vmManager.startVM(vm.vmId);
      res.json({ message: "VM started" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to start VM" });
    }
  });

  app.post("/api/vm/stop", authenticateUser, async (req: any, res) => {
    try {
      const vm = await storage.getVMByUserId(req.user.id);
      if (!vm) {
        return res.status(404).json({ message: "VM not found" });
      }
      
      await vmManager.stopVM(vm.vmId);
      res.json({ message: "VM stopped" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to stop VM" });
    }
  });

  // Tool routes
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await toolManager.getAvailableTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  // Seed some default tools if none exist
  app.post("/api/tools/seed", async (req, res) => {
    try {
      const existingTools = await toolManager.getAvailableTools();
      if (existingTools.length === 0) {
        const defaultTools = [
          {
            name: "nodejs",
            displayName: "Node.js",
            description: "JavaScript runtime built on Chrome's V8 engine",
            category: "runtime",
            version: "v18.17.0",
            dockerImage: "node:18-alpine",
            ports: { "3000": "3000" },
            environment: { NODE_ENV: "development" },
            volumes: { "/app": "/workspace" }
          },
          {
            name: "python",
            displayName: "Python",
            description: "Programming language that lets you work quickly",
            category: "language",
            version: "v3.11.4",
            dockerImage: "python:3.11-alpine",
            ports: { "8000": "8000" },
            environment: { PYTHONPATH: "/app" },
            volumes: { "/app": "/workspace" }
          },
          {
            name: "n8n",
            displayName: "n8n",
            description: "Workflow automation tool for technical people",
            category: "automation",
            version: "v1.0.0",
            dockerImage: "n8nio/n8n:latest",
            ports: { "5678": "5678" },
            environment: { 
              N8N_BASIC_AUTH_ACTIVE: "true",
              N8N_BASIC_AUTH_USER: "admin",
              N8N_BASIC_AUTH_PASSWORD: "admin123"
            },
            volumes: { "/home/node/.n8n": "/workspace/.n8n" }
          },
          {
            name: "docker",
            displayName: "Docker",
            description: "Platform for developing and shipping applications",
            category: "containerization",
            version: "v24.0.5",
            dockerImage: "docker:24-dind",
            ports: { "2375": "2375" },
            environment: { DOCKER_TLS_CERTDIR: "" },
            volumes: { "/var/run/docker.sock": "/var/run/docker.sock" }
          }
        ];

        for (const tool of defaultTools) {
          await toolManager.createTool(tool);
        }

        res.json({ message: "Default tools seeded", count: defaultTools.length });
      } else {
        res.json({ message: "Tools already exist", count: existingTools.length });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to seed tools" });
    }
  });

  app.post("/api/tools", authenticateUser, async (req: any, res) => {
    try {
      const toolData = insertToolSchema.parse(req.body);
      const tool = await toolManager.createTool(toolData);
      res.json(tool);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create tool" });
    }
  });

  app.post("/api/tools/:id/install", authenticateUser, async (req: any, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const { projectId } = req.body;
      
      await toolManager.installTool(req.user.id, toolId, projectId);
      res.json({ message: "Tool installation started" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to install tool" });
    }
  });

  app.get("/api/user/tools", authenticateUser, async (req: any, res) => {
    try {
      const userTools = await storage.getUserTools(req.user.id);
      res.json(userTools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user tools" });
    }
  });

  // Service routes
  app.get("/api/services", authenticateUser, async (req: any, res) => {
    try {
      const services = await storage.getServicesByUserId(req.user.id);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Hardware monitoring
  app.get("/api/hardware", authenticateUser, async (req: any, res) => {
    try {
      // Mock hardware data - in real implementation, use system monitoring tools
      const hardware = {
        cpu: Math.floor(Math.random() * 50) + 20,
        memory: {
          used: Math.floor(Math.random() * 2048) + 1024,
          total: 4096
        },
        disk: {
          used: Math.floor(Math.random() * 10240) + 5120,
          total: 20480
        }
      };
      res.json(hardware);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hardware status" });
    }
  });

  return httpServer;
}
