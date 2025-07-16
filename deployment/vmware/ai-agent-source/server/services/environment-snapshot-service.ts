import { storage } from '../storage';
import { type EnvironmentSnapshot, type InsertEnvironmentSnapshot } from '@shared/schema';

interface ContextualSuggestion {
  id: string;
  type: 'optimization' | 'security' | 'feature' | 'cleanup' | 'migration';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  benefits: string[];
  actionItems: string[];
  relatedSnapshots?: number[];
}

interface SnapshotAnalysis {
  trends: {
    projectGrowth: number;
    fileGrowth: number;
    complexityIncrease: number;
    toolAdoption: number;
  };
  suggestions: ContextualSuggestion[];
  riskFactors: string[];
  opportunities: string[];
}

interface SnapshotData {
  projects: any[];
  files: any[];
  vms: any[];
  services: any[];
  tools: any[];
  credentials: any[];
  backgroundJobs: any[];
  metadata: {
    timestamp: string;
    version: string;
    environment: string;
  };
}

interface RestoreResult {
  success: boolean;
  restored: {
    projects: number;
    files: number;
    vms: number;
    services: number;
    tools: number;
  };
  errors: string[];
  warnings: string[];
}

class EnvironmentSnapshotService {
  async createSnapshot(userId: number, name: string, description?: string): Promise<EnvironmentSnapshot> {
    console.log(`Creating environment snapshot for user ${userId}: ${name}`);
    
    try {
      // Collect all user data
      const projects = await storage.getProjectsByUserId(userId);
      const vms = await this.getUserVMs(userId);
      const services = await storage.getServicesByUserId(userId);
      const tools = await storage.getUserTools(userId);
      const credentials = await this.getUserCredentials(userId);
      const backgroundJobs = await storage.getBackgroundJobsByUserId(userId);
      
      // Collect files for all projects
      const allFiles = [];
      for (const project of projects) {
        const projectFiles = await storage.getFilesByProjectId(project.id);
        allFiles.push(...projectFiles);
      }
      
      const snapshotData: SnapshotData = {
        projects,
        files: allFiles,
        vms,
        services,
        tools,
        credentials,
        backgroundJobs,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          environment: process.env.NODE_ENV || 'development'
        }
      };
      
      // Calculate snapshot size (approximate)
      const dataSize = JSON.stringify(snapshotData).length;
      
      const snapshotRecord: InsertEnvironmentSnapshot = {
        userId,
        name,
        description,
        snapshotData,
        fileCount: allFiles.length,
        projectCount: projects.length,
        vmCount: vms.length,
        serviceCount: services.length,
        size: dataSize
      };
      
      const snapshot = await storage.createEnvironmentSnapshot(snapshotRecord);
      console.log(`Snapshot created successfully: ${snapshot.id}`);
      
      return snapshot;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      throw new Error(`Failed to create environment snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async restoreSnapshot(userId: number, snapshotId: number): Promise<RestoreResult> {
    console.log(`Restoring environment snapshot ${snapshotId} for user ${userId}`);
    
    const result: RestoreResult = {
      success: false,
      restored: { projects: 0, files: 0, vms: 0, services: 0, tools: 0 },
      errors: [],
      warnings: []
    };
    
    try {
      const snapshot = await storage.getEnvironmentSnapshot(snapshotId);
      if (!snapshot || snapshot.userId !== userId) {
        throw new Error('Snapshot not found or access denied');
      }
      
      const data = snapshot.snapshotData as SnapshotData;
      
      // Restore projects first
      for (const project of data.projects) {
        try {
          const { id, ...projectData } = project;
          await storage.createProject({ ...projectData, userId });
          result.restored.projects++;
        } catch (error) {
          result.errors.push(`Failed to restore project ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Get the newly created projects to map old IDs to new ones
      const restoredProjects = await storage.getProjectsByUserId(userId);
      const projectIdMap = new Map();
      data.projects.forEach((oldProject, index) => {
        if (restoredProjects[index]) {
          projectIdMap.set(oldProject.id, restoredProjects[index].id);
        }
      });
      
      // Restore files with updated project IDs
      for (const file of data.files) {
        try {
          const { id, ...fileData } = file;
          const newProjectId = projectIdMap.get(file.projectId);
          if (newProjectId) {
            await storage.createFile({ ...fileData, projectId: newProjectId });
            result.restored.files++;
          } else {
            result.warnings.push(`Skipped file ${file.name}: project not found`);
          }
        } catch (error) {
          result.errors.push(`Failed to restore file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Restore VMs with updated project IDs
      for (const vm of data.vms) {
        try {
          const newProjectId = vm.projectId ? projectIdMap.get(vm.projectId) : undefined;
          await storage.createVM({ userId, projectId: newProjectId, specs: vm.specs });
          result.restored.vms++;
        } catch (error) {
          result.errors.push(`Failed to restore VM: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Restore services with updated project IDs
      for (const service of data.services) {
        try {
          const { id, ...serviceData } = service;
          const newProjectId = service.projectId ? projectIdMap.get(service.projectId) : undefined;
          await storage.createService({ ...serviceData, userId, projectId: newProjectId });
          result.restored.services++;
        } catch (error) {
          result.errors.push(`Failed to restore service ${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Restore user tools
      for (const userTool of data.tools) {
        try {
          const newProjectId = userTool.projectId ? projectIdMap.get(userTool.projectId) : undefined;
          await storage.installTool(userId, userTool.toolId, newProjectId);
          result.restored.tools++;
        } catch (error) {
          result.warnings.push(`Failed to restore tool installation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Update snapshot last restored timestamp
      await storage.updateEnvironmentSnapshot(snapshotId, { lastRestoredAt: new Date() });
      
      result.success = result.errors.length === 0;
      console.log(`Snapshot restore completed. Success: ${result.success}`);
      
      return result;
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      result.errors.push(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
  
  async listSnapshots(userId: number): Promise<EnvironmentSnapshot[]> {
    return await storage.getEnvironmentSnapshotsByUserId(userId);
  }
  
  async deleteSnapshot(userId: number, snapshotId: number): Promise<boolean> {
    const snapshot = await storage.getEnvironmentSnapshot(snapshotId);
    if (!snapshot || snapshot.userId !== userId) {
      throw new Error('Snapshot not found or access denied');
    }
    
    return await storage.deleteEnvironmentSnapshot(snapshotId);
  }
  
  async getSnapshotDetails(userId: number, snapshotId: number): Promise<EnvironmentSnapshot | null> {
    const snapshot = await storage.getEnvironmentSnapshot(snapshotId);
    if (!snapshot || snapshot.userId !== userId) {
      return null;
    }
    
    return snapshot;
  }
  
  async analyzeSnapshots(userId: number): Promise<SnapshotAnalysis> {
    console.log(`Analyzing snapshots for user ${userId}`);
    
    const snapshots = await this.listSnapshots(userId);
    const currentProjects = await storage.getProjectsByUserId(userId);
    const currentServices = await storage.getServicesByUserId(userId);
    
    // Calculate trends
    const trends = this.calculateTrends(snapshots);
    
    // Generate contextual suggestions
    const suggestions = this.generateContextualSuggestions(snapshots, currentProjects, currentServices);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(snapshots, currentProjects);
    
    // Find opportunities
    const opportunities = this.findOpportunities(snapshots, currentProjects, currentServices);
    
    return {
      trends,
      suggestions,
      riskFactors,
      opportunities
    };
  }

  private calculateTrends(snapshots: EnvironmentSnapshot[]): SnapshotAnalysis['trends'] {
    if (snapshots.length < 2) {
      return { projectGrowth: 0, fileGrowth: 0, complexityIncrease: 0, toolAdoption: 0 };
    }

    const latest = snapshots[0];
    const previous = snapshots[1];

    const projectGrowth = ((latest.projectCount - previous.projectCount) / Math.max(previous.projectCount, 1)) * 100;
    const fileGrowth = ((latest.fileCount - previous.fileCount) / Math.max(previous.fileCount, 1)) * 100;
    const complexityIncrease = ((latest.size - previous.size) / Math.max(previous.size, 1)) * 100;
    const toolAdoption = ((latest.serviceCount - previous.serviceCount) / Math.max(previous.serviceCount, 1)) * 100;

    return {
      projectGrowth: Math.round(projectGrowth * 100) / 100,
      fileGrowth: Math.round(fileGrowth * 100) / 100,
      complexityIncrease: Math.round(complexityIncrease * 100) / 100,
      toolAdoption: Math.round(toolAdoption * 100) / 100
    };
  }

  private generateContextualSuggestions(
    snapshots: EnvironmentSnapshot[], 
    currentProjects: any[], 
    currentServices: any[]
  ): ContextualSuggestion[] {
    const suggestions: ContextualSuggestion[] = [];

    // Analyze snapshot frequency
    if (snapshots.length === 0) {
      suggestions.push({
        id: 'first-snapshot',
        type: 'feature',
        title: 'Create Your First Environment Snapshot',
        description: 'Capture your current development environment to enable quick restoration and backup.',
        priority: 'high',
        estimatedTime: '2 minutes',
        benefits: [
          'Instant environment backup',
          'Quick restoration capabilities',
          'Track development progress',
          'Share environment setups'
        ],
        actionItems: [
          'Click "Create Snapshot" button',
          'Add descriptive name and description',
          'Review captured components',
          'Save snapshot for future use'
        ]
      });
    }

    // Project organization suggestions
    if (currentProjects.length > 5) {
      suggestions.push({
        id: 'project-organization',
        type: 'optimization',
        title: 'Organize Multiple Projects',
        description: 'You have many projects. Consider organizing them into workspaces or archiving inactive ones.',
        priority: 'medium',
        estimatedTime: '15 minutes',
        benefits: [
          'Improved project navigation',
          'Faster environment loading',
          'Better resource management',
          'Cleaner workspace'
        ],
        actionItems: [
          'Review project activity',
          'Archive inactive projects',
          'Group related projects',
          'Create project categories'
        ]
      });
    }

    // Security audit suggestion
    if (snapshots.length > 0) {
      const hasCredentials = snapshots.some(s => {
        const data = s.snapshotData as SnapshotData;
        return data.credentials && data.credentials.length > 0;
      });

      if (hasCredentials) {
        suggestions.push({
          id: 'security-audit',
          type: 'security',
          title: 'Review Stored Credentials',
          description: 'Audit and rotate API keys and credentials stored in your snapshots for security.',
          priority: 'high',
          estimatedTime: '10 minutes',
          benefits: [
            'Enhanced security',
            'Reduced credential exposure',
            'Compliance with best practices',
            'Peace of mind'
          ],
          actionItems: [
            'Review all stored credentials',
            'Rotate sensitive API keys',
            'Update credential permissions',
            'Remove unused credentials'
          ]
        });
      }
    }

    // Snapshot cleanup suggestion
    if (snapshots.length > 10) {
      suggestions.push({
        id: 'snapshot-cleanup',
        type: 'cleanup',
        title: 'Clean Up Old Snapshots',
        description: 'You have many snapshots. Consider removing outdated ones to free up space.',
        priority: 'low',
        estimatedTime: '5 minutes',
        benefits: [
          'Reduced storage usage',
          'Faster snapshot browsing',
          'Better organization',
          'Cost optimization'
        ],
        actionItems: [
          'Review snapshot dates',
          'Delete outdated snapshots',
          'Keep milestone snapshots',
          'Set up automatic cleanup'
        ]
      });
    }

    // Performance optimization
    const latestSnapshot = snapshots[0];
    if (latestSnapshot && latestSnapshot.size > 50000000) { // 50MB
      suggestions.push({
        id: 'performance-optimization',
        type: 'optimization',
        title: 'Optimize Environment Size',
        description: 'Your environment is quite large. Consider optimizing to improve performance.',
        priority: 'medium',
        estimatedTime: '20 minutes',
        benefits: [
          'Faster snapshot creation',
          'Quicker restoration times',
          'Reduced resource usage',
          'Better performance'
        ],
        actionItems: [
          'Review large files',
          'Remove temporary files',
          'Optimize project dependencies',
          'Clean up unused resources'
        ]
      });
    }

    return suggestions;
  }

  private identifyRiskFactors(snapshots: EnvironmentSnapshot[], currentProjects: any[]): string[] {
    const risks: string[] = [];

    if (snapshots.length === 0) {
      risks.push('No environment backups available');
    }

    if (currentProjects.length > 0 && snapshots.length === 0) {
      risks.push('Active projects without snapshot protection');
    }

    const oldestSnapshot = snapshots[snapshots.length - 1];
    if (oldestSnapshot) {
      const daysSinceSnapshot = (Date.now() - new Date(oldestSnapshot.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSnapshot > 30) {
        risks.push('No recent snapshots (>30 days old)');
      }
    }

    return risks;
  }

  private findOpportunities(snapshots: EnvironmentSnapshot[], currentProjects: any[], currentServices: any[]): string[] {
    const opportunities: string[] = [];

    if (snapshots.length > 1) {
      opportunities.push('Compare development progress across snapshots');
      opportunities.push('Analyze environment evolution patterns');
    }

    if (currentServices.length > 0) {
      opportunities.push('Share service configurations with team');
      opportunities.push('Create deployment-ready environment templates');
    }

    if (currentProjects.length > 0) {
      opportunities.push('Create project-specific snapshot templates');
      opportunities.push('Set up automated snapshot scheduling');
    }

    return opportunities;
  }

  // Helper methods
  private async getUserVMs(userId: number): Promise<any[]> {
    try {
      const vm = await storage.getVMByUserId(userId);
      return vm ? [vm] : [];
    } catch (error) {
      console.warn('Failed to get user VMs:', error);
      return [];
    }
  }
  
  private async getUserCredentials(userId: number): Promise<any[]> {
    try {
      return await storage.getApiCredentialsByUserId(userId);
    } catch (error) {
      console.warn('Failed to get user credentials:', error);
      return [];
    }
  }
}

export const environmentSnapshotService = new EnvironmentSnapshotService();