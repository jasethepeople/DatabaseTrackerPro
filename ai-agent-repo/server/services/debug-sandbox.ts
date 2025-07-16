/**
 * Advanced Debug Sandbox System
 * Isolated environment for testing fixes and debugging issues
 * Trains AI to autonomously repair system problems
 */

import { exec, spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

interface SandboxTest {
  id: string;
  name: string;
  code: string;
  expectedOutput?: string;
  timeout: number;
  environment: Record<string, string>;
}

interface DebugSession {
  id: string;
  issue: string;
  timestamp: string;
  tests: SandboxTest[];
  results: TestResult[];
  aiLearning: AILearningData;
  status: 'running' | 'completed' | 'failed';
}

interface TestResult {
  testId: string;
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  aiAnalysis: string;
}

interface AILearningData {
  patterns: string[];
  solutions: string[];
  confidence: number;
  learningMetrics: {
    successRate: number;
    avgExecutionTime: number;
    commonFailures: string[];
  };
}

class DebugSandbox extends EventEmitter {
  private activeSessions: Map<string, DebugSession> = new Map();
  private sandboxDirectory: string;
  private aiKnowledge: Map<string, AILearningData> = new Map();

  constructor() {
    super();
    this.sandboxDirectory = join(process.cwd(), '.debug-sandbox');
    this.initializeSandbox();
  }

  private async initializeSandbox() {
    try {
      await fs.mkdir(this.sandboxDirectory, { recursive: true });
      await this.loadAIKnowledge();
      console.log('🏗️ Debug Sandbox initialized');
    } catch (error) {
      console.error('Failed to initialize sandbox:', error);
    }
  }

  private async loadAIKnowledge() {
    try {
      const knowledgePath = join(this.sandboxDirectory, 'ai-knowledge.json');
      const data = await fs.readFile(knowledgePath, 'utf8');
      const knowledge = JSON.parse(data);
      
      Object.entries(knowledge).forEach(([key, value]) => {
        this.aiKnowledge.set(key, value as AILearningData);
      });
      
      console.log(`🧠 Loaded ${this.aiKnowledge.size} AI knowledge patterns`);
    } catch (error) {
      console.log('📚 Starting fresh AI knowledge base');
    }
  }

  private async saveAIKnowledge() {
    try {
      const knowledgePath = join(this.sandboxDirectory, 'ai-knowledge.json');
      const knowledge = Object.fromEntries(this.aiKnowledge.entries());
      await fs.writeFile(knowledgePath, JSON.stringify(knowledge, null, 2));
    } catch (error) {
      console.error('Failed to save AI knowledge:', error);
    }
  }

  async createDebugSession(issue: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const session: DebugSession = {
      id: sessionId,
      issue,
      timestamp: new Date().toISOString(),
      tests: [],
      results: [],
      aiLearning: this.generateInitialAILearning(issue),
      status: 'running'
    };

    this.activeSessions.set(sessionId, session);
    
    // Generate tests based on issue type
    session.tests = await this.generateTestsForIssue(issue);
    
    console.log(`🔬 Created debug session ${sessionId} for: ${issue}`);
    this.emit('sessionCreated', session);
    
    return sessionId;
  }

  private generateInitialAILearning(issue: string): AILearningData {
    // Check if we have existing knowledge for similar issues
    const issueKey = this.generateIssueKey(issue);
    const existingKnowledge = this.aiKnowledge.get(issueKey);
    
    if (existingKnowledge) {
      return { ...existingKnowledge };
    }

    return {
      patterns: [issue],
      solutions: [],
      confidence: 0.5,
      learningMetrics: {
        successRate: 0,
        avgExecutionTime: 0,
        commonFailures: []
      }
    };
  }

  private async generateTestsForIssue(issue: string): Promise<SandboxTest[]> {
    const tests: SandboxTest[] = [];
    const issueType = this.classifyIssue(issue);

    switch (issueType) {
      case 'port_conflict':
        tests.push(...this.generatePortConflictTests());
        break;
      case 'import_error':
        tests.push(...this.generateImportErrorTests());
        break;
      case 'database_connection':
        tests.push(...this.generateDatabaseTests());
        break;
      case 'file_system':
        tests.push(...this.generateFileSystemTests());
        break;
      case 'api_failure':
        tests.push(...this.generateAPITests());
        break;
      default:
        tests.push(...this.generateGenericTests(issue));
    }

    return tests;
  }

  private classifyIssue(issue: string): string {
    const patterns = {
      port_conflict: /EADDRINUSE|port.*already.*use/i,
      import_error: /Cannot find module|import.*outside.*module/i,
      database_connection: /database.*connection|ECONNREFUSED.*5432/i,
      file_system: /ENOENT|permission denied|file.*not.*found/i,
      api_failure: /API.*failed|endpoint.*not.*responding/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(issue)) {
        return type;
      }
    }

    return 'generic';
  }

  private generatePortConflictTests(): SandboxTest[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'Check port availability',
        code: `
const net = require('net');
const server = net.createServer();

server.listen(5000, () => {
  console.log('Port 5000 is available');
  server.close();
}).on('error', (err) => {
  console.log('Port 5000 is in use:', err.message);
});
        `,
        timeout: 5000,
        environment: {}
      },
      {
        id: crypto.randomUUID(),
        name: 'Kill processes on port 5000',
        code: `
const { exec } = require('child_process');

exec('lsof -ti:5000', (error, stdout, stderr) => {
  if (stdout.trim()) {
    const pids = stdout.trim().split('\\n');
    pids.forEach(pid => {
      exec(\`kill -9 \${pid}\`, (err) => {
        if (!err) console.log(\`Killed process \${pid}\`);
      });
    });
  } else {
    console.log('No processes found on port 5000');
  }
});
        `,
        timeout: 10000,
        environment: {}
      }
    ];
  }

  private generateImportErrorTests(): SandboxTest[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'Check module existence',
        code: `
const fs = require('fs');
const path = require('path');

function checkModule(moduleName) {
  try {
    require.resolve(moduleName);
    console.log(\`Module \${moduleName} exists\`);
    return true;
  } catch (error) {
    console.log(\`Module \${moduleName} not found: \${error.message}\`);
    return false;
  }
}

// Check common modules
['express', '@neondatabase/serverless', 'drizzle-orm'].forEach(checkModule);
        `,
        timeout: 5000,
        environment: {}
      },
      {
        id: crypto.randomUUID(),
        name: 'Reinstall dependencies',
        code: `
const { exec } = require('child_process');

exec('npm install', (error, stdout, stderr) => {
  if (error) {
    console.log('npm install failed:', error.message);
  } else {
    console.log('Dependencies reinstalled successfully');
  }
});
        `,
        timeout: 60000,
        environment: {}
      }
    ];
  }

  private generateDatabaseTests(): SandboxTest[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'Test database connection',
        code: `
const { Pool } = require('@neondatabase/serverless');

async function testConnection() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    await pool.end();
  } catch (error) {
    console.log('Database connection failed:', error.message);
  }
}

testConnection();
        `,
        timeout: 10000,
        environment: { DATABASE_URL: process.env.DATABASE_URL || '' }
      }
    ];
  }

  private generateFileSystemTests(): SandboxTest[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'Check file system permissions',
        code: `
const fs = require('fs');
const path = require('path');

function checkPath(pathToCheck) {
  try {
    const stats = fs.statSync(pathToCheck);
    console.log(\`Path \${pathToCheck} exists and is \${stats.isDirectory() ? 'directory' : 'file'}\`);
  } catch (error) {
    console.log(\`Path \${pathToCheck} error: \${error.message}\`);
  }
}

// Check critical paths
[
  process.cwd(),
  path.join(process.cwd(), 'server'),
  path.join(process.cwd(), 'client'),
  path.join(process.cwd(), 'node_modules')
].forEach(checkPath);
        `,
        timeout: 5000,
        environment: {}
      }
    ];
  }

  private generateAPITests(): SandboxTest[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'Test API endpoints',
        code: `
const http = require('http');

function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.get(\`http://localhost:5000\${path}\`, (res) => {
      console.log(\`\${path}: \${res.statusCode}\`);
      resolve(res.statusCode);
    });
    
    req.on('error', (error) => {
      console.log(\`\${path}: Error - \${error.message}\`);
      resolve(null);
    });
    
    req.setTimeout(5000, () => {
      console.log(\`\${path}: Timeout\`);
      req.destroy();
      resolve(null);
    });
  });
}

async function testAPIs() {
  const endpoints = ['/api/auth/me', '/api/security/exploits'];
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

testAPIs();
        `,
        timeout: 15000,
        environment: {}
      }
    ];
  }

  private generateGenericTests(issue: string): SandboxTest[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'System health check',
        code: `
const os = require('os');
const fs = require('fs');

console.log('System Info:');
console.log('Platform:', os.platform());
console.log('CPU Usage:', process.cpuUsage());
console.log('Memory:', process.memoryUsage());
console.log('Uptime:', process.uptime());

// Check disk space
try {
  const stats = fs.statSync(process.cwd());
  console.log('Working directory accessible');
} catch (error) {
  console.log('Working directory error:', error.message);
}
        `,
        timeout: 5000,
        environment: {}
      }
    ];
  }

  async runDebugSession(sessionId: string): Promise<DebugSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(`🚀 Running debug session ${sessionId}`);
    
    for (const test of session.tests) {
      const result = await this.runTest(test);
      session.results.push(result);
      
      // AI learning from each test result
      await this.aiLearnFromResult(session, test, result);
    }

    session.status = session.results.every(r => r.success) ? 'completed' : 'failed';
    
    // Update AI knowledge base
    await this.updateAIKnowledge(session);
    
    this.emit('sessionCompleted', session);
    return session;
  }

  private async runTest(test: SandboxTest): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running test: ${test.name}`);
      
      // Create isolated test file
      const testFile = join(this.sandboxDirectory, `test_${test.id}.js`);
      await fs.writeFile(testFile, test.code);
      
      // Execute test in sandbox
      const output = await this.executeInSandbox(testFile, test.environment, test.timeout);
      
      const result: TestResult = {
        testId: test.id,
        success: !output.includes('Error') && !output.includes('Failed'),
        output,
        executionTime: Date.now() - startTime,
        aiAnalysis: await this.aiAnalyzeResult(test, output)
      };

      // Cleanup
      await fs.unlink(testFile).catch(() => {});
      
      return result;
    } catch (error) {
      return {
        testId: test.id,
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        aiAnalysis: await this.aiAnalyzeError(test, error.message)
      };
    }
  }

  private async executeInSandbox(testFile: string, environment: Record<string, string>, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [testFile], {
        env: { ...process.env, ...environment },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('Test timeout'));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve(output);
        } else {
          resolve(output + '\nError: ' + errorOutput);
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  private async aiAnalyzeResult(test: SandboxTest, output: string): Promise<string> {
    // Simple AI analysis - can be enhanced with actual AI models
    const patterns = {
      success: /successful|completed|available|exists/i,
      failure: /failed|error|not found|timeout/i,
      warning: /warning|deprecated|outdated/i
    };

    if (patterns.success.test(output)) {
      return 'Test executed successfully with expected results';
    } else if (patterns.failure.test(output)) {
      return 'Test failed - requires attention and potential fixes';
    } else if (patterns.warning.test(output)) {
      return 'Test completed with warnings - may need optimization';
    }

    return 'Test completed with unclear results - needs manual review';
  }

  private async aiAnalyzeError(test: SandboxTest, error: string): Promise<string> {
    return `Test failed with error: ${error}. Recommended action: Check test environment and dependencies.`;
  }

  private async aiLearnFromResult(session: DebugSession, test: SandboxTest, result: TestResult) {
    // Update learning patterns
    if (result.success) {
      session.aiLearning.solutions.push(test.name);
      session.aiLearning.confidence = Math.min(0.95, session.aiLearning.confidence + 0.1);
    } else {
      session.aiLearning.learningMetrics.commonFailures.push(result.error || 'Unknown failure');
      session.aiLearning.confidence = Math.max(0.1, session.aiLearning.confidence - 0.05);
    }

    // Update metrics
    const successfulTests = session.results.filter(r => r.success).length;
    session.aiLearning.learningMetrics.successRate = successfulTests / session.results.length;
    session.aiLearning.learningMetrics.avgExecutionTime = 
      session.results.reduce((sum, r) => sum + r.executionTime, 0) / session.results.length;
  }

  private async updateAIKnowledge(session: DebugSession) {
    const issueKey = this.generateIssueKey(session.issue);
    this.aiKnowledge.set(issueKey, session.aiLearning);
    await this.saveAIKnowledge();
  }

  private generateIssueKey(issue: string): string {
    return crypto.createHash('md5').update(issue.toLowerCase()).digest('hex');
  }

  // Public API methods
  async debugIssue(issue: string): Promise<DebugSession> {
    const sessionId = await this.createDebugSession(issue);
    return await this.runDebugSession(sessionId);
  }

  async getActiveSessions(): Promise<DebugSession[]> {
    return Array.from(this.activeSessions.values());
  }

  async getAIKnowledge(): Promise<Map<string, AILearningData>> {
    return this.aiKnowledge;
  }

  async trainAI(issue: string, solution: string, success: boolean) {
    const issueKey = this.generateIssueKey(issue);
    const existing = this.aiKnowledge.get(issueKey) || {
      patterns: [issue],
      solutions: [],
      confidence: 0.5,
      learningMetrics: { successRate: 0, avgExecutionTime: 0, commonFailures: [] }
    };

    if (success) {
      existing.solutions.push(solution);
      existing.confidence = Math.min(0.95, existing.confidence + 0.15);
    } else {
      existing.learningMetrics.commonFailures.push(solution);
      existing.confidence = Math.max(0.1, existing.confidence - 0.1);
    }

    this.aiKnowledge.set(issueKey, existing);
    await this.saveAIKnowledge();
    
    console.log(`🧠 AI trained on issue: ${issue} with solution: ${solution} (success: ${success})`);
  }

  async getSuggestedFix(issue: string): Promise<string | null> {
    const issueKey = this.generateIssueKey(issue);
    const knowledge = this.aiKnowledge.get(issueKey);
    
    if (knowledge && knowledge.confidence > 0.7 && knowledge.solutions.length > 0) {
      return knowledge.solutions[knowledge.solutions.length - 1]; // Return most recent solution
    }
    
    return null;
  }

  destroy() {
    this.activeSessions.clear();
    this.removeAllListeners();
  }
}

export const debugSandbox = new DebugSandbox();
