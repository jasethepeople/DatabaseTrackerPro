import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authService } from "./services/auth";
import { vmManager } from "./services/vm-manager";
import { toolManager } from "./services/tool-manager";
import { fileManager } from "./services/file-manager";
import { setupWebSocket } from "./websocket";
import { 
  insertUserSchema, insertProjectSchema, insertFileSchema, insertToolSchema,
  insertApiCredentialSchema, insertBackgroundJobSchema 
} from "@shared/schema";
import { externalAPIService } from "./services/external-apis";
import { credentialManager } from "./services/credential-manager";
import { backgroundJobScheduler } from "./services/background-job-scheduler";
import { dataAccessManager } from "./services/data-access-manager";

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

  app.delete("/api/files/:id", authenticateUser, async (req: any, res) => {
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
      
      await fileManager.deleteFile(file.id);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete file" });
    }
  });

  app.patch("/api/files/:id/rename", authenticateUser, async (req: any, res) => {
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
      
      const { newPath } = req.body;
      const renamedFile = await fileManager.moveFile(file.id, newPath);
      res.json(renamedFile);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to rename file" });
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

  // Data Access and Management Routes
  app.get("/api/data/:apiId/:endpoint", authenticateUser, async (req: any, res) => {
    try {
      const { apiId, endpoint } = req.params;
      const forceRefresh = req.query.refresh === 'true';
      
      const data = await dataAccessManager.getData(
        req.user.id,
        apiId,
        decodeURIComponent(endpoint),
        forceRefresh
      );
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Data access error:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch data' 
      });
    }
  });

  app.get("/api/data/available", authenticateUser, async (req: any, res) => {
    try {
      const availableData = await dataAccessManager.getAvailableData(req.user.id);
      res.json({ success: true, data: availableData });
    } catch (error) {
      console.error('Error getting available data:', error);
      res.status(500).json({ success: false, message: 'Failed to get available data' });
    }
  });

  app.post("/api/data/auto-sync", authenticateUser, async (req: any, res) => {
    try {
      const { apiId, endpoint, schedule } = req.body;
      
      const job = await dataAccessManager.setupAutoSync(
        req.user.id,
        apiId,
        endpoint,
        schedule
      );
      
      res.json({ success: true, job });
    } catch (error) {
      console.error('Error setting up auto-sync:', error);
      res.status(500).json({ success: false, message: 'Failed to setup auto-sync' });
    }
  });

  // === ADVANCED CREDENTIAL MANAGEMENT ROUTES ===
  
  app.get('/api/credentials/stats', authenticateUser, async (req: any, res) => {
    try {
      const { credentialManager } = await import('./services/credential-manager');
      const stats = await credentialManager.getCredentialStats(req.user.id);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Failed to get credential stats:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get('/api/credentials/:platform', authenticateUser, async (req: any, res) => {
    try {
      const { credentialManager } = await import('./services/credential-manager');
      const credentials = await credentialManager.getCredentials(req.user.id, req.params.platform);
      res.json({ success: true, credentials });
    } catch (error) {
      console.error('Failed to get platform credentials:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/credentials/store', authenticateUser, async (req: any, res) => {
    try {
      const { credentialManager } = await import('./services/credential-manager');
      const credential = await credentialManager.storeCredential(req.user.id, req.body.platform, req.body.credentialData);
      res.json({ success: true, credential });
    } catch (error) {
      console.error('Failed to store credential:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/credentials/scan', authenticateUser, async (req: any, res) => {
    try {
      const { credentialManager } = await import('./services/credential-manager');
      const { content, source } = req.body;
      
      const scanResults = await credentialManager.scanForCredentials(content, source);
      const storedCredentials = await credentialManager.autoStoreFoundCredentials(req.user.id, scanResults);
      
      res.json({ 
        success: true, 
        scanResults, 
        stored: storedCredentials.length,
        credentials: storedCredentials 
      });
    } catch (error) {
      console.error('Failed to scan for credentials:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // === AUTOMATED ACCOUNT CREATION ROUTES ===
  
  app.post('/api/accounts/create', authenticateUser, async (req: any, res) => {
    try {
      const { credentialManager } = await import('./services/credential-manager');
      const result = await credentialManager.createAccount(req.body);
      res.json(result);
    } catch (error) {
      console.error('Failed to create account:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // === AUTOMATED TESTING ROUTES ===
  
  app.post('/api/testing/generate', authenticateUser, async (req: any, res) => {
    try {
      const { automatedTestingService } = await import('./services/automated-testing-service');
      const { projectPath = './', options } = req.body;
      
      const result = await automatedTestingService.generateTestSuite(projectPath, options);
      res.json(result);
    } catch (error) {
      console.error('Failed to generate tests:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/testing/run', authenticateUser, async (req: any, res) => {
    try {
      const { automatedTestingService } = await import('./services/automated-testing-service');
      const { projectPath = './', options } = req.body;
      
      const testResult = await automatedTestingService.runTests(projectPath, options);
      res.json({ success: true, result: testResult });
    } catch (error) {
      console.error('Failed to run tests:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/testing/debug', authenticateUser, async (req: any, res) => {
    try {
      const { automatedTestingService } = await import('./services/automated-testing-service');
      const { projectPath = './' } = req.body;
      
      const debugResult = await automatedTestingService.debugProject(projectPath);
      res.json({ success: true, debug: debugResult });
    } catch (error) {
      console.error('Failed to debug project:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // === COMPREHENSIVE PROMPT TESTING ROUTES ===
  
  app.post('/api/testing/run-all-prompts', authenticateUser, async (req: any, res) => {
    try {
      const { promptTestingService } = await import('./services/prompt-testing-service');
      console.log('🧪 Starting comprehensive prompt testing...');
      
      const results = await promptTestingService.runAllPrompts();
      
      res.json({ 
        success: true, 
        testing: results,
        readyForDeployment: results.totalScore >= 90 && results.passedCount >= 14
      });
    } catch (error) {
      console.error('Failed to run prompt tests:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get('/api/testing/deployment-readiness', authenticateUser, async (req: any, res) => {
    try {
      // Check all system components
      const { credentialManager } = await import('./services/credential-manager');
      const { automatedTestingService } = await import('./services/automated-testing-service');
      
      await credentialManager.initialize();
      await automatedTestingService.initialize();
      
      // Get system status
      const credentialStats = await credentialManager.getCredentialStats(req.user.id);
      
      const readinessCheck = {
        credentialManager: true,
        testingService: true,
        credentialCount: credentialStats.total,
        autoGenerated: credentialStats.autoGenerated,
        systemReady: credentialStats.total > 0
      };

      res.json({ 
        success: true, 
        readiness: readinessCheck,
        recommendation: readinessCheck.systemReady ? 
          'System is ready for comprehensive testing and deployment' : 
          'Please add credentials and run tests before deployment'
      });
    } catch (error) {
      console.error('Failed to check deployment readiness:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // === CREDENTIAL MANAGEMENT ROUTES ===
  
  app.post('/api/credentials/store', authenticateUser, async (req: any, res) => {
    try {
      const { credentialManager } = await import('./services/credential-manager');
      const { platform, credentialData } = req.body;
      
      const credential = await credentialManager.storeCredential(req.user.id, platform, credentialData);
      res.json({ success: true, credential });
    } catch (error) {
      console.error('Failed to store credential:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/credentials/scan', authenticateUser, async (req: any, res) => {
    try {
      const { credentialManager } = await import('./services/credential-manager');
      const { content, source } = req.body;
      
      const scanResults = await credentialManager.scanForCredentials(content, source);
      res.json({ success: true, scanResults });
    } catch (error) {
      console.error('Failed to scan credentials:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/credentials/create-account', authenticateUser, async (req: any, res) => {
    try {
      const { credentialManager } = await import('./services/credential-manager');
      const options = req.body;
      
      const account = await credentialManager.createAccount(options);
      res.json({ success: true, account });
    } catch (error) {
      console.error('Failed to create account:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Background Jobs Management
  app.get("/api/background-jobs", authenticateUser, async (req: any, res) => {
    try {
      const jobs = await backgroundJobScheduler.getUserJobs(req.user.id);
      res.json({ success: true, jobs });
    } catch (error) {
      console.error('Error fetching background jobs:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch background jobs' });
    }
  });

  app.post("/api/background-jobs", authenticateUser, async (req: any, res) => {
    try {
      const jobData = insertBackgroundJobSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const job = await backgroundJobScheduler.createJob(jobData);
      res.json({ success: true, job });
    } catch (error) {
      console.error('Error creating background job:', error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create background job' 
      });
    }
  });

  app.delete("/api/background-jobs/:id", authenticateUser, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const success = await backgroundJobScheduler.deleteJob(req.user.id, jobId);
      
      if (success) {
        res.json({ success: true, message: 'Background job deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Background job not found' });
      }
    } catch (error) {
      console.error('Error deleting background job:', error);
      res.status(500).json({ success: false, message: 'Failed to delete background job' });
    }
  });

  // Autonomous Learning Engine routes
  app.get('/api/ai/learning-status', authenticateUser, async (req: any, res) => {
    try {
      const { autonomousLearningEngine } = await import('./services/autonomous-learning-engine');
      const status = await autonomousLearningEngine.getSystemStatus();
      res.json({ success: true, status });
    } catch (error) {
      console.error('Failed to get learning status:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/ai/trigger-learning', authenticateUser, async (req: any, res) => {
    try {
      const { autonomousLearningEngine } = await import('./services/autonomous-learning-engine');
      autonomousLearningEngine.performLearningCycle().catch(console.error);
      res.json({ success: true, message: 'Learning cycle triggered' });
    } catch (error) {
      console.error('Failed to trigger learning:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/ai/self-improve', authenticateUser, async (req: any, res) => {
    try {
      const { selfImprovementSystem } = await import('./services/self-improvement-system');
      selfImprovementSystem.performSelfImprovement().catch(console.error);
      res.json({ success: true, message: 'Self-improvement cycle triggered' });
    } catch (error) {
      console.error('Failed to trigger self-improvement:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get('/api/ai/self-improvement-status', authenticateUser, async (req: any, res) => {
    try {
      const { selfImprovementSystem } = await import('./services/self-improvement-system');
      const status = await selfImprovementSystem.getSystemStatus();
      res.json({ success: true, status });
    } catch (error) {
      console.error('Failed to get self-improvement status:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/ai/enhance-capabilities', authenticateUser, async (req: any, res) => {
    try {
      const { selfImprovementSystem } = await import('./services/self-improvement-system');
      selfImprovementSystem.enhanceCapabilities().catch(console.error);
      res.json({ success: true, message: 'Capability enhancement started' });
    } catch (error) {
      console.error('Failed to enhance capabilities:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post('/api/ai/web-scan', authenticateUser, async (req: any, res) => {
    try {
      const { query, config } = req.body;
      const { webcrawlerService } = await import('./services/web-crawler-service');
      
      const results = await webcrawlerService.deepScan(query, config);
      res.json({ success: true, results });
    } catch (error) {
      console.error('Web scan failed:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // AI-Powered API Discovery endpoints
  app.post('/api/ai/discover-apis', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { query, category, features, useCase } = req.body;
      
      const { aiAPIDiscoveryService } = await import('./services/ai-api-discovery');
      const discoveredAPIs = await aiAPIDiscoveryService.searchAPIs(userId, {
        query,
        category,
        features,
        useCase,
      });
      
      res.json({ success: true, apis: discoveredAPIs });
    } catch (error) {
      console.error('API discovery error:', error);
      res.status(500).json({ success: false, message: 'Failed to discover APIs' });
    }
  });

  app.get('/api/ai/discovered-apis', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { category } = req.query;
      
      const { aiAPIDiscoveryService } = await import('./services/ai-api-discovery');
      const apis = await aiAPIDiscoveryService.getDiscoveredAPIs(userId, category as string);
      
      res.json({ success: true, apis });
    } catch (error) {
      console.error('Error fetching discovered APIs:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch discovered APIs' });
    }
  });

  app.post('/api/ai/create-account/:apiId', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { apiId } = req.params;
      
      const { aiAPIDiscoveryService } = await import('./services/ai-api-discovery');
      const result = await aiAPIDiscoveryService.attemptAccountCreation(userId, apiId);
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Account creation error:', error);
      res.status(500).json({ success: false, message: 'Failed to create account' });
    }
  });

  // Credential Scanning endpoints
  app.post('/api/ai/scan-credentials', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { environment, platforms, autoExtract } = req.body;
      
      const { credentialScannerService } = await import('./services/credential-scanner');
      const scanResult = await credentialScannerService.scanForCredentials(userId, {
        environment: environment || 'all',
        platforms,
        autoExtract: autoExtract || false,
      });
      
      res.json({ success: true, ...scanResult });
    } catch (error) {
      console.error('Credential scanning error:', error);
      res.status(500).json({ success: false, message: 'Failed to scan credentials' });
    }
  });

  app.get('/api/ai/credential-audit', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const { credentialScannerService } = await import('./services/credential-scanner');
      const audit = await credentialScannerService.performCredentialAudit(userId);
      
      res.json({ success: true, audit });
    } catch (error) {
      console.error('Credential audit error:', error);
      res.status(500).json({ success: false, message: 'Failed to perform credential audit' });
    }
  });

  // OAuth Management endpoints
  app.get('/api/oauth/providers', async (req: any, res) => {
    try {
      const { oauthManager } = await import('./services/oauth-manager');
      const providers = oauthManager.getAllProviders();
      
      res.json({ success: true, providers });
    } catch (error) {
      console.error('OAuth providers error:', error);
      res.status(500).json({ success: false, message: 'Failed to get OAuth providers' });
    }
  });

  app.post('/api/oauth/authorize/:providerId', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { providerId } = req.params;
      
      const { oauthManager } = await import('./services/oauth-manager');
      const { authUrl, state } = await oauthManager.generateAuthUrl(userId, providerId);
      
      res.json({ success: true, authUrl, state });
    } catch (error) {
      console.error('OAuth authorization error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate OAuth URL' });
    }
  });

  app.get('/api/oauth/callback/:providerId', async (req: any, res) => {
    try {
      const { providerId } = req.params;
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ success: false, message: 'Missing code or state' });
      }
      
      const { oauthManager } = await import('./services/oauth-manager');
      const result = await oauthManager.handleCallback(code as string, state as string);
      
      if (result.success) {
        // Redirect to success page or dashboard
        res.redirect('/data?oauth=success');
      } else {
        res.redirect(`/data?oauth=error&message=${encodeURIComponent(result.error || 'OAuth failed')}`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/data?oauth=error&message=Internal+error');
    }
  });

  // Cache Management
  app.delete("/api/cache", authenticateUser, async (req: any, res) => {
    try {
      const apiId = req.query.apiId as string;
      await dataAccessManager.clearCache(req.user.id, apiId);
      res.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ success: false, message: 'Failed to clear cache' });
    }
  });

  return httpServer;
}
