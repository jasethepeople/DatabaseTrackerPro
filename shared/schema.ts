import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  vmId: text("vm_id"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  path: text("path").notNull(),
  content: text("content"),
  isDirectory: boolean("is_directory").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vms = pgTable("vms", {
  id: serial("id").primaryKey(),
  vmId: text("vm_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  status: text("status").notNull().default("stopped"), // running, stopped, starting, stopping
  specs: jsonb("specs"), // CPU, RAM, storage specs
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  version: text("version"),
  installScript: text("install_script"),
  dockerImage: text("docker_image"),
  ports: jsonb("ports"), // Port mappings for containers
  environment: jsonb("environment"), // Environment variables
  volumes: jsonb("volumes"), // Volume mappings
  isOfficial: boolean("is_official").default(false),
  rating: integer("rating").default(0),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userTools = pgTable("user_tools", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  toolId: integer("tool_id").notNull(),
  projectId: integer("project_id"),
  status: text("status").notNull().default("installed"), // installed, installing, failed
  config: jsonb("config"),
  installedAt: timestamp("installed_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  type: text("type").notNull(), // docker, systemd, custom
  status: text("status").notNull().default("stopped"),
  port: integer("port"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  projectId: true,
  path: true,
  content: true,
  isDirectory: true,
});

export const insertToolSchema = createInsertSchema(tools).pick({
  name: true,
  displayName: true,
  description: true,
  category: true,
  version: true,
  installScript: true,
  dockerImage: true,
  ports: true,
  environment: true,
  volumes: true,
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  projectId: true,
  type: true,
  port: true,
  config: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type VM = typeof vms.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type UserTool = typeof userTools.$inferSelect;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

// API Credentials and Permissions Management
export const apiCredentials = pgTable("api_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  apiId: text("api_id").notNull(), // matches external-apis.ts ids
  name: text("name").notNull(),
  encryptedKey: text("encrypted_key").notNull(),
  encryptedSecret: text("encrypted_secret"), // for OAuth apps
  isActive: boolean("is_active").default(true),
  permissions: jsonb("permissions").default({}), // granular permissions
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const backgroundJobs = pgTable("background_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  jobType: text("job_type").notNull(), // 'api_sync', 'data_poll', 'webhook'
  apiId: text("api_id").notNull(),
  endpoint: text("endpoint").notNull(),
  schedule: text("schedule").notNull(), // cron expression
  isActive: boolean("is_active").default(true),
  config: jsonb("config").default({}),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  status: text("status").default("pending"),
  errorCount: integer("error_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dataCache = pgTable("data_cache", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cacheKey: text("cache_key").notNull(),
  apiId: text("api_id").notNull(),
  endpoint: text("endpoint").notNull(),
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiPermissions = pgTable("api_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  apiId: text("api_id").notNull(),
  permission: text("permission").notNull(), // 'read', 'write', 'admin'
  scope: text("scope").notNull(), // specific endpoint or data type
  isGranted: boolean("is_granted").default(false),
  grantedAt: timestamp("granted_at"),
  grantedBy: integer("granted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertApiCredentialSchema = createInsertSchema(apiCredentials).omit({
  id: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBackgroundJobSchema = createInsertSchema(backgroundJobs).omit({
  id: true,
  lastRun: true,
  nextRun: true,
  status: true,
  errorCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataCacheSchema = createInsertSchema(dataCache).omit({
  id: true,
  createdAt: true,
});

export const insertApiPermissionSchema = createInsertSchema(apiPermissions).omit({
  id: true,
  grantedAt: true,
  grantedBy: true,
  createdAt: true,
});

// Type exports for new tables
export type ApiCredential = typeof apiCredentials.$inferSelect;
export type InsertApiCredential = z.infer<typeof insertApiCredentialSchema>;
export type BackgroundJob = typeof backgroundJobs.$inferSelect;
export type InsertBackgroundJob = z.infer<typeof insertBackgroundJobSchema>;
export type DataCache = typeof dataCache.$inferSelect;
export type InsertDataCache = z.infer<typeof insertDataCacheSchema>;
export type ApiPermission = typeof apiPermissions.$inferSelect;
export type InsertApiPermission = z.infer<typeof insertApiPermissionSchema>;
