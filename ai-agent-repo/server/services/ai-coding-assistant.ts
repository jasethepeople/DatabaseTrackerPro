/**
 * AI-Powered Coding Assistant Service
 * Provides context-aware suggestions, code completion, and intelligent recommendations
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, extname, dirname, basename } from 'path';

interface CodeContext {
  currentFile: string;
  currentCode: string;
  cursorPosition: number;
  selectedText?: string;
  projectFiles: string[];
  recentFiles: string[];
  language: string;
}

interface AIResponse {
  suggestions: CodeSuggestion[];
  completions: CodeCompletion[];
  contextualHelp: ContextualHelp;
  refactoringSuggestions: RefactoringSuggestion[];
}

interface CodeSuggestion {
  id: string;
  type: 'optimization' | 'bug_fix' | 'best_practice' | 'security' | 'performance';
  title: string;
  description: string;
  code: string;
  confidence: number;
  line?: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoApplicable: boolean;
}

interface CodeCompletion {
  id: string;
  insertText: string;
  displayText: string;
  detail: string;
  kind: 'function' | 'variable' | 'class' | 'method' | 'property' | 'keyword';
  confidence: number;
  sortText: string;
}

interface ContextualHelp {
  documentation: string;
  examples: string[];
  relatedFiles: string[];
  usagePatterns: string[];
}

interface RefactoringSuggestion {
  id: string;
  title: string;
  description: string;
  before: string;
  after: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  benefits: string[];
}

export class AICodingAssistant {
  private knowledgeBase: Map<string, any> = new Map();
  private contextCache: Map<string, CodeContext> = new Map();
  private learningHistory: any[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Initialize with common patterns and best practices
    this.knowledgeBase.set('typescript_patterns', {
      errorHandling: {
        pattern: /try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{[^}]*}/g,
        suggestion: 'Consider using specific error types and proper error logging'
      },
      asyncAwait: {
        pattern: /async\s+function|async\s+\(/g,
        suggestion: 'Ensure proper error handling with try-catch blocks'
      },
      typeGuards: {
        pattern: /typeof\s+\w+\s*===\s*['"`]\w+['"`]/g,
        suggestion: 'Consider using TypeScript type guards for better type safety'
      }
    });

    this.knowledgeBase.set('javascript_patterns', {
      memoryLeaks: {
        pattern: /addEventListener\s*\(/g,
        suggestion: 'Remember to add corresponding removeEventListener to prevent memory leaks'
      },
      inefficientLoops: {
        pattern: /for\s*\(\s*var\s+\w+\s*=\s*0/g,
        suggestion: 'Consider using const/let instead of var, or array methods like map/filter'
      }
    });

    this.knowledgeBase.set('react_patterns', {
      useEffect: {
        pattern: /useEffect\s*\(/g,
        suggestion: 'Ensure useEffect has proper dependencies and cleanup functions'
      },
      stateUpdates: {
        pattern: /setState\s*\(/g,
        suggestion: 'Consider using functional state updates for better predictability'
      }
    });
  }

  async analyzeCodeContext(context: CodeContext): Promise<AIResponse> {
    try {
      // Analyze current code structure
      const codeAnalysis = this.analyzeCodeStructure(context.currentCode, context.language);
      
      // Generate context-aware suggestions
      const suggestions = await this.generateContextualSuggestions(context, codeAnalysis);
      
      // Provide intelligent code completions
      const completions = await this.generateCodeCompletions(context);
      
      // Generate contextual help
      const contextualHelp = await this.generateContextualHelp(context);
      
      // Suggest refactoring opportunities
      const refactoringSuggestions = await this.generateRefactoringSuggestions(context, codeAnalysis);

      return {
        suggestions,
        completions,
        contextualHelp,
        refactoringSuggestions
      };
    } catch (error) {
      console.error('Error in AI coding assistant analysis:', error);
      return {
        suggestions: [],
        completions: [],
        contextualHelp: { documentation: '', examples: [], relatedFiles: [], usagePatterns: [] },
        refactoringSuggestions: []
      };
    }
  }

  private analyzeCodeStructure(code: string, language: string) {
    const analysis = {
      functions: this.extractFunctions(code, language),
      imports: this.extractImports(code, language),
      variables: this.extractVariables(code, language),
      classes: this.extractClasses(code, language),
      complexity: this.calculateComplexity(code),
      patterns: this.identifyPatterns(code, language)
    };

    return analysis;
  }

  private extractFunctions(code: string, language: string): string[] {
    const functionPatterns = {
      typescript: /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
      javascript: /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
      react: /(?:export\s+)?(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>)/g
    };

    const pattern = functionPatterns[language as keyof typeof functionPatterns] || functionPatterns.javascript;
    const matches = Array.from(code.matchAll(pattern));
    return matches.map(match => match[1] || match[2]).filter(Boolean);
  }

  private extractImports(code: string, language: string): string[] {
    const importPattern = /import\s+(?:{[^}]+}|\w+|[^'"]+)\s+from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(code.matchAll(importPattern));
    return matches.map(match => match[1]);
  }

  private extractVariables(code: string, language: string): string[] {
    const varPattern = /(?:const|let|var)\s+(\w+)/g;
    const matches = Array.from(code.matchAll(varPattern));
    return matches.map(match => match[1]);
  }

  private extractClasses(code: string, language: string): string[] {
    const classPattern = /(?:export\s+)?(?:default\s+)?class\s+(\w+)/g;
    const matches = Array.from(code.matchAll(classPattern));
    return matches.map(match => match[1]);
  }

  private calculateComplexity(code: string): number {
    // Simple cyclomatic complexity calculation
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&|\|\|/g
    ];

    let complexity = 1; // Base complexity
    complexityPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  private identifyPatterns(code: string, language: string): string[] {
    const patterns = this.knowledgeBase.get(`${language}_patterns`) || {};
    const foundPatterns: string[] = [];

    Object.keys(patterns).forEach(patternName => {
      const pattern = patterns[patternName];
      if (pattern.pattern && pattern.pattern.test(code)) {
        foundPatterns.push(patternName);
      }
    });

    return foundPatterns;
  }

  private async generateContextualSuggestions(context: CodeContext, analysis: any): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Analyze for common issues
    if (analysis.complexity > 10) {
      suggestions.push({
        id: `complexity-${Date.now()}`,
        type: 'optimization',
        title: 'High Complexity Detected',
        description: 'This function has high cyclomatic complexity. Consider breaking it into smaller functions.',
        code: '// Consider extracting logic into separate functions\nconst extractedFunction = () => {\n  // Move complex logic here\n};',
        confidence: 0.85,
        severity: 'medium',
        autoApplicable: false
      });
    }

    // Check for missing error handling
    if (context.currentCode.includes('async') && !context.currentCode.includes('try')) {
      suggestions.push({
        id: `error-handling-${Date.now()}`,
        type: 'bug_fix',
        title: 'Missing Error Handling',
        description: 'Async functions should include proper error handling with try-catch blocks.',
        code: 'try {\n  // Your async code here\n} catch (error) {\n  console.error("Error:", error);\n  // Handle error appropriately\n}',
        confidence: 0.9,
        severity: 'high',
        autoApplicable: true
      });
    }

    // Check for performance issues
    if (context.currentCode.includes('getElementById') || context.currentCode.includes('querySelector')) {
      suggestions.push({
        id: `performance-${Date.now()}`,
        type: 'performance',
        title: 'DOM Query Optimization',
        description: 'Consider caching DOM queries to improve performance.',
        code: '// Cache DOM elements\nconst element = document.getElementById("myElement");\n// Reuse cached element instead of re-querying',
        confidence: 0.75,
        severity: 'low',
        autoApplicable: false
      });
    }

    // Security suggestions
    if (context.currentCode.includes('innerHTML') || context.currentCode.includes('eval(')) {
      suggestions.push({
        id: `security-${Date.now()}`,
        type: 'security',
        title: 'Potential Security Risk',
        description: 'Avoid using innerHTML or eval() as they can lead to XSS vulnerabilities.',
        code: '// Use textContent instead of innerHTML\nelement.textContent = userInput;\n// Or use proper sanitization',
        confidence: 0.95,
        severity: 'critical',
        autoApplicable: false
      });
    }

    return suggestions;
  }

  private async generateCodeCompletions(context: CodeContext): Promise<CodeCompletion[]> {
    const completions: CodeCompletion[] = [];
    const currentLine = this.getCurrentLine(context.currentCode, context.cursorPosition);
    
    // Context-aware completions based on current typing
    if (currentLine.includes('console.')) {
      completions.push(
        {
          id: 'console-log',
          insertText: 'log(${1:message})',
          displayText: 'log(message)',
          detail: 'Log message to console',
          kind: 'method',
          confidence: 0.9,
          sortText: '0001'
        },
        {
          id: 'console-error',
          insertText: 'error(${1:error})',
          displayText: 'error(error)',
          detail: 'Log error to console',
          kind: 'method',
          confidence: 0.8,
          sortText: '0002'
        }
      );
    }

    if (currentLine.includes('useState')) {
      completions.push({
        id: 'useState-hook',
        insertText: 'useState<${1:type}>(${2:initialValue})',
        displayText: 'useState<T>(initialValue)',
        detail: 'React useState hook with TypeScript',
        kind: 'function',
        confidence: 0.95,
        sortText: '0001'
      });
    }

    if (currentLine.includes('useEffect')) {
      completions.push({
        id: 'useEffect-hook',
        insertText: 'useEffect(() => {\n  ${1:// Effect logic}\n  return () => {\n    ${2:// Cleanup}\n  };\n}, [${3:dependencies}]);',
        displayText: 'useEffect with cleanup',
        detail: 'React useEffect hook with cleanup function',
        kind: 'function',
        confidence: 0.9,
        sortText: '0001'
      });
    }

    return completions;
  }

  private async generateContextualHelp(context: CodeContext): Promise<ContextualHelp> {
    const help: ContextualHelp = {
      documentation: '',
      examples: [],
      relatedFiles: [],
      usagePatterns: []
    };

    // Find related files
    help.relatedFiles = context.projectFiles.filter(file => {
      const fileName = basename(file);
      const currentFileName = basename(context.currentFile);
      return fileName.includes(currentFileName.split('.')[0]) || 
             currentFileName.includes(fileName.split('.')[0]);
    });

    // Generate context-specific documentation
    if (context.currentCode.includes('React')) {
      help.documentation = 'React component detected. Consider using TypeScript for better type safety and prop validation.';
      help.examples.push(
        'interface Props {\n  title: string;\n  onClick: () => void;\n}\n\nconst Component: React.FC<Props> = ({ title, onClick }) => {\n  return <button onClick={onClick}>{title}</button>;\n};'
      );
    }

    if (context.currentCode.includes('express')) {
      help.documentation = 'Express.js server detected. Ensure proper error handling and security middleware.';
      help.examples.push(
        'app.use(express.json());\napp.use(helmet());\napp.use(cors());\n\napp.get("/api/endpoint", async (req, res) => {\n  try {\n    // Your logic here\n    res.json({ success: true });\n  } catch (error) {\n    res.status(500).json({ error: error.message });\n  }\n});'
      );
    }

    return help;
  }

  private async generateRefactoringSuggestions(context: CodeContext, analysis: any): Promise<RefactoringSuggestion[]> {
    const suggestions: RefactoringSuggestion[] = [];

    // Suggest extracting repeated code
    const repeatedPatterns = this.findRepeatedPatterns(context.currentCode);
    if (repeatedPatterns.length > 0) {
      suggestions.push({
        id: `extract-function-${Date.now()}`,
        title: 'Extract Repeated Code',
        description: 'Found repeated code patterns that could be extracted into reusable functions.',
        before: repeatedPatterns[0],
        after: '// Extract into function\nconst extractedFunction = (params) => {\n  // Repeated logic here\n};\n\n// Use function calls instead',
        impact: 'medium',
        confidence: 0.8,
        benefits: ['Reduced code duplication', 'Improved maintainability', 'Better testability']
      });
    }

    // Suggest converting to arrow functions
    const functionDeclarations = context.currentCode.match(/function\s+\w+\s*\([^)]*\)\s*{/g);
    if (functionDeclarations && functionDeclarations.length > 0) {
      suggestions.push({
        id: `arrow-functions-${Date.now()}`,
        title: 'Convert to Arrow Functions',
        description: 'Consider using arrow functions for more concise syntax.',
        before: 'function myFunction(param) {\n  return param * 2;\n}',
        after: 'const myFunction = (param) => {\n  return param * 2;\n};\n// Or: const myFunction = (param) => param * 2;',
        impact: 'low',
        confidence: 0.7,
        benefits: ['More concise syntax', 'Lexical this binding', 'Modern JavaScript style']
      });
    }

    return suggestions;
  }

  private getCurrentLine(code: string, position: number): string {
    const lines = code.substring(0, position).split('\n');
    return lines[lines.length - 1] || '';
  }

  private findRepeatedPatterns(code: string): string[] {
    const lines = code.split('\n');
    const patterns: string[] = [];
    const lineGroups = new Map<string, number>();

    // Find repeated lines (simplified approach)
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 10) { // Only consider substantial lines
        lineGroups.set(trimmed, (lineGroups.get(trimmed) || 0) + 1);
      }
    });

    lineGroups.forEach((count, line) => {
      if (count > 1) {
        patterns.push(line);
      }
    });

    return patterns.slice(0, 3); // Return top 3 patterns
  }

  async applyAISuggestion(suggestionId: string, code: string): Promise<string> {
    // Apply the suggestion to the code
    // This would contain logic to automatically apply suggestions
    return code; // Placeholder - would contain actual implementation
  }

  async learnFromInteraction(context: CodeContext, appliedSuggestions: string[]) {
    // Learn from user interactions to improve future suggestions
    this.learningHistory.push({
      timestamp: new Date().toISOString(),
      context: {
        language: context.language,
        fileType: extname(context.currentFile),
        appliedSuggestions
      }
    });

    // Update knowledge base based on learning
    if (this.learningHistory.length > 100) {
      await this.updateKnowledgeBase();
    }
  }

  private async updateKnowledgeBase() {
    // Analyze learning history and update patterns
    const recentInteractions = this.learningHistory.slice(-50);
    
    // Find commonly applied suggestions
    const suggestionFrequency = new Map<string, number>();
    recentInteractions.forEach(interaction => {
      interaction.context.appliedSuggestions.forEach((suggestion: string) => {
        suggestionFrequency.set(suggestion, (suggestionFrequency.get(suggestion) || 0) + 1);
      });
    });

    // Update knowledge base with popular patterns
    suggestionFrequency.forEach((frequency, suggestion) => {
      if (frequency > 5) { // If applied more than 5 times
        // Increase confidence for this pattern
        console.log(`Learning: Suggestion "${suggestion}" is frequently applied`);
      }
    });
  }

  getAssistantStats() {
    return {
      knowledgeBaseSize: this.knowledgeBase.size,
      learningHistorySize: this.learningHistory.length,
      contextCacheSize: this.contextCache.size,
      lastUpdate: new Date().toISOString()
    };
  }
}

export const aiCodingAssistant = new AICodingAssistant();