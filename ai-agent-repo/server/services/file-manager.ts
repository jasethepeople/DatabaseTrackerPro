import { storage } from "../storage";
import type { File, InsertFile } from "@shared/schema";

export interface FileManager {
  getProjectFiles(projectId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(fileId: number, content: string): Promise<File>;
  deleteFile(fileId: number): Promise<void>;
  createDirectory(projectId: number, path: string): Promise<File>;
  moveFile(fileId: number, newPath: string): Promise<File>;
}

class FileManagerImpl implements FileManager {
  async getProjectFiles(projectId: number): Promise<File[]> {
    return await storage.getFilesByProjectId(projectId);
  }

  async createFile(file: InsertFile): Promise<File> {
    // Check if file already exists
    const existing = await storage.getFileByPath(file.projectId, file.path);
    if (existing) {
      throw new Error("File already exists");
    }

    return await storage.createFile(file);
  }

  async updateFile(fileId: number, content: string): Promise<File> {
    const updated = await storage.updateFile(fileId, { content });
    if (!updated) {
      throw new Error("File not found");
    }
    return updated;
  }

  async deleteFile(fileId: number): Promise<void> {
    const success = await storage.deleteFile(fileId);
    if (!success) {
      throw new Error("File not found");
    }
  }

  async createDirectory(projectId: number, path: string): Promise<File> {
    return await storage.createFile({
      projectId,
      path,
      isDirectory: true,
      content: ""
    });
  }

  async moveFile(fileId: number, newPath: string): Promise<File> {
    const updated = await storage.updateFile(fileId, { path: newPath });
    if (!updated) {
      throw new Error("File not found");
    }
    return updated;
  }
}

export const fileManager = new FileManagerImpl();
