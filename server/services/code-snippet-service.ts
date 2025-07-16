import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229". 
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

export interface CodeSnippetRequest {
  prompt: string;
  language: string;
  category: string;
  difficulty: string;
}

export interface GeneratedSnippet {
  title: string;
  description: string;
  code: string;
  language: string;
  category: string;
  difficulty: string;
  tags: string[];
  usage: string;
}

export class CodeSnippetService {
  async generateSnippet(request: CodeSnippetRequest, userId: number): Promise<GeneratedSnippet> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: `You are an expert code generator. Generate high-quality, production-ready code snippets based on user requirements. Always provide complete, working code with proper error handling and best practices.

Response Format: Return a JSON object with the following structure:
{
  "title": "Brief descriptive title",
  "description": "Detailed description of what the code does",
  "code": "Complete working code",
  "tags": ["tag1", "tag2", "tag3"],
  "usage": "Clear instructions on how to use this code"
}

Guidelines:
- Write clean, well-commented code following best practices
- Include proper error handling where appropriate
- Make code production-ready and secure
- Provide meaningful variable and function names
- Include necessary imports/dependencies
- Follow the specified language conventions and style guides`
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Invalid response format from AI');
      }

      const generatedData = JSON.parse(content.text);
      
      return {
        title: generatedData.title,
        description: generatedData.description,
        code: generatedData.code,
        language: request.language,
        category: request.category,
        difficulty: request.difficulty,
        tags: generatedData.tags || [],
        usage: generatedData.usage,
      };
    } catch (error) {
      console.error('Error generating code snippet:', error);
      throw new Error('Failed to generate code snippet. Please try again.');
    }
  }

  private buildPrompt(request: CodeSnippetRequest): string {
    const contextualGuidance = this.getContextualGuidance(request.language, request.category, request.difficulty);
    
    return `Generate a ${request.difficulty} level ${request.language} code snippet for the following requirement:

${request.prompt}

Context:
- Language: ${request.language}
- Category: ${request.category}
- Difficulty: ${request.difficulty}

${contextualGuidance}

Please ensure the code is:
1. Complete and functional
2. Well-commented and documented
3. Following ${request.language} best practices
4. Appropriate for ${request.difficulty} skill level
5. Relevant to the ${request.category} category
6. Production-ready with proper error handling

Generate tags that would help users find this snippet (e.g., function names, concepts, use cases).`;
  }

  private getContextualGuidance(language: string, category: string, difficulty: string): string {
    const languageGuidance: Record<string, string> = {
      javascript: "Use modern ES6+ syntax, async/await, and proper error handling",
      typescript: "Include proper type annotations, interfaces, and generic types where appropriate",
      python: "Follow PEP 8 style guide, use type hints, and include docstrings",
      java: "Use proper access modifiers, follow naming conventions, and include JavaDoc",
      cpp: "Use modern C++17/20 features, RAII principles, and proper memory management",
      csharp: "Use modern C# features, proper naming conventions, and XML documentation",
      go: "Follow Go conventions, use proper error handling, and include package documentation",
      rust: "Use ownership principles, proper error handling with Result types, and safe patterns",
      php: "Use PSR standards, proper error handling, and type declarations",
      ruby: "Follow Ruby conventions, use proper error handling, and include documentation",
      swift: "Use Swift best practices, optionals, and proper error handling",
      kotlin: "Use Kotlin idioms, null safety, and proper documentation"
    };

    const categoryGuidance: Record<string, string> = {
      algorithms: "Focus on time/space complexity, clear logic, and optimal solutions",
      "data-structures": "Implement efficient operations, proper encapsulation, and clear interfaces",
      "web-development": "Include security considerations, proper validation, and scalable patterns",
      mobile: "Consider platform-specific best practices, performance, and user experience",
      api: "Include proper HTTP methods, status codes, authentication, and documentation",
      database: "Use proper connection handling, parameterized queries, and transaction management",
      "ai-ml": "Include proper data preprocessing, model validation, and performance metrics",
      security: "Implement security best practices, input validation, and proper encryption",
      testing: "Include comprehensive test cases, edge cases, and clear assertions",
      devops: "Focus on automation, configuration management, and monitoring",
      utilities: "Create reusable, well-documented utility functions with clear interfaces"
    };

    const difficultyGuidance: Record<string, string> = {
      beginner: "Keep it simple, add extensive comments, and focus on readability",
      intermediate: "Include moderate complexity, some advanced features, and good practices",
      advanced: "Use advanced language features, design patterns, and optimization techniques"
    };

    return `
${languageGuidance[language] || "Follow language best practices"}
${categoryGuidance[category] || "Focus on the specific category requirements"}
${difficultyGuidance[difficulty] || "Match the appropriate skill level"}`;
  }

  // Get popular snippet templates for quick generation
  getSnippetTemplates(language: string, category: string): Array<{ title: string; prompt: string }> {
    const templates: Record<string, Record<string, Array<{ title: string; prompt: string }>>> = {
      javascript: {
        'web-development': [
          { title: 'API Fetch Function', prompt: 'Create a reusable function to fetch data from APIs with error handling' },
          { title: 'Form Validation', prompt: 'Build a comprehensive form validation system' },
          { title: 'Local Storage Manager', prompt: 'Create a utility for managing browser local storage' },
        ],
        'utilities': [
          { title: 'Debounce Function', prompt: 'Implement a debounce utility function' },
          { title: 'Deep Clone Object', prompt: 'Create a function to deep clone JavaScript objects' },
          { title: 'String Utilities', prompt: 'Build common string manipulation utilities' },
        ],
        'algorithms': [
          { title: 'Binary Search', prompt: 'Implement binary search algorithm' },
          { title: 'Array Sort Functions', prompt: 'Create custom sorting algorithms for arrays' },
          { title: 'Memoization Helper', prompt: 'Build a memoization utility for function optimization' },
        ]
      },
      python: {
        'api': [
          { title: 'REST API Client', prompt: 'Create a reusable REST API client class' },
          { title: 'FastAPI Endpoint', prompt: 'Build a FastAPI endpoint with validation' },
          { title: 'Authentication Middleware', prompt: 'Implement JWT authentication middleware' },
        ],
        'data-structures': [
          { title: 'Linked List', prompt: 'Implement a doubly linked list data structure' },
          { title: 'Binary Tree', prompt: 'Create a binary search tree with operations' },
          { title: 'Hash Table', prompt: 'Build a hash table implementation' },
        ],
        'ai-ml': [
          { title: 'Data Preprocessor', prompt: 'Create a data preprocessing pipeline' },
          { title: 'Model Evaluator', prompt: 'Build model evaluation and metrics calculator' },
          { title: 'Feature Selector', prompt: 'Implement feature selection algorithms' },
        ]
      }
    };

    return templates[language]?.[category] || [
      { title: 'Custom Function', prompt: `Create a useful ${category} function in ${language}` },
      { title: 'Helper Utility', prompt: `Build a ${category} utility for ${language} applications` },
      { title: 'Class Implementation', prompt: `Implement a ${category} class in ${language}` }
    ];
  }

  // Analyze code and suggest improvements
  async analyzeSnippet(code: string, language: string): Promise<{
    suggestions: string[];
    complexity: 'low' | 'medium' | 'high';
    security: string[];
    performance: string[];
  }> {
    try {
      const prompt = `Analyze this ${language} code and provide improvement suggestions:

\`\`\`${language}
${code}
\`\`\`

Please provide a JSON response with:
{
  "suggestions": ["general improvement suggestions"],
  "complexity": "low|medium|high",
  "security": ["security-related suggestions"],
  "performance": ["performance optimization suggestions"]
}`;

      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        system: "You are a code review expert. Analyze code and provide constructive feedback on improvements, security, and performance."
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Invalid response format from AI');
      }

      return JSON.parse(content.text);
    } catch (error) {
      console.error('Error analyzing snippet:', error);
      return {
        suggestions: ['Unable to analyze code at this time'],
        complexity: 'medium',
        security: [],
        performance: []
      };
    }
  }
}

export const codeSnippetService = new CodeSnippetService();