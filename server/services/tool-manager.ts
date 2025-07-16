import { exec } from "child_process";
import { promisify } from "util";
import { storage } from "../storage";
import type { Tool, InsertTool } from "@shared/schema";

const execAsync = promisify(exec);

export interface ToolManager {
  installTool(userId: number, toolId: number, projectId?: number): Promise<void>;
  uninstallTool(userId: number, toolId: number): Promise<void>;
  getAvailableTools(): Promise<Tool[]>;
  createTool(tool: InsertTool): Promise<Tool>;
  searchTools(query: string): Promise<Tool[]>;
}

class ToolManagerImpl implements ToolManager {
  async installTool(userId: number, toolId: number, projectId?: number): Promise<void> {
    const tool = await storage.getTool(toolId);
    if (!tool) {
      throw new Error("Tool not found");
    }

    // Create user tool entry
    const userTool = await storage.installTool(userId, toolId, projectId);

    try {
      if (tool.dockerImage) {
        // Install as Docker container with proper configuration
        const containerName = `tool-${tool.name}-${userId}`;
        let dockerCommand = `docker run -d --name ${containerName}`;
        
        // Add port mappings if specified
        if (tool.ports && typeof tool.ports === 'object') {
          for (const [hostPort, containerPort] of Object.entries(tool.ports)) {
            dockerCommand += ` -p ${hostPort}:${containerPort}`;
          }
        }
        
        // Add environment variables if specified
        if (tool.environment && typeof tool.environment === 'object') {
          for (const [key, value] of Object.entries(tool.environment)) {
            dockerCommand += ` -e ${key}="${value}"`;
          }
        }
        
        // Add volume mappings if specified
        if (tool.volumes && typeof tool.volumes === 'object') {
          for (const [hostPath, containerPath] of Object.entries(tool.volumes)) {
            dockerCommand += ` -v ${hostPath}:${containerPath}`;
          }
        }
        
        dockerCommand += ` ${tool.dockerImage}`;
        
        await execAsync(dockerCommand);
        
        // For n8n, wait a moment for it to start up
        if (tool.name === 'n8n') {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } else if (tool.installScript) {
        // Run installation script
        await execAsync(tool.installScript);
      }

      // Update status to installed
      // In real implementation, update userTool status
    } catch (error) {
      console.error("Failed to install tool:", error);
      throw new Error(`Failed to install ${tool.displayName}`);
    }
  }

  async uninstallTool(userId: number, toolId: number): Promise<void> {
    const tool = await storage.getTool(toolId);
    if (!tool) {
      throw new Error("Tool not found");
    }

    try {
      if (tool.dockerImage) {
        const containerName = `tool-${tool.name}-${userId}`;
        await execAsync(`docker rm -f ${containerName}`);
      }
    } catch (error) {
      console.error("Failed to uninstall tool:", error);
      throw new Error(`Failed to uninstall ${tool.displayName}`);
    }
  }

  async getAvailableTools(): Promise<Tool[]> {
    return await storage.getTools();
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    return await storage.createTool(tool);
  }

  async searchTools(query: string): Promise<Tool[]> {
    const tools = await storage.getTools();
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.displayName.toLowerCase().includes(query.toLowerCase()) ||
      tool.description?.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const toolManager = new ToolManagerImpl();
