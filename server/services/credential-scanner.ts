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

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.log('OpenAI API key not found, running in demo mode');
      this.openai = null;
    }
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
}

export const credentialScannerService = new CredentialScannerService();