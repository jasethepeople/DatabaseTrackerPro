import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import {
  users, projects, files, vms, tools, userTools, services,
  apiCredentials, backgroundJobs, dataCache, environmentSnapshots,
  type User, type InsertUser, type Project, type InsertProject,
  type File, type InsertFile, type VM, type Tool, type InsertTool,
  type UserTool, type Service, type InsertService,
  type ApiCredential, type InsertApiCredential,
  type BackgroundJob, type InsertBackgroundJob,
  type DataCache, type InsertDataCache,
  type EnvironmentSnapshot, type InsertEnvironmentSnapshot,
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

  // API Credentials management
  getApiCredential(id: number): Promise<ApiCredential | undefined>;
  getApiCredentialsByUserId(userId: number): Promise<ApiCredential[]>;
  createApiCredential(credential: InsertApiCredential): Promise<ApiCredential>;
  updateApiCredential(id: number, credential: Partial<ApiCredential>): Promise<ApiCredential | undefined>;
  deleteApiCredential(id: number): Promise<boolean>;

  // Background Jobs management
  getBackgroundJob(id: number): Promise<BackgroundJob | undefined>;
  getBackgroundJobsByUserId(userId: number): Promise<BackgroundJob[]>;
  createBackgroundJob(job: InsertBackgroundJob): Promise<BackgroundJob>;
  updateBackgroundJob(id: number, job: Partial<BackgroundJob>): Promise<BackgroundJob | undefined>;
  deleteBackgroundJob(id: number): Promise<boolean>;

  // Data Cache management
  getDataCache(userId: number, cacheKey: string): Promise<DataCache | undefined>;
  getDataCachesByUserId(userId: number): Promise<DataCache[]>;
  createDataCache(cache: InsertDataCache): Promise<DataCache>;
  updateDataCache(id: number, cache: Partial<DataCache>): Promise<DataCache | undefined>;
  deleteDataCache(id: number): Promise<boolean>;

  // Environment Snapshot management
  getEnvironmentSnapshot(id: number): Promise<EnvironmentSnapshot | undefined>;
  getEnvironmentSnapshotsByUserId(userId: number): Promise<EnvironmentSnapshot[]>;
  createEnvironmentSnapshot(snapshot: InsertEnvironmentSnapshot): Promise<EnvironmentSnapshot>;
  updateEnvironmentSnapshot(id: number, snapshot: Partial<EnvironmentSnapshot>): Promise<EnvironmentSnapshot | undefined>;
  deleteEnvironmentSnapshot(id: number): Promise<boolean>;
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

  // API Credentials management
  async getApiCredential(id: number): Promise<ApiCredential | undefined> {
    const [credential] = await db.select().from(apiCredentials).where(eq(apiCredentials.id, id));
    return credential;
  }

  async getApiCredentialsByUserId(userId: number): Promise<ApiCredential[]> {
    return await db.select().from(apiCredentials).where(eq(apiCredentials.userId, userId));
  }

  async createApiCredential(credential: InsertApiCredential): Promise<ApiCredential> {
    const [created] = await db.insert(apiCredentials).values(credential).returning();
    return created;
  }

  async updateApiCredential(id: number, credential: Partial<ApiCredential>): Promise<ApiCredential | undefined> {
    const [updated] = await db.update(apiCredentials)
      .set({ ...credential, updatedAt: new Date() })
      .where(eq(apiCredentials.id, id))
      .returning();
    return updated;
  }

  async deleteApiCredential(id: number): Promise<boolean> {
    const result = await db.delete(apiCredentials).where(eq(apiCredentials.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Background Jobs management
  async getBackgroundJob(id: number): Promise<BackgroundJob | undefined> {
    const [job] = await db.select().from(backgroundJobs).where(eq(backgroundJobs.id, id));
    return job;
  }

  async getBackgroundJobsByUserId(userId: number): Promise<BackgroundJob[]> {
    return await db.select().from(backgroundJobs).where(eq(backgroundJobs.userId, userId));
  }

  async createBackgroundJob(job: InsertBackgroundJob): Promise<BackgroundJob> {
    const [created] = await db.insert(backgroundJobs).values({
      ...job,
      nextRun: new Date(Date.now() + 60000),
    }).returning();
    return created;
  }

  async updateBackgroundJob(id: number, job: Partial<BackgroundJob>): Promise<BackgroundJob | undefined> {
    const [updated] = await db.update(backgroundJobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(backgroundJobs.id, id))
      .returning();
    return updated;
  }

  async deleteBackgroundJob(id: number): Promise<boolean> {
    const result = await db.delete(backgroundJobs).where(eq(backgroundJobs.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Data Cache management
  async getDataCache(userId: number, cacheKey: string): Promise<DataCache | undefined> {
    const [cache] = await db.select().from(dataCache)
      .where(and(eq(dataCache.userId, userId), eq(dataCache.cacheKey, cacheKey)));
    return cache;
  }

  async getDataCachesByUserId(userId: number): Promise<DataCache[]> {
    return await db.select().from(dataCache).where(eq(dataCache.userId, userId));
  }

  async createDataCache(cache: InsertDataCache): Promise<DataCache> {
    const [created] = await db.insert(dataCache).values(cache).returning();
    return created;
  }

  async updateDataCache(id: number, cache: Partial<DataCache>): Promise<DataCache | undefined> {
    const [updated] = await db.update(dataCache)
      .set(cache)
      .where(eq(dataCache.id, id))
      .returning();
    return updated;
  }

  async deleteDataCache(id: number): Promise<boolean> {
    const result = await db.delete(dataCache).where(eq(dataCache.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Environment Snapshot management
  async getEnvironmentSnapshot(id: number): Promise<EnvironmentSnapshot | undefined> {
    try {
      const [snapshot] = await db.select().from(environmentSnapshots).where(eq(environmentSnapshots.id, id));
      return snapshot;
    } catch (error) {
      console.error('Error getting environment snapshot:', error);
      return undefined;
    }
  }

  async getEnvironmentSnapshotsByUserId(userId: number): Promise<EnvironmentSnapshot[]> {
    try {
      return await db.select().from(environmentSnapshots).where(eq(environmentSnapshots.userId, userId));
    } catch (error) {
      console.error('Error getting environment snapshots by user ID:', error);
      return [];
    }
  }

  async createEnvironmentSnapshot(snapshot: InsertEnvironmentSnapshot): Promise<EnvironmentSnapshot> {
    try {
      const [created] = await db.insert(environmentSnapshots).values(snapshot).returning();
      return created;
    } catch (error) {
      console.error('Error creating environment snapshot:', error);
      throw error;
    }
  }

  async updateEnvironmentSnapshot(id: number, snapshot: Partial<EnvironmentSnapshot>): Promise<EnvironmentSnapshot | undefined> {
    try {
      const [updated] = await db.update(environmentSnapshots)
        .set(snapshot)
        .where(eq(environmentSnapshots.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating environment snapshot:', error);
      return undefined;
    }
  }

  async deleteEnvironmentSnapshot(id: number): Promise<boolean> {
    try {
      const result = await db.delete(environmentSnapshots).where(eq(environmentSnapshots.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting environment snapshot:', error);
      return false;
    }
  }
}

export const storage = new DbStorage();
