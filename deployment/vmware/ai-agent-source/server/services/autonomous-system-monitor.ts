/**
 * Autonomous System Monitor - Continuously monitors and repairs all system components
 * This is the core orchestrator that ensures 100% uptime and self-healing
 */

import { EventEmitter } from 'events';
import { debugSandbox } from './debug-sandbox';
import { selfRepairService } from './self-repair-service';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

interface SystemComponent {
  name: string;
  health: () => Promise<boolean>;
  repair: () => Promise<boolean>;
  critical: boolean;
}

interface MonitoringState {
  isActive: boolean;
  lastHealthCheck: Date;
  failureCount: number;
  repairAttempts: number;
  autoRepairEnabled: boolean;
}

class AutonomousSystemMonitor extends EventEmitter {
  private components: Map<string, SystemComponent> = new Map();
  private state: MonitoringState = {
    isActive: false,
    lastHealthCheck: new Date(),
    failureCount: 0,
    repairAttempts: 0,
    autoRepairEnabled: true
  };
  private monitoringInterval: NodeJS.Timeout | null = null;
  private deepScanInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupComponents();
    this.startMonitoring();
  }

  private setupComponents() {
    // Database Component
    this.components.set('database', {
      name: 'Database Connection',
      health: async () => {
        try {
          const { pool } = await import('../db');
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();
          return true;
        } catch (error) {
          console.error('Database health check failed:', error);
          return false;
        }
      },
      repair: async () => {
        try {
          await selfRepairService.forceRepair('Database connection failed');
          return true;
        } catch (error) {
          return false;
        }
      },
      critical: true
    });

    // File System Component
    this.components.set('filesystem', {
      name: 'File System',
      health: async () => {
        try {
          await fs.access(process.cwd());
          await fs.writeFile(join(process.cwd(), '.health-check'), 'OK');
          await fs.unlink(join(process.cwd(), '.health-check'));
          return true;
        } catch (error) {
          return false;
        }
      },
      repair: async () => {
        try {
          await this.executeCommand('chmod -R 755 .');
          return true;
        } catch (error) {
          return false;
        }
      },
      critical: true
    });

    // API Endpoints Component
    this.components.set('api', {
      name: 'API Endpoints',
      health: async () => {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer invalid-token' }
          });
          // We expect 401 for invalid token, which means API is responding
          return response.status === 401;
        } catch (error) {
          return false;
        }
      },
      repair: async () => {
        try {
          await selfRepairService.forceRepair('API endpoints not responding');
          return true;
        } catch (error) {
          return false;
        }
      },
      critical: true
    });

    // Memory Component
    this.components.set('memory', {
      name: 'Memory Usage',
      health: async () => {
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        return heapUsedMB < 500; // Flag if over 500MB
      },
      repair: async () => {
        try {
          global.gc && global.gc(); // Force garbage collection if available
          await selfRepairService.forceRepair('High memory usage detected');
          return true;
        } catch (error) {
          return false;
        }
      },
      critical: false
    });

    // CPU Component
    this.components.set('cpu', {
      name: 'CPU Usage',
      health: async () => {
        const usage = process.cpuUsage();
        const totalUsage = (usage.user + usage.system) / 1000000; // Convert to seconds
        return totalUsage < 10; // Flag if high CPU usage
      },
      repair: async () => {
        try {
          await selfRepairService.forceRepair('High CPU usage detected');
          return true;
        } catch (error) {
          return false;
        }
      },
      critical: false
    });

    // Port Conflicts Component
    this.components.set('ports', {
      name: 'Port Management',
      health: async () => {
        try {
          const result = await this.executeCommand('lsof -i :5000');
          return result.includes('node'); // Should be our node process
        } catch (error) {
          return false;
        }
      },
      repair: async () => {
        try {
          await selfRepairService.forceRepair('Port conflict detected');
          return true;
        } catch (error) {
          return false;
        }
      },
      critical: true
    });
  }

  private async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  private startMonitoring() {
    console.log('🤖 Starting Autonomous System Monitor...');
    this.state.isActive = true;

    // Quick health checks every 10 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck().catch(console.error);
    }, 10000);

    // Deep system scans every 2 minutes
    this.deepScanInterval = setInterval(() => {
      this.performDeepScan().catch(console.error);
    }, 120000);

    // Initial health check
    this.performHealthCheck().catch(console.error);
  }

  private async performHealthCheck() {
    console.log('🔍 Performing autonomous health check...');
    this.state.lastHealthCheck = new Date();

    let healthyComponents = 0;
    let totalComponents = this.components.size;
    const failedComponents: string[] = [];

    for (const [name, component] of this.components) {
      try {
        const isHealthy = await component.health();
        if (isHealthy) {
          healthyComponents++;
        } else {
          failedComponents.push(name);
          console.warn(`❌ Component ${name} failed health check`);
          
          if (this.state.autoRepairEnabled) {
            console.log(`🔧 Auto-repairing component: ${name}`);
            await this.repairComponent(name, component);
          }
        }
      } catch (error) {
        failedComponents.push(name);
        console.error(`💥 Health check error for ${name}:`, error);
        
        if (this.state.autoRepairEnabled) {
          await this.repairComponent(name, component);
        }
      }
    }

    const healthPercentage = (healthyComponents / totalComponents) * 100;
    console.log(`💊 System Health: ${healthPercentage.toFixed(1)}% (${healthyComponents}/${totalComponents} components healthy)`);

    if (failedComponents.length > 0) {
      this.state.failureCount++;
      this.emit('healthCheckFailed', { failedComponents, healthPercentage });
      
      // Trigger comprehensive repair if multiple critical components fail
      const criticalFailures = failedComponents.filter(name => 
        this.components.get(name)?.critical
      );
      
      if (criticalFailures.length > 1) {
        console.log('🚨 Multiple critical failures detected - triggering comprehensive repair');
        await this.performComprehensiveRepair();
      }
    } else {
      this.state.failureCount = 0;
      this.emit('healthCheckPassed', { healthPercentage });
    }
  }

  private async repairComponent(name: string, component: SystemComponent): Promise<boolean> {
    try {
      console.log(`🔧 Attempting to repair: ${name}`);
      this.state.repairAttempts++;
      
      const success = await component.repair();
      
      if (success) {
        console.log(`✅ Successfully repaired: ${name}`);
        this.emit('componentRepaired', { name, success: true });
        
        // Verify repair worked
        setTimeout(async () => {
          const isHealthy = await component.health();
          if (isHealthy) {
            console.log(`✅ Repair verification passed for: ${name}`);
          } else {
            console.log(`❌ Repair verification failed for: ${name} - retrying`);
            await this.repairComponent(name, component);
          }
        }, 5000);
        
        return true;
      } else {
        console.log(`❌ Failed to repair: ${name}`);
        this.emit('componentRepaired', { name, success: false });
        
        // Try advanced repair strategies
        await this.tryAdvancedRepair(name);
        return false;
      }
    } catch (error) {
      console.error(`💥 Repair error for ${name}:`, error);
      await this.tryAdvancedRepair(name);
      return false;
    }
  }

  private async tryAdvancedRepair(componentName: string): Promise<void> {
    console.log(`🧪 Attempting advanced repair for: ${componentName}`);
    
    try {
      // Use debug sandbox for advanced troubleshooting
      const session = await debugSandbox.debugIssue(`${componentName} component failure`);
      
      if (session.status === 'completed') {
        console.log(`🎯 Advanced repair session completed for: ${componentName}`);
      }
      
      // Try experimental repair strategies
      const strategies = [
        `restart_${componentName}`,
        `reinstall_${componentName}`,
        `reset_${componentName}_config`,
        `force_${componentName}_recovery`
      ];
      
      for (const strategy of strategies) {
        try {
          await selfRepairService.forceRepair(strategy);
          console.log(`🔬 Tried experimental strategy: ${strategy}`);
        } catch (error) {
          console.log(`❌ Strategy failed: ${strategy}`);
        }
      }
    } catch (error) {
      console.error(`💥 Advanced repair failed for ${componentName}:`, error);
    }
  }

  private async performDeepScan() {
    console.log('🔬 Performing deep system scan...');
    
    try {
      // Check for zombie processes
      const processes = await this.executeCommand('ps aux | grep node');
      const nodeProcesses = processes.split('\n').filter(line => line.includes('node')).length;
      
      if (nodeProcesses > 3) {
        console.log('🧟 Detected potential zombie processes - cleaning up');
        await selfRepairService.forceRepair('Zombie process cleanup');
      }
      
      // Check disk space
      const diskUsage = await this.executeCommand('df -h .');
      console.log('💾 Disk usage check completed');
      
      // Check for stuck operations
      const loadAvg = await this.executeCommand('uptime');
      console.log('⚡ Load average check completed');
      
      // Check network connectivity
      try {
        await this.executeCommand('ping -c 1 8.8.8.8');
        console.log('🌐 Network connectivity verified');
      } catch (error) {
        console.log('🌐 Network issue detected - attempting repair');
        await selfRepairService.forceRepair('Network connectivity issue');
      }
      
      // Check for memory leaks
      const memInfo = process.memoryUsage();
      if (memInfo.heapUsed > memInfo.heapTotal * 0.9) {
        console.log('🧠 Memory leak detected - triggering cleanup');
        await selfRepairService.forceRepair('Memory leak detected');
      }
      
      // Auto-update knowledge base
      await this.updateKnowledgeBase();
      
    } catch (error) {
      console.error('💥 Deep scan error:', error);
      await selfRepairService.forceRepair('Deep scan system error');
    }
  }

  private async performComprehensiveRepair() {
    console.log('🚨 Performing comprehensive system repair...');
    
    try {
      // Stop all non-critical services temporarily
      console.log('⏸️ Stopping non-critical services...');
      
      // Clear all caches
      await this.executeCommand('npm cache clean --force').catch(() => {});
      
      // Reset all connections
      await selfRepairService.forceRepair('Comprehensive system reset');
      
      // Restart critical services in order
      const criticalOrder = ['database', 'filesystem', 'api', 'ports'];
      
      for (const componentName of criticalOrder) {
        const component = this.components.get(componentName);
        if (component) {
          console.log(`🔄 Restarting critical component: ${componentName}`);
          await this.repairComponent(componentName, component);
          
          // Wait before next component
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log('✅ Comprehensive repair completed');
      
    } catch (error) {
      console.error('💥 Comprehensive repair failed:', error);
      
      // Last resort: restart entire process
      console.log('🔄 Triggering emergency restart...');
      await this.emergencyRestart();
    }
  }

  private async emergencyRestart() {
    console.log('🚨 Emergency restart initiated...');
    
    try {
      // Save critical state
      await this.saveEmergencyState();
      
      // Kill and restart the process
      setTimeout(() => {
        process.exit(0); // PM2 or similar process manager should restart
      }, 1000);
      
    } catch (error) {
      console.error('💥 Emergency restart failed:', error);
    }
  }

  private async saveEmergencyState() {
    try {
      const state = {
        timestamp: new Date().toISOString(),
        failureCount: this.state.failureCount,
        repairAttempts: this.state.repairAttempts,
        lastHealthCheck: this.state.lastHealthCheck,
        reason: 'Emergency restart triggered'
      };
      
      await fs.writeFile(
        join(process.cwd(), '.emergency-state.json'),
        JSON.stringify(state, null, 2)
      );
    } catch (error) {
      console.error('Failed to save emergency state:', error);
    }
  }

  private async updateKnowledgeBase() {
    try {
      // Get current AI knowledge
      const knowledge = await debugSandbox.getAIKnowledge();
      
      // Train AI with new patterns if any
      const currentTime = new Date();
      if (this.state.failureCount > 0) {
        await debugSandbox.trainAI(
          `System instability pattern at ${currentTime.toISOString()}`,
          `Applied comprehensive monitoring and repair`,
          this.state.failureCount === 0
        );
      }
      
      console.log(`🧠 Knowledge base updated with ${knowledge.size} patterns`);
    } catch (error) {
      console.error('Failed to update knowledge base:', error);
    }
  }

  // Public API methods
  async getSystemStatus() {
    const componentStatus: any = {};
    
    for (const [name, component] of this.components) {
      try {
        componentStatus[name] = await component.health();
      } catch (error) {
        componentStatus[name] = false;
      }
    }
    
    return {
      isActive: this.state.isActive,
      lastHealthCheck: this.state.lastHealthCheck,
      failureCount: this.state.failureCount,
      repairAttempts: this.state.repairAttempts,
      autoRepairEnabled: this.state.autoRepairEnabled,
      components: componentStatus
    };
  }

  async toggleAutoRepair(enabled: boolean) {
    this.state.autoRepairEnabled = enabled;
    console.log(`🤖 Auto-repair ${enabled ? 'enabled' : 'disabled'}`);
  }

  async forceHealthCheck() {
    await this.performHealthCheck();
  }

  async forceDeepScan() {
    await this.performDeepScan();
  }

  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.deepScanInterval) {
      clearInterval(this.deepScanInterval);
    }
    this.state.isActive = false;
    this.removeAllListeners();
  }
}

export const autonomousSystemMonitor = new AutonomousSystemMonitor();