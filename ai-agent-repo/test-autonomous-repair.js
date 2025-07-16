/**
 * Autonomous Self-Repair System Test
 * This script systematically breaks parts of the system and verifies autonomous repair
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class AutonomousRepairTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.authToken = null;
    this.testResults = [];
    this.breakageActions = [];
    this.repairVerifications = [];
  }

  async login() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password' })
      });
      
      const data = await response.json();
      this.authToken = data.token;
      console.log('✅ Authenticated successfully');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }
  }

  async makeRequest(path, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, options);
      return await response.json();
    } catch (error) {
      console.error(`Request failed for ${path}:`, error);
      return { error: error.message };
    }
  }

  async runAutonomousBreakageTests() {
    console.log('\n🚨 STARTING AUTONOMOUS SELF-REPAIR TESTING');
    console.log('=========================================');
    
    // Test 1: Break file imports by corrupting a service file
    await this.testBreakAndRepair('File Import Corruption', async () => {
      await this.corruptServiceFile();
    }, async () => {
      return await this.verifyServiceWorking();
    });

    // Test 2: Create memory leaks and high CPU usage
    await this.testBreakAndRepair('Memory/CPU Stress Test', async () => {
      await this.createMemoryLeak();
    }, async () => {
      return await this.verifySystemPerformance();
    });

    // Test 3: Break database connections
    await this.testBreakAndRepair('Database Connection Failure', async () => {
      await this.breakDatabaseConnection();
    }, async () => {
      return await this.verifyDatabaseWorking();
    });

    // Test 4: Corrupt API endpoints
    await this.testBreakAndRepair('API Endpoint Corruption', async () => {
      await this.corruptApiEndpoints();
    }, async () => {
      return await this.verifyApiEndpoints();
    });

    // Test 5: File system permission issues
    await this.testBreakAndRepair('File System Permissions', async () => {
      await this.breakFilePermissions();
    }, async () => {
      return await this.verifyFileSystem();
    });

    // Test 6: Port conflicts and networking issues
    await this.testBreakAndRepair('Port/Network Conflicts', async () => {
      await this.createPortConflicts();
    }, async () => {
      return await this.verifyNetworking();
    });

    // Test 7: Syntax errors in critical files
    await this.testBreakAndRepair('Syntax Error Injection', async () => {
      await this.injectSyntaxErrors();
    }, async () => {
      return await this.verifySyntaxIntegrity();
    });

    // Test 8: Remove critical dependencies
    await this.testBreakAndRepair('Dependency Removal', async () => {
      await this.removeCriticalDependencies();
    }, async () => {
      return await this.verifyDependencies();
    });

    await this.printTestResults();
  }

  async testBreakAndRepair(testName, breakFunction, verifyFunction) {
    console.log(`\n🔧 Testing: ${testName}`);
    console.log('-'.repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Step 1: Break the system
      console.log('💥 Breaking system component...');
      await breakFunction();
      
      // Step 2: Wait for autonomous detection and repair
      console.log('⏳ Waiting for autonomous detection and repair...');
      await this.waitForRepair(30000); // Wait up to 30 seconds
      
      // Step 3: Verify repair worked
      console.log('🔍 Verifying autonomous repair...');
      const repairSuccess = await verifyFunction();
      
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        test: testName,
        success: repairSuccess,
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      if (repairSuccess) {
        console.log(`✅ ${testName}: AUTONOMOUS REPAIR SUCCESSFUL (${duration}ms)`);
      } else {
        console.log(`❌ ${testName}: AUTONOMOUS REPAIR FAILED (${duration}ms)`);
      }
      
    } catch (error) {
      console.error(`💥 ${testName}: Test error - ${error.message}`);
      this.testResults.push({
        test: testName,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async waitForRepair(maxWaitTime) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      // Check if system is responding
      try {
        const health = await this.makeRequest('/api/repair/system-status');
        if (health.success) {
          console.log('🤖 System monitor detected and is repairing...');
        }
      } catch (error) {
        // Expected during repair
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
    }
  }

  // Breakage Functions
  async corruptServiceFile() {
    try {
      const filePath = 'server/services/debug-sandbox.ts';
      const originalContent = await fs.readFile(filePath, 'utf8');
      
      // Save backup
      await fs.writeFile(`${filePath}.backup`, originalContent);
      
      // Corrupt the file
      const corruptedContent = originalContent.replace(
        'export class DebugSandbox',
        'export class DebugSandbox_CORRUPTED_INTENTIONALLY'
      );
      
      await fs.writeFile(filePath, corruptedContent);
      console.log('💥 Corrupted debug sandbox service file');
      
      this.breakageActions.push({
        action: 'corrupt_service_file',
        file: filePath,
        hasBackup: true
      });
    } catch (error) {
      console.error('Failed to corrupt service file:', error);
    }
  }

  async createMemoryLeak() {
    try {
      // Create a memory-intensive operation
      await this.makeRequest('/api/debug/debug-issue', 'POST', {
        issue: 'Memory stress test - creating large data structures'
      });
      
      // Simulate memory leak by creating large arrays
      const leakScript = `
        console.log('Creating memory leak...');
        const bigArray = [];
        for (let i = 0; i < 1000000; i++) {
          bigArray.push(new Array(1000).fill('memory-leak-data'));
        }
        global.memoryLeak = bigArray;
      `;
      
      await execAsync(`node -e "${leakScript}"`).catch(() => {});
      console.log('💥 Created memory leak and CPU stress');
    } catch (error) {
      console.error('Failed to create memory leak:', error);
    }
  }

  async breakDatabaseConnection() {
    try {
      // Try to corrupt database environment variables temporarily
      const envScript = `
        const fs = require('fs');
        const envPath = '.env';
        try {
          const envContent = fs.readFileSync(envPath, 'utf8');
          fs.writeFileSync(envPath + '.backup', envContent);
          const corruptedEnv = envContent.replace(/DATABASE_URL=.*/, 'DATABASE_URL=postgresql://invalid:invalid@invalid:5432/invalid');
          fs.writeFileSync(envPath, corruptedEnv);
          console.log('Database connection corrupted');
        } catch (error) {
          console.log('No .env file to corrupt');
        }
      `;
      
      await execAsync(`node -e "${envScript}"`).catch(() => {});
      console.log('💥 Corrupted database connection');
      
      this.breakageActions.push({
        action: 'corrupt_database',
        hasBackup: true
      });
    } catch (error) {
      console.error('Failed to break database:', error);
    }
  }

  async corruptApiEndpoints() {
    try {
      // Temporary corruption of routes file
      const routesPath = 'server/routes.ts';
      const originalContent = await fs.readFile(routesPath, 'utf8');
      
      await fs.writeFile(`${routesPath}.backup`, originalContent);
      
      // Introduce syntax error
      const corruptedContent = originalContent.replace(
        'app.get(\'/api/repair/system-status\'',
        'app.get(\'/api/repair/system-status\' // SYNTAX ERROR INJECTED'
      );
      
      await fs.writeFile(routesPath, corruptedContent);
      console.log('💥 Corrupted API endpoints with syntax error');
      
      this.breakageActions.push({
        action: 'corrupt_api_endpoints',
        file: routesPath,
        hasBackup: true
      });
    } catch (error) {
      console.error('Failed to corrupt API endpoints:', error);
    }
  }

  async breakFilePermissions() {
    try {
      // Make critical files unreadable temporarily
      await execAsync('chmod 000 package.json').catch(() => {});
      await execAsync('chmod 000 tsconfig.json').catch(() => {});
      console.log('💥 Removed file permissions');
      
      this.breakageActions.push({
        action: 'break_file_permissions'
      });
    } catch (error) {
      console.error('Failed to break file permissions:', error);
    }
  }

  async createPortConflicts() {
    try {
      // Try to start another server on the same port
      const conflictScript = `
        const http = require('http');
        const server = http.createServer();
        server.listen(5000, () => {
          console.log('Port conflict created');
          setTimeout(() => server.close(), 10000);
        });
      `;
      
      execAsync(`node -e "${conflictScript}"`).catch(() => {});
      console.log('💥 Created port conflict');
    } catch (error) {
      console.error('Failed to create port conflict:', error);
    }
  }

  async injectSyntaxErrors() {
    try {
      const targetFile = 'server/index.ts';
      const originalContent = await fs.readFile(targetFile, 'utf8');
      
      await fs.writeFile(`${targetFile}.backup`, originalContent);
      
      // Inject syntax error
      const corruptedContent = originalContent.replace(
        'const app = express();',
        'const app = express( // SYNTAX ERROR;'
      );
      
      await fs.writeFile(targetFile, corruptedContent);
      console.log('💥 Injected syntax error in main server file');
      
      this.breakageActions.push({
        action: 'inject_syntax_error',
        file: targetFile,
        hasBackup: true
      });
    } catch (error) {
      console.error('Failed to inject syntax error:', error);
    }
  }

  async removeCriticalDependencies() {
    try {
      // Temporarily corrupt package.json
      const packagePath = 'package.json';
      const originalContent = await fs.readFile(packagePath, 'utf8');
      
      await fs.writeFile(`${packagePath}.backup`, originalContent);
      
      const packageData = JSON.parse(originalContent);
      delete packageData.dependencies.express;
      delete packageData.dependencies.react;
      
      await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
      console.log('💥 Removed critical dependencies');
      
      this.breakageActions.push({
        action: 'remove_dependencies',
        file: packagePath,
        hasBackup: true
      });
    } catch (error) {
      console.error('Failed to remove dependencies:', error);
    }
  }

  // Verification Functions
  async verifyServiceWorking() {
    try {
      const response = await this.makeRequest('/api/debug/sessions');
      return response.success === true;
    } catch (error) {
      return false;
    }
  }

  async verifySystemPerformance() {
    try {
      const status = await this.makeRequest('/api/repair/system-status');
      return status.success === true;
    } catch (error) {
      return false;
    }
  }

  async verifyDatabaseWorking() {
    try {
      const response = await this.makeRequest('/api/auth/me');
      return response.id !== undefined; // Should return user data
    } catch (error) {
      return false;
    }
  }

  async verifyApiEndpoints() {
    try {
      const response = await this.makeRequest('/api/repair/system-status');
      return response.success === true;
    } catch (error) {
      return false;
    }
  }

  async verifyFileSystem() {
    try {
      await fs.access('package.json');
      await fs.access('tsconfig.json');
      return true;
    } catch (error) {
      return false;
    }
  }

  async verifyNetworking() {
    try {
      const response = await fetch(this.baseUrl);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async verifySyntaxIntegrity() {
    try {
      const response = await this.makeRequest('/api/repair/system-status');
      return response.success === true;
    } catch (error) {
      return false;
    }
  }

  async verifyDependencies() {
    try {
      const packageData = JSON.parse(await fs.readFile('package.json', 'utf8'));
      return packageData.dependencies && packageData.dependencies.express && packageData.dependencies.react;
    } catch (error) {
      return false;
    }
  }

  // Cleanup and restore
  async restoreAllBackups() {
    console.log('\n🔄 Restoring all backups...');
    
    for (const action of this.breakageActions) {
      try {
        if (action.hasBackup && action.file) {
          const backupPath = `${action.file}.backup`;
          await fs.copyFile(backupPath, action.file);
          await fs.unlink(backupPath);
          console.log(`✅ Restored ${action.file}`);
        }
        
        if (action.action === 'break_file_permissions') {
          await execAsync('chmod 644 package.json').catch(() => {});
          await execAsync('chmod 644 tsconfig.json').catch(() => {});
          console.log('✅ Restored file permissions');
        }
      } catch (error) {
        console.error(`❌ Failed to restore ${action.file}:`, error);
      }
    }
  }

  async printTestResults() {
    console.log('\n📊 AUTONOMOUS SELF-REPAIR TEST RESULTS');
    console.log('=====================================');
    
    const successfulTests = this.testResults.filter(t => t.success);
    const successRate = (successfulTests.length / this.testResults.length) * 100;
    
    console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${successfulTests.length}/${this.testResults.length})`);
    
    console.log('\n📋 Individual Test Results:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = result.duration ? `${result.duration}ms` : 'N/A';
      console.log(`${status} ${result.test} (${duration})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    if (successRate >= 80) {
      console.log('\n🎉 AUTONOMOUS SELF-REPAIR SYSTEM: EXCELLENT PERFORMANCE');
      console.log('✅ System demonstrates strong autonomous recovery capabilities');
    } else if (successRate >= 60) {
      console.log('\n⚠️  AUTONOMOUS SELF-REPAIR SYSTEM: MODERATE PERFORMANCE');
      console.log('🔧 Some improvements needed for full autonomy');
    } else {
      console.log('\n❌ AUTONOMOUS SELF-REPAIR SYSTEM: NEEDS IMPROVEMENT');
      console.log('🚨 Significant work required for autonomous operation');
    }
    
    // Save detailed results
    const reportPath = 'autonomous-repair-test-report.json';
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      successRate: successRate,
      totalTests: this.testResults.length,
      successfulTests: successfulTests.length,
      results: this.testResults
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

async function main() {
  const tester = new AutonomousRepairTester();
  
  console.log('🤖 AUTONOMOUS SELF-REPAIR SYSTEM TESTING');
  console.log('=========================================');
  console.log('This will systematically break parts of the system');
  console.log('and verify that autonomous repair mechanisms work.\n');
  
  try {
    // Login first
    const loginSuccess = await tester.login();
    if (!loginSuccess) {
      console.error('❌ Cannot proceed without authentication');
      return;
    }
    
    // Run comprehensive breakage and repair tests
    await tester.runAutonomousBreakageTests();
    
    // Restore any backups
    await tester.restoreAllBackups();
    
    console.log('\n✅ Autonomous self-repair testing completed!');
    
  } catch (error) {
    console.error('💥 Test suite error:', error);
    await tester.restoreAllBackups();
  }
}

// Run the test suite
main().catch(console.error);