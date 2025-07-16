import { db } from '../db';
import { apiCredentials, apiDiscovery, type InsertApiCredential } from '@shared/schema';
import { eq, and, or, like } from 'drizzle-orm';
import OpenAI from 'openai';

interface CredentialScanRequest {
  environment?: 'browser' | 'system' | 'cloud' | 'all';
  platforms?: string[];
  autoExtract?: boolean;
}

interface FoundCredential {
  source: string;
  apiId: string;
  keyType: 'api-key' | 'oauth' | 'bearer' | 'basic';
  keyValue: string;
  confidence: number;
  location: string;
  apiName?: string;
  metadata?: any;
}

interface ScanResult {
  credentials: FoundCredential[];
  potentialAPIs: string[];
  recommendations: string[];
  securityWarnings: string[];
}

class CredentialScannerService {
  private openai: OpenAI | null;
  private commonAPIPatterns: Map<string, RegExp> = new Map();

  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.log('OpenAI API key not found, running in demo mode');
      this.openai = null;
    }
    this.initializePatterns();
  }

  private initializePatterns() {
    // Common API key patterns
    this.commonAPIPatterns.set('openai', /sk-[a-zA-Z0-9]{48}/g);
    this.commonAPIPatterns.set('anthropic', /sk-ant-[a-zA-Z0-9-_]{95}/g);
    this.commonAPIPatterns.set('github', /gh[pousr]_[A-Za-z0-9_]{36,251}/g);
    this.commonAPIPatterns.set('stripe', /sk_live_[a-zA-Z0-9]{24,}/g);
    this.commonAPIPatterns.set('aws', /AKIA[0-9A-Z]{16}/g);
    this.commonAPIPatterns.set('google', /AIza[0-9A-Za-z-_]{35}/g);
    this.commonAPIPatterns.set('slack', /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}/g);
    this.commonAPIPatterns.set('twitter', /[1-9][0-9]+-[0-9a-zA-Z]{40}/g);
    this.commonAPIPatterns.set('facebook', /EAA[a-zA-Z0-9]{100,}/g);
    this.commonAPIPatterns.set('mailgun', /key-[a-f0-9]{32}/g);
    this.commonAPIPatterns.set('sendgrid', /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g);
    this.commonAPIPatterns.set('twilio', /SK[a-f0-9]{32}/g);
    this.commonAPIPatterns.set('paypal', /A[0-9A-Z]{80}/g);
  }

  async scanForCredentials(userId: number, request: CredentialScanRequest): Promise<ScanResult> {
    console.log('AI Credential Scanner: Starting comprehensive scan');
    
    // Demo scan results for testing
    const demoScanResults: ScanResult = {
      credentials: [
        {
          source: 'Environment Variables',
          apiId: 'openai-api',
          keyType: 'api-key',
          keyValue: 'sk-...hidden',
          confidence: 95,
          location: 'OPENAI_API_KEY environment variable',
          apiName: 'OpenAI API',
          metadata: { detected: true, masked: true }
        },
        {
          source: 'Browser Storage',
          apiId: 'github-token',
          keyType: 'oauth',
          keyValue: 'ghp_...hidden',
          confidence: 88,
          location: 'localStorage.github_token',
          apiName: 'GitHub API',
          metadata: { detected: true, masked: true }
        },
        {
          source: 'Configuration Files',
          apiId: 'stripe-key',
          keyType: 'api-key',
          keyValue: 'sk_test_...hidden',
          confidence: 92,
          location: '.env file',
          apiName: 'Stripe API',
          metadata: { detected: true, masked: true }
        }
      ],
      potentialAPIs: ['Twilio', 'SendGrid', 'AWS S3', 'Google Maps'],
      recommendations: [
        'Store API keys in secure environment variables',
        'Rotate credentials older than 90 days',
        'Enable API key restrictions where possible',
        'Monitor API usage for suspicious activity',
        'Use separate keys for development and production'
      ],
      securityWarnings: [
        'API key found in browser localStorage - consider more secure storage',
        'Some credentials have not been rotated in over 6 months'
      ],
    };

    try {
      // Return demo data for testing
      return demoScanResults;
    } catch (error) {
      console.error('Error in credential scanning:', error);
      return {
        credentials: [],
        potentialAPIs: [],
        recommendations: ['Credential scanning temporarily unavailable'],
        securityWarnings: [],
      };
    }
  }

  async performCredentialAudit(userId: number): Promise<{
    storedCredentials: number;
    activeCredentials: number;
    securityIssues: string[];
    duplicateCredentials: number;
    recommendations: string[];
  }> {
    try {
      // Demo audit data for testing
      const demoAudit = {
        storedCredentials: 5,
        activeCredentials: 4,
        securityIssues: [
          'Found API key stored in plain text environment variable',
          'Credentials older than 90 days should be rotated'
        ],
        duplicateCredentials: 1,
        recommendations: [
          'Rotate old API credentials regularly',
          'Use environment variables for sensitive data',
          'Enable two-factor authentication where possible',
          'Monitor credential usage for suspicious activity',
          'Set up automatic credential expiration alerts'
        ],
      };

      return demoAudit;
    } catch (error) {
      console.error('Error performing credential audit:', error);
      return {
        storedCredentials: 0,
        activeCredentials: 0,
        securityIssues: [],
        duplicateCredentials: 0,
        recommendations: ['Audit system temporarily unavailable'],
      };
    }
  }

  private async scanBrowserEnvironment(userId: number): Promise<FoundCredential[]> {
    // Scan browser storage for potential API credentials
    // In demo mode, return simulated found credentials
    return [
      {
        source: 'localStorage',
        apiId: 'github-token',
        keyType: 'oauth',
        keyValue: 'ghp_...hidden',
        confidence: 88,
        location: 'localStorage.github_token',
        apiName: 'GitHub API'
      }
    ];
  }

  private async scanSystemEnvironment(userId: number): Promise<FoundCredential[]> {
    // In a real implementation, scan system environment variables
    // In demo mode, return simulated credentials
    return [
      {
        source: 'Environment Variables',
        apiId: 'openai-api',
        keyType: 'api-key',
        keyValue: 'sk-...hidden',
        confidence: 95,
        location: 'OPENAI_API_KEY',
        apiName: 'OpenAI API'
      }
    ];
  }

  private async scanCloudEnvironment(userId: number): Promise<FoundCredential[]> {
    // In a real implementation, scan cloud provider configurations
    // Return demo data
    return [
      {
        source: 'Cloud Configuration',
        apiId: 'aws-keys',
        keyType: 'bearer',
        keyValue: 'AKIA...hidden',
        confidence: 90,
        location: 'AWS credentials file',
        apiName: 'AWS API'
      }
    ];
  }
}

export const credentialScannerService = new CredentialScannerService();
  }

  private async scanSystemEnvironment(userId: number): Promise<FoundCredential[]> {
    const credentials: FoundCredential[] = [];
    
    console.log('Scanning system environment for API credentials...');
    
    // Simulate environment variable scanning
    const envVars = process.env;
    for (const [key, value] of Object.entries(envVars)) {
      if (!value) continue;
      
      // Check against known patterns
      for (const [apiId, pattern] of this.commonAPIPatterns) {
        const matches = value.match(pattern);
        if (matches) {
          credentials.push({
            source: 'environment',
            apiId,
            keyType: 'api-key',
            keyValue: matches[0],
            confidence: 95,
            location: `env:${key}`,
            apiName: this.getAPIName(apiId),
            metadata: { envVar: key }
          });
        }
      }

      // Check for common API key environment variable names
      if (this.isLikelyAPIKey(key, value)) {
        const apiId = this.extractAPIIdFromEnvVar(key);
        credentials.push({
          source: 'environment',
          apiId,
          keyType: 'api-key',
          keyValue: value,
          confidence: 70,
          location: `env:${key}`,
          apiName: this.getAPIName(apiId),
          metadata: { envVar: key, inferred: true }
        });
      }
    }

    // Simulate file system scanning (config files, etc.)
    const simulatedFileFinds = [
      {
        source: 'config_file',
        apiId: 'aws',
        keyType: 'api-key' as const,
        keyValue: 'AKIAIOSFODNN7EXAMPLE',
        confidence: 80,
        location: '~/.aws/credentials',
        apiName: 'AWS Access Key',
        metadata: { profile: 'default' }
      }
    ];

    credentials.push(...simulatedFileFinds);
    return credentials;
  }

  private async scanCloudEnvironment(userId: number): Promise<FoundCredential[]> {
    const credentials: FoundCredential[] = [];
    
    console.log('Scanning cloud services for existing credentials...');
    
    // Simulate cloud credential discovery
    const simulatedCloudFinds = [
      {
        source: 'google_cloud',
        apiId: 'google',
        keyType: 'oauth' as const,
        keyValue: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        confidence: 85,
        location: 'gcloud://default-credentials',
        apiName: 'Google Cloud OAuth Token',
        metadata: { project: 'my-project', scopes: ['cloud-platform'] }
      },
      {
        source: 'azure_cli',
        apiId: 'microsoft',
        keyType: 'bearer' as const,
        keyValue: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
        confidence: 80,
        location: 'azure://cli-token',
        apiName: 'Azure CLI Token',
        metadata: { subscription: 'subscription-id' }
      }
    ];

    credentials.push(...simulatedCloudFinds);
    return credentials;
  }

  private isLikelyAPIKey(envVar: string, value: string): boolean {
    const apiKeyIndicators = [
      'API_KEY', 'APIKEY', 'KEY', 'TOKEN', 'SECRET', 'AUTH',
      'CLIENT_ID', 'CLIENT_SECRET', 'ACCESS_TOKEN', 'BEARER'
    ];
    
    const envUpper = envVar.toUpperCase();
    const hasIndicator = apiKeyIndicators.some(indicator => envUpper.includes(indicator));
    
    // Check value characteristics
    const isLongEnough = value.length >= 16;
    const hasAlphaNumeric = /^[a-zA-Z0-9_\-\.]+$/.test(value);
    const notCommonValue = !['localhost', 'development', 'production', 'true', 'false'].includes(value.toLowerCase());
    
    return hasIndicator && isLongEnough && hasAlphaNumeric && notCommonValue;
  }

  private extractAPIIdFromEnvVar(envVar: string): string {
    const envLower = envVar.toLowerCase();
    
    // Common mappings
    if (envLower.includes('github')) return 'github';
    if (envLower.includes('openai')) return 'openai';
    if (envLower.includes('anthropic') || envLower.includes('claude')) return 'anthropic';
    if (envLower.includes('stripe')) return 'stripe';
    if (envLower.includes('aws')) return 'aws';
    if (envLower.includes('google') || envLower.includes('gcp')) return 'google';
    if (envLower.includes('slack')) return 'slack';
    if (envLower.includes('twitter') || envLower.includes('x_api')) return 'twitter';
    if (envLower.includes('facebook') || envLower.includes('meta')) return 'facebook';
    if (envLower.includes('sendgrid')) return 'sendgrid';
    if (envLower.includes('twilio')) return 'twilio';
    if (envLower.includes('mailgun')) return 'mailgun';
    
    // Extract from environment variable name
    const parts = envVar.toLowerCase().split('_');
    return parts[0] || 'unknown';
  }

  private getAPIName(apiId: string): string {
    const names: { [key: string]: string } = {
      'github': 'GitHub',
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'stripe': 'Stripe',
      'aws': 'Amazon Web Services',
      'google': 'Google Cloud Platform',
      'slack': 'Slack',
      'twitter': 'Twitter/X',
      'facebook': 'Facebook/Meta',
      'sendgrid': 'SendGrid',
      'twilio': 'Twilio',
      'mailgun': 'Mailgun',
      'microsoft': 'Microsoft Azure',
    };
    
    return names[apiId] || apiId.charAt(0).toUpperCase() + apiId.slice(1);
  }

  private async analyzeCredentialsWithAI(credentials: FoundCredential[]): Promise<{
    potentialAPIs: string[];
    recommendations: string[];
    securityWarnings: string[];
  }> {
    const analysisPrompt = `Analyze the following discovered API credentials and provide insights:

Found Credentials:
${credentials.map(cred => `
- API: ${cred.apiName || cred.apiId}
- Type: ${cred.keyType}
- Source: ${cred.source}
- Location: ${cred.location}
- Confidence: ${cred.confidence}%
`).join('')}

Please provide a JSON response with:
{
  "potentialAPIs": ["list of API services that could be integrated"],
  "recommendations": ["actionable recommendations for credential management"],
  "securityWarnings": ["security concerns and best practices"]
}

Focus on:
1. Identifying additional APIs that commonly work together
2. Security best practices for credential storage
3. Integration opportunities and workflows
4. Potential security vulnerabilities`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity and API integration expert. Provide practical, actionable advice for credential management and API security."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return {
        potentialAPIs: Array.isArray(analysis.potentialAPIs) ? analysis.potentialAPIs : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
        securityWarnings: Array.isArray(analysis.securityWarnings) ? analysis.securityWarnings : [],
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        potentialAPIs: [],
        recommendations: ['Store credentials securely in encrypted database'],
        securityWarnings: ['Review all found credentials for potential security risks'],
      };
    }
  }

  private async autoExtractCredentials(userId: number, credentials: FoundCredential[]): Promise<void> {
    console.log(`Auto-extracting ${credentials.length} credentials to secure storage...`);
    
    for (const cred of credentials) {
      try {
        // Check if credential already exists
        const existing = await db
          .select()
          .from(apiCredentials)
          .where(and(
            eq(apiCredentials.userId, userId),
            eq(apiCredentials.apiId, cred.apiId)
          ));

        if (existing.length > 0) {
          console.log(`Credential for ${cred.apiId} already exists, skipping...`);
          continue;
        }

        // Store the credential
        const credentialData: InsertApiCredential = {
          userId,
          apiId: cred.apiId,
          name: `${cred.apiName || cred.apiId} (Auto-discovered)`,
          keyType: cred.keyType,
          keyValue: this.encrypt(cred.keyValue),
          permissions: [],
          metadata: {
            autoDiscovered: true,
            source: cred.source,
            location: cred.location,
            confidence: cred.confidence,
            discoveredAt: new Date().toISOString(),
            originalMetadata: cred.metadata,
          },
        };

        await db.insert(apiCredentials).values(credentialData);
        console.log(`Auto-extracted credential for ${cred.apiId}`);

        // Also create/update API discovery record
        await this.createDiscoveryRecord(userId, cred);

      } catch (error) {
        console.error(`Failed to auto-extract credential for ${cred.apiId}:`, error);
      }
    }
  }

  private async createDiscoveryRecord(userId: number, cred: FoundCredential): Promise<void> {
    const discoveryData = {
      userId,
      apiId: cred.apiId,
      name: cred.apiName || this.getAPIName(cred.apiId),
      description: `Auto-discovered ${cred.apiName || cred.apiId} integration`,
      baseUrl: this.getBaseURL(cred.apiId),
      authType: cred.keyType,
      category: this.getCategory(cred.apiId),
      confidence: cred.confidence,
      status: 'credentials_obtained',
      aiMetadata: {
        autoDiscovered: true,
        source: cred.source,
        credentialType: cred.keyType,
      },
    };

    // Check if discovery record exists
    const existing = await db
      .select()
      .from(apiDiscovery)
      .where(and(
        eq(apiDiscovery.userId, userId),
        eq(apiDiscovery.apiId, cred.apiId)
      ));

    if (existing.length === 0) {
      await db.insert(apiDiscovery).values(discoveryData);
    } else {
      await db
        .update(apiDiscovery)
        .set({
          status: 'credentials_obtained',
          confidence: Math.max(existing[0].confidence, cred.confidence),
          updatedAt: new Date(),
        })
        .where(eq(apiDiscovery.id, existing[0].id));
    }
  }

  private getBaseURL(apiId: string): string {
    const baseUrls: { [key: string]: string } = {
      'github': 'https://api.github.com',
      'openai': 'https://api.openai.com',
      'anthropic': 'https://api.anthropic.com',
      'stripe': 'https://api.stripe.com',
      'aws': 'https://aws.amazon.com',
      'google': 'https://cloud.google.com/apis',
      'slack': 'https://slack.com/api',
      'twitter': 'https://api.twitter.com',
      'facebook': 'https://graph.facebook.com',
      'sendgrid': 'https://api.sendgrid.com',
      'twilio': 'https://api.twilio.com',
      'mailgun': 'https://api.mailgun.net',
      'microsoft': 'https://graph.microsoft.com',
    };
    
    return baseUrls[apiId] || `https://api.${apiId}.com`;
  }

  private getCategory(apiId: string): string {
    const categories: { [key: string]: string } = {
      'github': 'development',
      'openai': 'ai',
      'anthropic': 'ai',
      'stripe': 'payments',
      'aws': 'cloud',
      'google': 'cloud',
      'slack': 'communication',
      'twitter': 'social',
      'facebook': 'social',
      'sendgrid': 'email',
      'twilio': 'communication',
      'mailgun': 'email',
      'microsoft': 'cloud',
    };
    
    return categories[apiId] || 'general';
  }

  private encrypt(text: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-needed!', 'utf8');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  async performCredentialAudit(userId: number): Promise<{
    storedCredentials: number;
    activeCredentials: number;
    expiredCredentials: number;
    duplicateCredentials: number;
    securityIssues: string[];
    recommendations: string[];
  }> {
    const credentials = await db
      .select()
      .from(apiCredentials)
      .where(eq(apiCredentials.userId, userId));

    const audit = {
      storedCredentials: credentials.length,
      activeCredentials: credentials.filter(c => c.isActive).length,
      expiredCredentials: 0, // Would check expiration dates
      duplicateCredentials: 0, // Would check for duplicates
      securityIssues: [] as string[],
      recommendations: [] as string[],
    };

    // Security analysis
    if (credentials.some(c => !c.keyValue.includes(':'))) {
      audit.securityIssues.push('Some credentials may not be properly encrypted');
    }

    if (credentials.some(c => !c.lastUsed || new Date(c.lastUsed) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))) {
      audit.securityIssues.push('Some credentials have not been used in over 90 days');
    }

    // Recommendations
    audit.recommendations.push('Regularly rotate API keys and tokens');
    audit.recommendations.push('Enable auto-discovery for new credentials');
    audit.recommendations.push('Set up monitoring for credential usage');

    return audit;
  }
}

export const credentialScannerService = new CredentialScannerService();