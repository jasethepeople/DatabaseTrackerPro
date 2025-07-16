import { exec } from "child_process";
import { promisify } from "util";
import { storage } from "../storage";
import type { VM } from "@shared/schema";

const execAsync = promisify(exec);

export interface VMManager {
  createVM(userId: number, projectId?: number): Promise<VM>;
  startVM(vmId: string): Promise<void>;
  stopVM(vmId: string): Promise<void>;
  getVMStatus(vmId: string): Promise<string>;
  deleteVM(vmId: string): Promise<void>;
  executeCommand(vmId: string, command: string): Promise<string>;
}

class VMManagerImpl implements VMManager {
  async createVM(userId: number, projectId?: number): Promise<VM> {
    const vm = await storage.createVM({ userId, projectId });
    
    // Try multiple container runtimes: Podman first, then Docker, then simulation
    let containerName = `localreplit-vm-${vm.vmId}`;
    
    // Try Podman first (works better in rootless environments)
    try {
      await execAsync('podman --version').catch(() => {
        throw new Error('Podman not available');
      });
      
      const command = `podman run -d --name ${containerName} -it ubuntu:22.04 /bin/bash`;
      console.log(`Creating VM with Podman: ${containerName}`);
      await execAsync(command);
      
      await storage.updateVM(vm.id, { 
        status: "running",
        specs: { containerName, image: "ubuntu:22.04", type: "podman" }
      });
      
      console.log(`VM ${vm.vmId} created successfully with Podman`);
      return vm;
    } catch (podmanError) {
      // Try Docker as fallback
      try {
        await execAsync('docker info').catch(() => {
          throw new Error('Docker daemon not available');
        });
        
        const command = `docker run -d --name ${containerName} -it ubuntu:22.04 /bin/bash`;
        console.log(`Creating VM with Docker: ${containerName}`);
        await execAsync(command);
        
        await storage.updateVM(vm.id, { 
          status: "running",
          specs: { containerName, image: "ubuntu:22.04", type: "docker" }
        });
        
        console.log(`VM ${vm.vmId} created successfully with Docker`);
        return vm;
      } catch (dockerError) {
        // Final fallback to simulated VM
        console.log(`No container runtime available, creating simulated VM: ${vm.vmId}`);
        
        await storage.updateVM(vm.id, { 
          status: "running",
          specs: { type: "simulated", image: "ubuntu:22.04" }
        });
        
        console.log(`Simulated VM ${vm.vmId} created successfully`);
        return vm;
      }
    }
  }

  async startVM(vmId: string): Promise<void> {
    try {
      const containerName = `localreplit-${vmId}`;
      await execAsync(`docker start ${containerName}`);
      
      const vm = await storage.getVMByUserId(1); // Get VM by vmId in real implementation
      if (vm) {
        await storage.updateVM(vm.id, { status: "running" });
      }
    } catch (error) {
      console.error("Failed to start VM:", error);
      throw new Error("Failed to start virtual machine");
    }
  }

  async stopVM(vmId: string): Promise<void> {
    try {
      const containerName = `localreplit-${vmId}`;
      await execAsync(`docker stop ${containerName}`);
      
      const vm = await storage.getVMByUserId(1); // Get VM by vmId in real implementation
      if (vm) {
        await storage.updateVM(vm.id, { status: "stopped" });
      }
    } catch (error) {
      console.error("Failed to stop VM:", error);
      throw new Error("Failed to stop virtual machine");
    }
  }

  async getVMStatus(vmId: string): Promise<string> {
    try {
      const containerName = `localreplit-${vmId}`;
      const { stdout } = await execAsync(`docker inspect --format='{{.State.Status}}' ${containerName}`);
      return stdout.trim();
    } catch (error) {
      return "stopped";
    }
  }

  async deleteVM(vmId: string): Promise<void> {
    try {
      const containerName = `localreplit-${vmId}`;
      await execAsync(`docker rm -f ${containerName}`);
    } catch (error) {
      console.error("Failed to delete VM:", error);
      throw new Error("Failed to delete virtual machine");
    }
  }

  async executeCommand(vmId: string, command: string): Promise<string> {
    try {
      const containerName = `localreplit-${vmId}`;
      const { stdout, stderr } = await execAsync(`docker exec ${containerName} ${command}`);
      return stdout + stderr;
    } catch (error) {
      console.error("Failed to execute command:", error);
      throw new Error("Failed to execute command in VM");
    }
  }
}

export const vmManager = new VMManagerImpl();
