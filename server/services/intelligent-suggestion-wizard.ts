/**
 * Intelligent Code Suggestion Wizard
 * Learns from autonomous repair patterns to provide proactive code suggestions
 */

import { promises as fs } from 'fs';
import path from 'path';
import { debugSandbox } from './debug-sandbox';
import { selfRepairService } from './self-repair-service';

interface CodePattern {
  pattern: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  repairCount: number;
  lastSeen: Date;
  confidence: number;
}

interface SuggestionResult {
  file: string;
  line: number;
  column: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  suggestion: string;
  autoFixAvailable: boolean;
  repairPattern?: string;
}

interface AnalysisContext {
  fileType: string;
  complexity: number;
  dependencies: string[];
  recentErrors: string[];
  repairHistory: any[];
}

class IntelligentSuggestionWizard {
  private knownPatterns: Map<string, CodePattern> = new Map();
  private analysisCache: Map<string, { timestamp: Date; suggestions: SuggestionResult[] }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeKnownPatterns();
    this.startPatternLearning();
  }

  private initializeKnownPatterns() {
    // Initialize with common problematic patterns learned from self-repair
    const patterns: CodePattern[] = [
      {
        pattern: /export\s+const\s+\w+\s*=\s*$/m,
        riskLevel: 'high',
        description: 'Incomplete export statement',
        suggestion: 'Complete the export assignment to prevent syntax errors',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.9
      },
      {
        pattern: /const\s+\w+\s*=\s*new\s+Array\(\d{4,}\)/,
        riskLevel: 'critical',
        description: 'Large array allocation detected',
        suggestion: 'Consider lazy loading or streaming for large data structures to prevent memory leaks',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.8
      },
      {
        pattern: /require\(['"][^'"]*['"];\s*$/m,
        riskLevel: 'medium',
        description: 'ES module import in CommonJS context',
        suggestion: 'Use import syntax or ensure proper module configuration',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.7
      },
      {
        pattern: /chmod\s+000/,
        riskLevel: 'critical',
        description: 'Removing all file permissions',
        suggestion: 'Avoid setting 000 permissions as it makes files unreadable',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.95
      },
      {
        pattern: /setTimeout\(\(\)\s*=>\s*\{\s*.*\s*\},\s*\d+\);?\s*$/m,
        riskLevel: 'medium',
        description: 'Potential memory leak with setTimeout',
        suggestion: 'Store timeout reference and clear it when component unmounts or scope ends',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.6
      },
      {
        pattern: /app\.listen\(\d+\)/,
        riskLevel: 'medium',
        description: 'Hardcoded port in server configuration',
        suggestion: 'Use environment variables for port configuration (process.env.PORT || 5000)',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.7
      },
      {
        pattern: /\.catch\(\(\)\s*=>\s*\{\s*\}\)/,
        riskLevel: 'high',
        description: 'Silent error handling',
        suggestion: 'Add proper error logging or handling instead of empty catch blocks',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.8
      },
      {
        pattern: /console\.log\(['"][^'"]*['"].*?\);?(?:\s*\/\/.*)?$/m,
        riskLevel: 'low',
        description: 'Debug console.log statements',
        suggestion: 'Remove debug logs before production or use proper logging framework',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.5
      },
      {
        pattern: /DATABASE_URL\s*=\s*['"][^'"]*localhost[^'"]*['"]/,
        riskLevel: 'medium',
        description: 'Hardcoded localhost database URL',
        suggestion: 'Use environment-specific database URLs for better deployment flexibility',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.6
      },
      {
        pattern: /fetch\(['"][^'"]*['"](?:\s*,\s*\{[^}]*\})?\)\s*(?:\.then|\.catch)?(?:\s*;)?\s*$/m,
        riskLevel: 'medium',
        description: 'Unhandled fetch request',
        suggestion: 'Add error handling for network requests with try-catch or .catch()',
        repairCount: 0,
        lastSeen: new Date(),
        confidence: 0.7
      }
    ];

    patterns.forEach((pattern, index) => {
      this.knownPatterns.set(`pattern_${index}`, pattern);
    });
  }

  private async startPatternLearning() {
    // Learn from repair service patterns every 30 seconds
    setInterval(async () => {
      await this.learnFromRepairPatterns();
    }, 30000);

    // Initial learning
    await this.learnFromRepairPatterns();
  }

  private async learnFromRepairPatterns() {
    try {
      const repairHistory = await selfRepairService.getRepairHistory();
      const aiKnowledge = await debugSandbox.getAIKnowledge();

      // Learn from successful repairs
      repairHistory.forEach(repair => {
        if (repair.success && repair.solution) {
          this.updatePatternFromRepair(repair);
        }
      });

      // Learn from AI debug patterns
      const knowledgeArray = Array.from(aiKnowledge.entries());
      knowledgeArray.forEach(([key, knowledge]) => {
        if (knowledge.confidence > 0.7) {
          this.updatePatternFromAIKnowledge(key, knowledge);
        }
      });

      console.log(`🧠 Learned from ${repairHistory.length} repairs and ${knowledgeArray.length} AI patterns`);
    } catch (error) {
      console.error('Pattern learning error:', error);
    }
  }

  private updatePatternFromRepair(repair: any) {
    const patternKey = `repair_${repair.issue.replace(/\s+/g, '_').toLowerCase()}`;
    
    if (this.knownPatterns.has(patternKey)) {
      const existing = this.knownPatterns.get(patternKey)!;
      existing.repairCount++;
      existing.confidence = Math.min(0.95, existing.confidence + 0.1);
      existing.lastSeen = new Date();
    } else {
      // Create new pattern from repair
      const newPattern: CodePattern = {
        pattern: repair.issue,
        riskLevel: this.determineRiskLevel(repair.issue),
        description: `Issue learned from repair: ${repair.issue}`,
        suggestion: repair.solution || 'Apply automated repair strategy',
        repairCount: 1,
        lastSeen: new Date(),
        confidence: 0.6
      };
      this.knownPatterns.set(patternKey, newPattern);
    }
  }

  private updatePatternFromAIKnowledge(issueKey: string, knowledge: any) {
    const patternKey = `ai_${issueKey}`;
    
    if (knowledge.solutions && knowledge.solutions.length > 0) {
      const newPattern: CodePattern = {
        pattern: issueKey,
        riskLevel: knowledge.confidence > 0.9 ? 'high' : 'medium',
        description: `AI-learned pattern: ${issueKey}`,
        suggestion: knowledge.solutions[knowledge.solutions.length - 1],
        repairCount: knowledge.learningMetrics?.successfulRepairs || 0,
        lastSeen: new Date(),
        confidence: knowledge.confidence
      };
      this.knownPatterns.set(patternKey, newPattern);
    }
  }

  private determineRiskLevel(issue: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerIssue = issue.toLowerCase();
    
    if (lowerIssue.includes('syntax') || lowerIssue.includes('memory leak') || lowerIssue.includes('permission')) {
      return 'critical';
    } else if (lowerIssue.includes('error') || lowerIssue.includes('fail') || lowerIssue.includes('conflict')) {
      return 'high';
    } else if (lowerIssue.includes('warning') || lowerIssue.includes('deprecated')) {
      return 'medium';
    }
    
    return 'low';
  }

  async analyzeFile(filePath: string): Promise<SuggestionResult[]> {
    // Check cache first
    const cached = this.analysisCache.get(filePath);
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheExpiry) {
      return cached.suggestions;
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const context = await this.buildAnalysisContext(filePath, content);
      const suggestions = await this.analyzecontent(filePath, content, context);

      // Cache results
      this.analysisCache.set(filePath, {
        timestamp: new Date(),
        suggestions
      });

      return suggestions;
    } catch (error) {
      console.error(`Analysis error for ${filePath}:`, error);
      return [];
    }
  }

  private async buildAnalysisContext(filePath: string, content: string): Promise<AnalysisContext> {
    const fileType = path.extname(filePath).toLowerCase();
    const lines = content.split('\n');
    
    // Calculate complexity (basic metric)
    const complexity = this.calculateComplexity(content);
    
    // Extract dependencies
    const dependencies = this.extractDependencies(content);
    
    // Get recent repair history for this file
    const repairHistory = await selfRepairService.getRepairHistory();
    const fileSpecificRepairs = repairHistory.filter(repair => 
      repair.issue.includes(path.basename(filePath)) || 
      repair.solution?.includes(path.basename(filePath))
    );

    return {
      fileType,
      complexity,
      dependencies,
      recentErrors: fileSpecificRepairs.map(r => r.issue),
      repairHistory: fileSpecificRepairs
    };
  }

  private calculateComplexity(content: string): number {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const functions = (content.match(/function\s+\w+|=>\s*{|async\s+\w+/g) || []).length;
    const conditionals = (content.match(/if\s*\(|switch\s*\(|while\s*\(|for\s*\(/g) || []).length;
    const tryBlocks = (content.match(/try\s*{/g) || []).length;
    
    return Math.round((lines.length * 0.1) + (functions * 2) + (conditionals * 1.5) + (tryBlocks * 1));
  }

  private extractDependencies(content: string): string[] {
    const imports = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
    const requires = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
    
    return [...imports, ...requires].map(dep => {
      const match = dep.match(/['"]([^'"]+)['"]/);
      return match ? match[1] : '';
    }).filter(Boolean);
  }

  private async analyzecontent(filePath: string, content: string, context: AnalysisContext): Promise<SuggestionResult[]> {
    const suggestions: SuggestionResult[] = [];
    const lines = content.split('\n');

    // Check each known pattern
    for (const [patternKey, pattern] of this.knownPatterns) {
      if (typeof pattern.pattern === 'string') {
        // String pattern matching
        if (content.includes(pattern.pattern)) {
          const lineIndex = lines.findIndex(line => line.includes(pattern.pattern));
          if (lineIndex !== -1) {
            suggestions.push(this.createSuggestion(filePath, lineIndex + 1, 0, pattern));
          }
        }
      } else {
        // Regex pattern matching
        const matches = content.matchAll(new RegExp(pattern.pattern, 'gm'));
        for (const match of matches) {
          const lineIndex = content.substring(0, match.index).split('\n').length - 1;
          const column = match.index! - content.lastIndexOf('\n', match.index! - 1) - 1;
          suggestions.push(this.createSuggestion(filePath, lineIndex + 1, column, pattern, match[0]));
        }
      }
    }

    // Context-aware suggestions
    suggestions.push(...this.generateContextAwareSuggestions(filePath, content, context));

    // Smart suggestions based on repair history
    suggestions.push(...this.generateRepairBasedSuggestions(filePath, content, context));

    return suggestions.sort((a, b) => {
      const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private createSuggestion(
    filePath: string, 
    line: number, 
    column: number, 
    pattern: CodePattern,
    matchedText?: string
  ): SuggestionResult {
    return {
      file: filePath,
      line,
      column,
      severity: this.mapRiskToSeverity(pattern.riskLevel),
      message: pattern.description,
      suggestion: pattern.suggestion,
      autoFixAvailable: pattern.confidence > 0.8,
      repairPattern: matchedText
    };
  }

  private mapRiskToSeverity(riskLevel: 'low' | 'medium' | 'high' | 'critical'): 'info' | 'warning' | 'error' | 'critical' {
    switch (riskLevel) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'critical';
      default: return 'info';
    }
  }

  private generateContextAwareSuggestions(filePath: string, content: string, context: AnalysisContext): SuggestionResult[] {
    const suggestions: SuggestionResult[] = [];

    // TypeScript specific suggestions
    if (context.fileType === '.ts' || context.fileType === '.tsx') {
      if (!content.includes('export') && !content.includes('import') && content.includes('function')) {
        suggestions.push({
          file: filePath,
          line: 1,
          column: 0,
          severity: 'info',
          message: 'Consider adding exports for reusability',
          suggestion: 'Add export statements for functions that might be used elsewhere',
          autoFixAvailable: false
        });
      }
    }

    // Server file specific suggestions
    if (filePath.includes('server/') || filePath.includes('routes')) {
      if (!content.includes('try') && content.includes('async')) {
        suggestions.push({
          file: filePath,
          line: 1,
          column: 0,
          severity: 'warning',
          message: 'Missing error handling in async operations',
          suggestion: 'Add try-catch blocks around async operations for better error handling',
          autoFixAvailable: true
        });
      }
    }

    // High complexity warning
    if (context.complexity > 50) {
      suggestions.push({
        file: filePath,
        line: 1,
        column: 0,
        severity: 'warning',
        message: 'High complexity detected',
        suggestion: 'Consider breaking this file into smaller, more focused modules',
        autoFixAvailable: false
      });
    }

    return suggestions;
  }

  private generateRepairBasedSuggestions(filePath: string, content: string, context: AnalysisContext): SuggestionResult[] {
    const suggestions: SuggestionResult[] = [];

    // If this file has been repaired recently, suggest preventive measures
    if (context.repairHistory.length > 0) {
      const recentRepairs = context.repairHistory.filter(repair => 
        (Date.now() - new Date(repair.timestamp).getTime()) < (24 * 60 * 60 * 1000) // Last 24 hours
      );

      if (recentRepairs.length > 0) {
        suggestions.push({
          file: filePath,
          line: 1,
          column: 0,
          severity: 'info',
          message: 'File recently required repairs',
          suggestion: `Recent repairs: ${recentRepairs.map(r => r.issue).join(', ')}. Consider adding preventive measures.`,
          autoFixAvailable: false
        });
      }
    }

    // Suggest improvements based on successful repair patterns
    const successfulPatterns = Array.from(this.knownPatterns.values())
      .filter(p => p.repairCount > 2 && p.confidence > 0.7);

    successfulPatterns.forEach(pattern => {
      if (typeof pattern.pattern === 'string' && content.includes(pattern.pattern)) {
        suggestions.push({
          file: filePath,
          line: 1,
          column: 0,
          severity: 'info',
          message: 'Proactive improvement available',
          suggestion: `Based on repair patterns: ${pattern.suggestion}`,
          autoFixAvailable: pattern.confidence > 0.9
        });
      }
    });

    return suggestions;
  }

  async getProjectSuggestions(projectPath: string = '.'): Promise<SuggestionResult[]> {
    const allSuggestions: SuggestionResult[] = [];

    try {
      // Analyze TypeScript/JavaScript files
      const codeFiles = await this.findCodeFiles(projectPath);
      
      for (const file of codeFiles.slice(0, 20)) { // Limit to first 20 files for performance
        const suggestions = await this.analyzeFile(file);
        allSuggestions.push(...suggestions);
      }

      return allSuggestions.sort((a, b) => {
        const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      console.error('Project analysis error:', error);
      return [];
    }
  }

  private async findCodeFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findCodeFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore directories we can't read
    }

    return files;
  }

  async applyAutoFix(suggestion: SuggestionResult): Promise<boolean> {
    if (!suggestion.autoFixAvailable) {
      return false;
    }

    try {
      const content = await fs.readFile(suggestion.file, 'utf8');
      const lines = content.split('\n');

      // Apply specific fixes based on patterns
      if (suggestion.repairPattern) {
        const fixedContent = content.replace(suggestion.repairPattern, this.generateFix(suggestion.repairPattern));
        await fs.writeFile(suggestion.file, fixedContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auto-fix error:', error);
      return false;
    }
  }

  private generateFix(pattern: string): string {
    // Simple fix generators based on common patterns
    if (pattern.includes('export const') && pattern.endsWith('=')) {
      return pattern + ' {};';
    }
    
    if (pattern.includes('new Array(') && pattern.includes(')')) {
      return pattern.replace(/new Array\((\d+)\)/, '[]');
    }

    return pattern; // Fallback to original
  }

  getPatternStats(): { totalPatterns: number; highConfidencePatterns: number; recentlyLearned: number } {
    const patterns = Array.from(this.knownPatterns.values());
    const highConfidence = patterns.filter(p => p.confidence > 0.8).length;
    const recent = patterns.filter(p => 
      (Date.now() - p.lastSeen.getTime()) < (24 * 60 * 60 * 1000)
    ).length;

    return {
      totalPatterns: patterns.length,
      highConfidencePatterns: highConfidence,
      recentlyLearned: recent
    };
  }
}

export const intelligentSuggestionWizard = new IntelligentSuggestionWizard();