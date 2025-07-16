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
        // Install as Docker container
        const containerName = `tool-${tool.name}-${userId}`;
        const command = `docker run -d --name ${containerName} ${tool.dockerImage}`;
        await execAsync(command);
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
