import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import {
  users, projects, files, vms, tools, userTools, services,
  type User, type InsertUser, type Project, type InsertProject,
  type File, type InsertFile, type VM, type Tool, type InsertTool,
  type UserTool, type Service, type InsertService
} from "@shared/schema";

// Database connection with error handling - using HTTP mode for better reliability
const createDbConnection = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const sql = neon(connectionString);
  return drizzle(sql);
};

const db = createDbConnection();

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project management
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject & { userId: number }): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // File management
  getFile(id: number): Promise<File | undefined>;
  getFilesByProjectId(projectId: number): Promise<File[]>;
  getFileByPath(projectId: number, path: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<File>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;

  // VM management
  getVM(id: number): Promise<VM | undefined>;
  getVMByUserId(userId: number): Promise<VM | undefined>;
  getVMByProjectId(projectId: number): Promise<VM | undefined>;
  createVM(vm: { userId: number; projectId?: number; specs?: any }): Promise<VM>;
  updateVM(id: number, vm: Partial<VM>): Promise<VM | undefined>;

  // Tool management
  getTool(id: number): Promise<Tool | undefined>;
  getTools(): Promise<Tool[]>;
  getToolsByCategory(category: string): Promise<Tool[]>;
  createTool(tool: InsertTool): Promise<Tool>;
  getUserTools(userId: number): Promise<UserTool[]>;
  installTool(userId: number, toolId: number, projectId?: number): Promise<UserTool>;

  // Service management
  getService(id: number): Promise<Service | undefined>;
  getServicesByUserId(userId: number): Promise<Service[]>;
  getServicesByProjectId(projectId: number): Promise<Service[]>;
  createService(service: InsertService & { userId: number }): Promise<Service>;
  updateService(id: number, service: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(project: InsertProject & { userId: number }): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const result = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return result[0];
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getFile(id: number): Promise<File | undefined> {
    const result = await db.select().from(files).where(eq(files.id, id));
    return result[0];
  }

  async getFilesByProjectId(projectId: number): Promise<File[]> {
    return await db.select().from(files).where(eq(files.projectId, projectId));
  }

  async getFileByPath(projectId: number, path: string): Promise<File | undefined> {
    const result = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, path)));
    return result[0];
  }

  async createFile(file: InsertFile): Promise<File> {
    const result = await db.insert(files).values(file).returning();
    return result[0];
  }

  async updateFile(id: number, file: Partial<File>): Promise<File | undefined> {
    const result = await db.update(files).set({ ...file, updatedAt: new Date() })
      .where(eq(files.id, id)).returning();
    return result[0];
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getVM(id: number): Promise<VM | undefined> {
    const result = await db.select().from(vms).where(eq(vms.id, id));
    return result[0];
  }

  async getVMByUserId(userId: number): Promise<VM | undefined> {
    const result = await db.select().from(vms).where(eq(vms.userId, userId));
    return result[0];
  }

  async getVMByProjectId(projectId: number): Promise<VM | undefined> {
    const result = await db.select().from(vms).where(eq(vms.projectId, projectId));
    return result[0];
  }

  async createVM(vm: { userId: number; projectId?: number; specs?: any }): Promise<VM> {
    const vmId = `vm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await db.insert(vms).values({
      vmId,
      userId: vm.userId,
      projectId: vm.projectId,
      specs: vm.specs || { cpu: 2, memory: 4096, storage: 20480 },
      status: "stopped"
    }).returning();
    return result[0];
  }

  async updateVM(id: number, vm: Partial<VM>): Promise<VM | undefined> {
    const result = await db.update(vms).set(vm).where(eq(vms.id, id)).returning();
    return result[0];
  }

  async getTool(id: number): Promise<Tool | undefined> {
    const result = await db.select().from(tools).where(eq(tools.id, id));
    return result[0];
  }

  async getTools(): Promise<Tool[]> {
    try {
      const result = await db.select().from(tools);
      console.log(`Storage: Found ${result.length} tools`);
      return result;
    } catch (error) {
      console.error('Storage: Error fetching tools:', error);
      throw error;
    }
  }

  async getToolsByCategory(category: string): Promise<Tool[]> {
    return await db.select().from(tools).where(eq(tools.category, category));
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const result = await db.insert(tools).values(tool).returning();
    return result[0];
  }

  async getUserTools(userId: number): Promise<UserTool[]> {
    return await db.select().from(userTools).where(eq(userTools.userId, userId));
  }

  async installTool(userId: number, toolId: number, projectId?: number): Promise<UserTool> {
    const result = await db.insert(userTools).values({
      userId,
      toolId,
      projectId,
      status: "installing"
    }).returning();
    return result[0];
  }

  async getService(id: number): Promise<Service | undefined> {
    const result = await db.select().from(services).where(eq(services.id, id));
    return result[0];
  }

  async getServicesByUserId(userId: number): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.userId, userId));
  }

  async getServicesByProjectId(projectId: number): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.projectId, projectId));
  }

  async createService(service: InsertService & { userId: number }): Promise<Service> {
    const result = await db.insert(services).values(service).returning();
    return result[0];
  }

  async updateService(id: number, service: Partial<Service>): Promise<Service | undefined> {
    const result = await db.update(services).set(service).where(eq(services.id, id)).returning();
    return result[0];
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DbStorage();
