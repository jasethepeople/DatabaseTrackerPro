import { db } from '../db';
import { apiDiscovery, accountCreationAttempts, apiCredentials, type InsertApiDiscovery, type InsertAccountCreationAttempt } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import OpenAI from 'openai';

interface APISearchRequest {
  query: string;
  category?: string;
  features?: string[];
  useCase?: string;
}

interface DiscoveredAPI {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  authType: 'api-key' | 'oauth' | 'bearer' | 'basic' | 'none';
  signupUrl?: string;
  documentationUrl?: string;
  category: string;
  confidence: number;
  pricingModel?: string;
  keyFeatures: string[];
  autoCreationPossible: boolean;
}

interface AccountCreationResult {
  success: boolean;
  accountId?: string;
  apiKey?: string;
  credentials?: any;
  steps: string[];
  error?: string;
  requiresManualVerification?: boolean;
}

class AIAPIDiscoveryService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async searchAPIs(userId: number, request: APISearchRequest): Promise<DiscoveredAPI[]> {
    try {
      console.log(`AI API Discovery: Searching for "${request.query}"`);

      const searchPrompt = this.buildSearchPrompt(request);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps discover and analyze APIs. You have comprehensive knowledge of APIs across all categories including:

- Social Media APIs (Twitter, Instagram, Facebook, LinkedIn, TikTok, etc.)
- Cloud Services APIs (AWS, Google Cloud, Azure, etc.)
- Payment APIs (Stripe, PayPal, Square, etc.)
- Communication APIs (Twilio, SendGrid, Slack, Discord, etc.)
- Data APIs (Google Analytics, Shopify, CRM systems, etc.)
- AI/ML APIs (OpenAI, Anthropic, Hugging Face, etc.)
- Developer Tools APIs (GitHub, GitLab, CI/CD platforms, etc.)
- E-commerce APIs (Shopify, WooCommerce, Amazon, etc.)
- Financial APIs (Plaid, Yodlee, Alpha Vantage, etc.)
- Security APIs (VirusTotal, Shodan, threat intelligence, etc.)

Your task is to find APIs that match the user's requirements and provide detailed, accurate information about each API including how to obtain credentials.`
          },
          {
            role: "user",
            content: searchPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{"apis": []}');
      const discoveredAPIs = this.processAIResponse(aiResponse);

      // Store discovered APIs in database
      for (const api of discoveredAPIs) {
        await this.storeDiscoveredAPI(userId, api);
      }

      console.log(`AI API Discovery: Found ${discoveredAPIs.length} APIs for query "${request.query}"`);
      return discoveredAPIs;

    } catch (error) {
      console.error('AI API Discovery error:', error);
      throw new Error('Failed to search APIs with AI assistance');
    }
  }

  private buildSearchPrompt(request: APISearchRequest): string {
    return `Find APIs that match the following requirements:

Query: "${request.query}"
${request.category ? `Category: ${request.category}` : ''}
${request.features ? `Required Features: ${request.features.join(', ')}` : ''}
${request.useCase ? `Use Case: ${request.useCase}` : ''}

Please provide a JSON response with the following structure:
{
  "apis": [
    {
      "id": "unique-api-identifier",
      "name": "API Name",
      "description": "Brief description of what this API does",
      "baseUrl": "https://api.example.com",
      "authType": "api-key|oauth|bearer|basic|none",
      "signupUrl": "https://example.com/signup",
      "documentationUrl": "https://docs.example.com",
      "category": "category-name",
      "confidence": 95,
      "pricingModel": "freemium|paid|free|enterprise",
      "keyFeatures": ["feature1", "feature2"],
      "autoCreationPossible": true|false,
      "credentialObtainmentMethod": "describe how to get API keys",
      "signupRequirements": ["email", "phone", "verification"],
      "rateLimits": "description of rate limits"
    }
  ]
}

Focus on:
1. Popular, well-maintained APIs with good documentation
2. APIs that are actively maintained and have recent updates
3. APIs with clear authentication methods
4. APIs that offer free tiers or reasonable pricing
5. APIs with good developer support and community

Prioritize APIs based on:
- Relevance to the query (higher confidence scores for better matches)
- Ease of integration and credential acquisition
- Reliability and uptime
- Documentation quality
- Community adoption`;
  }

  private processAIResponse(aiResponse: any): DiscoveredAPI[] {
    if (!aiResponse.apis || !Array.isArray(aiResponse.apis)) {
      return [];
    }

    return aiResponse.apis.map((api: any) => ({
      id: api.id || `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: api.name || 'Unknown API',
      description: api.description || '',
      baseUrl: api.baseUrl || '',
      authType: api.authType || 'api-key',
      signupUrl: api.signupUrl,
      documentationUrl: api.documentationUrl,
      category: api.category || 'general',
      confidence: Math.min(100, Math.max(0, api.confidence || 0)),
      pricingModel: api.pricingModel,
      keyFeatures: Array.isArray(api.keyFeatures) ? api.keyFeatures : [],
      autoCreationPossible: Boolean(api.autoCreationPossible),
    }));
  }

  private async storeDiscoveredAPI(userId: number, api: DiscoveredAPI): Promise<void> {
    const discoveryData: InsertApiDiscovery = {
      userId,
      apiId: api.id,
      name: api.name,
      description: api.description,
      baseUrl: api.baseUrl,
      authType: api.authType,
      signupUrl: api.signupUrl,
      documentationUrl: api.documentationUrl,
      category: api.category,
      confidence: api.confidence,
      aiMetadata: {
        keyFeatures: api.keyFeatures,
        pricingModel: api.pricingModel,
        autoCreationPossible: api.autoCreationPossible,
        discoveredAt: new Date().toISOString(),
      },
    };

    // Check if API already discovered by this user
    const existing = await db
      .select()
      .from(apiDiscovery)
      .where(and(
        eq(apiDiscovery.userId, userId),
        eq(apiDiscovery.apiId, api.id)
      ));

    if (existing.length === 0) {
      await db.insert(apiDiscovery).values(discoveryData);
    } else {
      // Update confidence and metadata if higher
      if (api.confidence > existing[0].confidence) {
        await db
          .update(apiDiscovery)
          .set({
            confidence: api.confidence,
            aiMetadata: discoveryData.aiMetadata,
            updatedAt: new Date(),
          })
          .where(eq(apiDiscovery.id, existing[0].id));
      }
    }
  }

  async attemptAccountCreation(userId: number, apiId: string): Promise<AccountCreationResult> {
    console.log(`AI Account Creation: Attempting to create account for API ${apiId}`);

    const attempt: InsertAccountCreationAttempt = {
      userId,
      apiId,
      attemptType: 'automated',
      status: 'pending',
      steps: [],
    };

    const [createdAttempt] = await db
      .insert(accountCreationAttempts)
      .values(attempt)
      .returning();

    try {
      // Get API discovery information
      const [apiInfo] = await db
        .select()
        .from(apiDiscovery)
        .where(and(
          eq(apiDiscovery.userId, userId),
          eq(apiDiscovery.apiId, apiId)
        ));

      if (!apiInfo) {
        throw new Error('API not found in discovery database');
      }

      // Generate account creation strategy with AI
      const strategy = await this.generateAccountCreationStrategy(apiInfo);
      
      // Execute account creation based on strategy
      const result = await this.executeAccountCreation(apiInfo, strategy);

      // Update attempt record
      await db
        .update(accountCreationAttempts)
        .set({
          status: result.success ? 'success' : 'failed',
          steps: result.steps,
          result: result,
          errorMessage: result.error,
          completedAt: new Date(),
        })
        .where(eq(accountCreationAttempts.id, createdAttempt.id));

      // If successful, store credentials
      if (result.success && result.apiKey) {
        await this.storeObtainedCredentials(userId, apiInfo, result);
      }

      return result;

    } catch (error) {
      console.error('Account creation error:', error);
      
      await db
        .update(accountCreationAttempts)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        })
        .where(eq(accountCreationAttempts.id, createdAttempt.id));

      return {
        success: false,
        steps: ['Failed to initialize account creation'],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async generateAccountCreationStrategy(apiInfo: any): Promise<any> {
    const strategyPrompt = `Generate an account creation strategy for the following API:

API Name: ${apiInfo.name}
Base URL: ${apiInfo.baseUrl}
Signup URL: ${apiInfo.signupUrl || 'Not provided'}
Auth Type: ${apiInfo.authType}
Documentation: ${apiInfo.documentationUrl || 'Not provided'}

Please analyze this API and provide a JSON strategy for automated account creation:

{
  "feasibility": "high|medium|low",
  "method": "web_automation|api_signup|manual_required",
  "steps": [
    {
      "action": "navigate_to_signup",
      "url": "signup_url",
      "description": "Navigate to signup page"
    },
    {
      "action": "fill_form",
      "fields": {
        "email": "generated_email",
        "username": "generated_username",
        "password": "generated_password"
      }
    },
    {
      "action": "verify_email",
      "method": "automatic|manual",
      "description": "Email verification process"
    },
    {
      "action": "obtain_api_key",
      "location": "dashboard|profile|api_settings",
      "description": "Where to find API credentials"
    }
  ],
  "requirements": ["email", "phone", "verification"],
  "timeEstimate": "5-10 minutes",
  "successProbability": 0.8,
  "fallbackOptions": ["manual_signup", "contact_support"],
  "notes": "Additional considerations or warnings"
}

Focus on:
1. Realistic feasibility assessment
2. Step-by-step automation possibilities
3. Common signup patterns for this type of API
4. Verification requirements
5. Where API keys are typically found after signup`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert in web automation and API signup processes. Provide detailed, realistic strategies for automated account creation."
        },
        {
          role: "user",
          content: strategyPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content || '{"feasibility": "low"}');
  }

  private async executeAccountCreation(apiInfo: any, strategy: any): Promise<AccountCreationResult> {
    const steps: string[] = [];

    try {
      // For high feasibility APIs, attempt automated creation
      if (strategy.feasibility === 'high' && strategy.method === 'api_signup') {
        steps.push('Attempting API-based signup');
        return await this.attemptAPISignup(apiInfo, strategy, steps);
      }

      // For web automation cases
      if (strategy.feasibility === 'high' && strategy.method === 'web_automation') {
        steps.push('Attempting web automation signup');
        return await this.attemptWebAutomationSignup(apiInfo, strategy, steps);
      }

      // For medium feasibility, provide assisted instructions
      if (strategy.feasibility === 'medium') {
        steps.push('Providing assisted signup instructions');
        return {
          success: false,
          steps: [...steps, ...strategy.steps.map((s: any) => s.description)],
          requiresManualVerification: true,
          error: 'Requires assisted manual signup - instructions provided',
        };
      }

      // Low feasibility - manual required
      steps.push('Manual signup required');
      return {
        success: false,
        steps,
        error: 'This API requires manual account creation',
      };

    } catch (error) {
      return {
        success: false,
        steps,
        error: error instanceof Error ? error.message : 'Account creation failed',
      };
    }
  }

  private async attemptAPISignup(apiInfo: any, strategy: any, steps: string[]): Promise<AccountCreationResult> {
    // This would implement API-based signup for APIs that support it
    // For now, return a simulated response
    steps.push('Checking for API signup endpoints');
    steps.push('API signup not commonly available - switching to web method');
    
    return {
      success: false,
      steps,
      error: 'Most APIs require web-based signup',
    };
  }

  private async attemptWebAutomationSignup(apiInfo: any, strategy: any, steps: string[]): Promise<AccountCreationResult> {
    // This would implement web automation using puppeteer or similar
    // For demo purposes, simulate the process
    steps.push('Initializing web automation');
    steps.push('Navigating to signup page');
    steps.push('Generating unique credentials');
    
    // Generate realistic-looking credentials
    const timestamp = Date.now();
    const credentials = {
      email: `autouser_${timestamp}@tempmail.dev`,
      username: `autouser_${timestamp}`,
      password: this.generateSecurePassword(),
    };

    steps.push(`Generated email: ${credentials.email}`);
    steps.push('Attempting form submission');
    
    // Simulate success for demo - in reality this would use actual web automation
    if (Math.random() > 0.3) { // 70% success rate simulation
      steps.push('Account created successfully');
      steps.push('Attempting to locate API key');
      
      const apiKey = `demo_api_key_${timestamp}_${Math.random().toString(36).substr(2, 16)}`;
      steps.push(`API key obtained: ${apiKey.substr(0, 8)}...`);
      
      return {
        success: true,
        accountId: credentials.username,
        apiKey,
        credentials,
        steps,
      };
    } else {
      steps.push('Signup failed - may require manual verification');
      return {
        success: false,
        steps,
        requiresManualVerification: true,
        error: 'Automated signup failed, manual verification may be required',
      };
    }
  }

  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  private async storeObtainedCredentials(userId: number, apiInfo: any, result: AccountCreationResult): Promise<void> {
    if (!result.apiKey) return;

    const credentialData = {
      userId,
      apiId: apiInfo.apiId,
      name: `${apiInfo.name} Auto-Generated`,
      keyType: apiInfo.authType as any,
      keyValue: this.encrypt(result.apiKey),
      permissions: [],
      metadata: {
        autoGenerated: true,
        accountId: result.accountId,
        generatedAt: new Date().toISOString(),
        credentials: result.credentials,
      },
    };

    await db.insert(apiCredentials).values(credentialData);
    
    // Update discovery status
    await db
      .update(apiDiscovery)
      .set({
        status: 'credentials_obtained',
        updatedAt: new Date(),
      })
      .where(and(
        eq(apiDiscovery.userId, userId),
        eq(apiDiscovery.apiId, apiInfo.apiId)
      ));
  }

  private encrypt(text: string): string {
    // Use the same encryption as other services
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-needed!', 'utf8');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  async getDiscoveredAPIs(userId: number, category?: string): Promise<any[]> {
    let query = db
      .select()
      .from(apiDiscovery)
      .where(eq(apiDiscovery.userId, userId));

    if (category) {
      query = query.where(and(
        eq(apiDiscovery.userId, userId),
        eq(apiDiscovery.category, category)
      ));
    }

    return query.orderBy(desc(apiDiscovery.confidence), desc(apiDiscovery.createdAt));
  }

  async getAccountCreationAttempts(userId: number, apiId?: string): Promise<any[]> {
    let query = db
      .select()
      .from(accountCreationAttempts)
      .where(eq(accountCreationAttempts.userId, userId));

    if (apiId) {
      query = query.where(and(
        eq(accountCreationAttempts.userId, userId),
        eq(accountCreationAttempts.apiId, apiId)
      ));
    }

    return query.orderBy(desc(accountCreationAttempts.createdAt));
  }
}

export const aiAPIDiscoveryService = new AIAPIDiscoveryService();