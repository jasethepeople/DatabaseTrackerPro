import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
