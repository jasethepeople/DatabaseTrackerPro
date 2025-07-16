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
  private openai: OpenAI | null;

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
  }

  async searchAPIs(userId: number, request: APISearchRequest): Promise<DiscoveredAPI[]> {
    try {
      console.log(`AI API Discovery: Searching for "${request.query}"`);
      return await this.getDemoAPIs(request);
    } catch (error) {
      console.error('AI API Discovery error:', error);
      return await this.getDemoAPIs(request);
    }
  }

  private async getDemoAPIs(request: APISearchRequest): Promise<DiscoveredAPI[]> {
    // Top 10 popular APIs for demonstration
    const demoAPIs: DiscoveredAPI[] = [
      {
        id: 'stripe-payments',
        name: 'Stripe Payments API',
        description: 'Complete payment processing platform with support for cards, digital wallets, and bank transfers',
        baseUrl: 'https://api.stripe.com',
        authType: 'api-key',
        signupUrl: 'https://dashboard.stripe.com/register',
        documentationUrl: 'https://stripe.com/docs/api',
        category: 'payments',
        confidence: 95,
        keyFeatures: ['Payment Processing', 'Subscription Management', 'Marketplace Support', 'Mobile Payments'],
        autoCreationPossible: true
      },
      {
        id: 'twilio-communications',
        name: 'Twilio Communications API',
        description: 'Cloud communications platform for SMS, voice, video, and authentication',
        baseUrl: 'https://api.twilio.com',
        authType: 'api-key',
        signupUrl: 'https://www.twilio.com/try-twilio',
        documentationUrl: 'https://www.twilio.com/docs',
        category: 'communication',
        confidence: 92,
        keyFeatures: ['SMS Messaging', 'Voice Calls', 'Video Conferencing', 'Two-Factor Auth'],
        autoCreationPossible: true
      },
      {
        id: 'openai-ai',
        name: 'OpenAI API',
        description: 'Advanced AI models including GPT-4, DALL-E, and Whisper for text, image, and audio processing',
        baseUrl: 'https://api.openai.com',
        authType: 'bearer',
        signupUrl: 'https://platform.openai.com/signup',
        documentationUrl: 'https://platform.openai.com/docs',
        category: 'ai',
        confidence: 98,
        keyFeatures: ['Text Generation', 'Image Creation', 'Code Completion', 'Audio Transcription'],
        autoCreationPossible: true
      },
      {
        id: 'github-development',
        name: 'GitHub API',
        description: 'Complete development platform with version control, issue tracking, and CI/CD',
        baseUrl: 'https://api.github.com',
        authType: 'oauth',
        signupUrl: 'https://github.com/join',
        documentationUrl: 'https://docs.github.com/en/rest',
        category: 'development',
        confidence: 90,
        keyFeatures: ['Repository Management', 'Issue Tracking', 'Pull Requests', 'Actions CI/CD'],
        autoCreationPossible: false
      },
      {
        id: 'sendgrid-email',
        name: 'SendGrid Email API',
        description: 'Cloud-based email delivery service with advanced analytics and deliverability features',
        baseUrl: 'https://api.sendgrid.com',
        authType: 'api-key',
        signupUrl: 'https://signup.sendgrid.com',
        documentationUrl: 'https://docs.sendgrid.com',
        category: 'communication',
        confidence: 89,
        keyFeatures: ['Email Delivery', 'Template Management', 'Analytics', 'A/B Testing'],
        autoCreationPossible: true
      },
      {
        id: 'aws-s3-storage',
        name: 'AWS S3 Storage API',
        description: 'Scalable object storage service with high durability and availability',
        baseUrl: 'https://s3.amazonaws.com',
        authType: 'bearer',
        signupUrl: 'https://aws.amazon.com/s3/',
        documentationUrl: 'https://docs.aws.amazon.com/s3',
        category: 'cloud',
        confidence: 94,
        keyFeatures: ['Object Storage', 'CDN Integration', 'Backup & Archive', 'Data Analytics'],
        autoCreationPossible: false
      },
      {
        id: 'google-maps',
        name: 'Google Maps API',
        description: 'Comprehensive mapping platform with geocoding, directions, and places data',
        baseUrl: 'https://maps.googleapis.com',
        authType: 'api-key',
        signupUrl: 'https://cloud.google.com/maps-platform',
        documentationUrl: 'https://developers.google.com/maps/documentation',
        category: 'data',
        confidence: 87,
        keyFeatures: ['Maps Display', 'Geocoding', 'Directions', 'Places Search'],
        autoCreationPossible: true
      },
      {
        id: 'slack-workspace',
        name: 'Slack API',
        description: 'Team collaboration platform with messaging, file sharing, and workflow automation',
        baseUrl: 'https://slack.com/api',
        authType: 'oauth',
        signupUrl: 'https://slack.com/get-started',
        documentationUrl: 'https://api.slack.com',
        category: 'communication',
        confidence: 85,
        keyFeatures: ['Team Messaging', 'File Sharing', 'Bot Integration', 'Workflow Automation'],
        autoCreationPossible: false
      },
      {
        id: 'firebase-backend',
        name: 'Firebase API',
        description: 'Google\'s mobile and web application platform with real-time database and hosting',
        baseUrl: 'https://firebase.googleapis.com',
        authType: 'oauth',
        signupUrl: 'https://console.firebase.google.com',
        documentationUrl: 'https://firebase.google.com/docs',
        category: 'development',
        confidence: 88,
        keyFeatures: ['Real-time Database', 'Authentication', 'Cloud Functions', 'Hosting'],
        autoCreationPossible: false
      },
      {
        id: 'paypal-payments',
        name: 'PayPal API',
        description: 'Global payment platform supporting online transactions and digital wallet services',
        baseUrl: 'https://api.paypal.com',
        authType: 'oauth',
        signupUrl: 'https://developer.paypal.com/developer/applications',
        documentationUrl: 'https://developer.paypal.com/docs/api/overview',
        category: 'payments',
        confidence: 83,
        keyFeatures: ['Online Payments', 'Digital Wallet', 'Subscription Billing', 'Marketplace'],
        autoCreationPossible: true
      }
    ];

    // Filter based on request criteria
    let filteredAPIs = demoAPIs;
    
    if (request.category && request.category !== 'all') {
      filteredAPIs = filteredAPIs.filter(api => 
        api.category.toLowerCase().includes(request.category!.toLowerCase())
      );
    }
    
    if (request.query) {
      const query = request.query.toLowerCase();
      filteredAPIs = filteredAPIs.filter(api => 
        api.name.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query) ||
        api.keyFeatures.some(feature => feature.toLowerCase().includes(query))
      );
    }
    
    return filteredAPIs.slice(0, 10);
  }

  async getDiscoveredAPIs(userId: number, category?: string): Promise<any[]> {
    try {
      console.log(`Getting discovered APIs for user ${userId}`);
      
      const demoAPIs = await this.getDemoAPIs({ 
        query: '', 
        category: category || undefined 
      });
      
      return demoAPIs.map(api => ({
        ...api,
        userId,
        createdAt: new Date().toISOString(),
        status: 'discovered'
      }));
    } catch (error) {
      console.error('Error fetching discovered APIs:', error);
      return [];
    }
  }

  async attemptAccountCreation(userId: number, apiId: string): Promise<AccountCreationResult> {
    try {
      console.log(`Attempting account creation for API ${apiId}`);
      
      const demoResult: AccountCreationResult = {
        success: true,
        accountId: `demo_${apiId}_${Date.now()}`,
        apiKey: `demo_key_${apiId.substring(0, 8)}_${Math.random().toString(36).substring(7)}`,
        steps: [
          'Navigated to signup page',
          'Filled registration form with provided details',
          'Verified email address automatically',
          'Generated API key successfully',
          'Configured basic account settings'
        ],
        requiresManualVerification: Math.random() > 0.7
      };

      // Simulate some APIs requiring manual verification
      if (apiId.includes('github') || apiId.includes('aws') || apiId.includes('slack')) {
        demoResult.success = false;
        demoResult.requiresManualVerification = true;
        demoResult.steps.push('Manual verification required - OAuth setup needed');
      }

      return demoResult;
    } catch (error) {
      console.error('Error in account creation:', error);
      return {
        success: false,
        steps: ['Account creation failed'],
        error: 'Service temporarily unavailable'
      };
    }
  }
}

export const aiAPIDiscoveryService = new AIAPIDiscoveryService();