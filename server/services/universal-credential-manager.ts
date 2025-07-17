import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { credentials, credentialUsageLog } from '../../shared/schema';
import { eq, and, or, like } from 'drizzle-orm';
import axios from 'axios';

interface CredentialPattern {
  pattern: RegExp;
  type: string;
  extractor: (match: RegExpMatchArray) => { key: string; value: string; metadata?: any };
}

interface StoredCredential {
  id: number;
  service: string;
  type: string;
  identifier: string;
  encryptedValue: string;
  metadata: any;
  lastUsed: Date;
  useCount: number;
  autoDetected: boolean;
}

export class UniversalCredentialManager {
  private static instance: UniversalCredentialManager;
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  // Comprehensive credential patterns
  private patterns: CredentialPattern[] = [
    // API Keys
    {
      pattern: /(?:api[_-]?key|apikey|api_token|access[_-]?key)[\s:=]+["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
      type: 'api_key',
      extractor: (match) => ({ key: 'api_key', value: match[1] })
    },
    // Bearer Tokens
    {
      pattern: /(?:bearer|token|auth[_-]?token|access[_-]?token)[\s:=]+["']?([a-zA-Z0-9_\-\.]{20,})["']?/gi,
      type: 'bearer_token',
      extractor: (match) => ({ key: 'bearer_token', value: match[1] })
    },
    // GitHub Personal Access Tokens
    {
      pattern: /(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})/g,
      type: 'github_token',
      extractor: (match) => ({ key: 'github_token', value: match[1] })
    },
    // GitLab Tokens
    {
      pattern: /(glpat-[a-zA-Z0-9\-_]{20})/g,
      type: 'gitlab_token',
      extractor: (match) => ({ key: 'gitlab_token', value: match[1] })
    },
    // AWS Credentials
    {
      pattern: /(?:aws[_-]?access[_-]?key[_-]?id|AKIA[A-Z0-9]{16})[\s:=]+["']?([A-Z0-9]{20})["']?/gi,
      type: 'aws_access_key',
      extractor: (match) => ({ key: 'aws_access_key_id', value: match[1] })
    },
    {
      pattern: /(?:aws[_-]?secret[_-]?access[_-]?key)[\s:=]+["']?([a-zA-Z0-9/\+]{40})["']?/gi,
      type: 'aws_secret_key',
      extractor: (match) => ({ key: 'aws_secret_access_key', value: match[1] })
    },
    // Database URLs
    {
      pattern: /(postgres(?:ql)?|mysql|mongodb|redis):\/\/([^:]+):([^@]+)@([^\/]+)(?:\/([^\s?]+))?/gi,
      type: 'database_url',
      extractor: (match) => ({
        key: 'database_url',
        value: match[0],
        metadata: {
          type: match[1],
          username: match[2],
          password: match[3],
          host: match[4],
          database: match[5]
        }
      })
    },
    // OAuth Credentials
    {
      pattern: /(?:client[_-]?id|oauth[_-]?id)[\s:=]+["']?([a-zA-Z0-9_\-\.]{10,})["']?/gi,
      type: 'oauth_client_id',
      extractor: (match) => ({ key: 'client_id', value: match[1] })
    },
    {
      pattern: /(?:client[_-]?secret|oauth[_-]?secret)[\s:=]+["']?([a-zA-Z0-9_\-\.]{20,})["']?/gi,
      type: 'oauth_client_secret',
      extractor: (match) => ({ key: 'client_secret', value: match[1] })
    },
    // OAuth Access Tokens
    {
      pattern: /(?:access[_-]?token)[\s:=]+["']?([a-zA-Z0-9_\-\.\/\+]{20,})["']?/gi,
      type: 'oauth_access_token',
      extractor: (match) => ({ key: 'access_token', value: match[1] })
    },
    // OAuth Refresh Tokens
    {
      pattern: /(?:refresh[_-]?token)[\s:=]+["']?([a-zA-Z0-9_\-\.\/\+]{20,})["']?/gi,
      type: 'oauth_refresh_token',
      extractor: (match) => ({ key: 'refresh_token', value: match[1] })
    },
    // Email/Password combinations
    {
      pattern: /(?:email|username|user)[\s:=]+["']?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["']?\s*(?:password|pass|pwd)[\s:=]+["']?([^\s"']+)["']?/gi,
      type: 'email_password',
      extractor: (match) => ({
        key: 'credentials',
        value: JSON.stringify({ email: match[1], password: match[2] }),
        metadata: { email: match[1] }
      })
    },
    // JWT Tokens
    {
      pattern: /(eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/g,
      type: 'jwt_token',
      extractor: (match) => ({ key: 'jwt_token', value: match[1] })
    },
    // Stripe Keys
    {
      pattern: /(sk_(?:test|live)_[a-zA-Z0-9]{24}|pk_(?:test|live)_[a-zA-Z0-9]{24})/g,
      type: 'stripe_key',
      extractor: (match) => ({ 
        key: match[1].startsWith('sk_') ? 'stripe_secret_key' : 'stripe_public_key',
        value: match[1]
      })
    },
    // Generic Secrets
    {
      pattern: /(?:secret|private[_-]?key|auth[_-]?key)[\s:=]+["']?([a-zA-Z0-9_\-\.\/\+]{16,})["']?/gi,
      type: 'generic_secret',
      extractor: (match) => ({ key: 'secret', value: match[1] })
    }
  ];

  private constructor() {
    // Use environment variable or generate a key
    const envKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    this.key = envKey 
      ? Buffer.from(envKey, 'hex')
      : crypto.scryptSync('universal-credential-key', 'salt', 32);
  }

  static getInstance(): UniversalCredentialManager {
    if (!this.instance) {
      this.instance = new UniversalCredentialManager();
    }
    return this.instance;
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  private decrypt(encryptedData: string): string {
    const data = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Scan text for credentials
  async scanForCredentials(text: string, source: string = 'unknown'): Promise<StoredCredential[]> {
    const detectedCredentials: StoredCredential[] = [];
    
    for (const pattern of this.patterns) {
      let match;
      while ((match = pattern.pattern.exec(text)) !== null) {
        try {
          const extracted = pattern.extractor(match);
          
          // Determine service from context
          const service = this.detectService(text, match.index, source);
          
          // Check if we already have this credential
          const existing = await this.findCredential(service, pattern.type, extracted.value);
          
          if (!existing) {
            // Store new credential
            const stored = await this.storeCredential({
              service,
              type: pattern.type,
              identifier: extracted.key,
              value: extracted.value,
              metadata: extracted.metadata,
              autoDetected: true
            });
            
            detectedCredentials.push(stored);
            console.log(`Auto-detected ${pattern.type} for ${service}`);
          }
        } catch (error) {
          console.error(`Error processing credential match:`, error);
        }
      }
    }
    
    return detectedCredentials;
  }

  // Intelligent service detection from context
  private detectService(text: string, position: number, source: string): string {
    // Look for service indicators near the credential
    const contextRadius = 200;
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(text.length, position + contextRadius);
    const context = text.substring(start, end).toLowerCase();
    
    // Service detection patterns
    const servicePatterns = {
      'github': /github|gh|git\s*hub/i,
      'gitlab': /gitlab|gl/i,
      'bitbucket': /bitbucket|bb/i,
      'aws': /aws|amazon|s3|ec2|lambda/i,
      'azure': /azure|microsoft/i,
      'google': /google|gcp|firebase/i,
      'stripe': /stripe|payment/i,
      'twilio': /twilio|sms|phone/i,
      'sendgrid': /sendgrid|email/i,
      'openai': /openai|gpt|chatgpt/i,
      'anthropic': /anthropic|claude/i,
      'database': /database|postgres|mysql|mongodb/i,
      'redis': /redis|cache/i,
      'docker': /docker|container/i,
      'npm': /npm|node|package/i,
      'pypi': /pypi|pip|python/i
    };
    
    for (const [service, pattern] of Object.entries(servicePatterns)) {
      if (pattern.test(context)) {
        return service;
      }
    }
    
    // Extract from source URL if available
    if (source.includes('://')) {
      try {
        const url = new URL(source);
        return url.hostname.replace('www.', '').split('.')[0];
      } catch {}
    }
    
    // Default to source or unknown
    return source || 'unknown';
  }

  // Store credential in database
  async storeCredential(data: {
    service: string;
    type: string;
    identifier: string;
    value: string;
    metadata?: any;
    autoDetected?: boolean;
  }): Promise<StoredCredential> {
    const encrypted = this.encrypt(data.value);
    
    const [credential] = await db.insert(credentials).values({
      service: data.service,
      type: data.type,
      identifier: data.identifier,
      encryptedValue: encrypted,
      metadata: data.metadata || {},
      autoDetected: data.autoDetected || false,
      useCount: 0,
      lastUsed: new Date()
    }).returning();
    
    return credential as StoredCredential;
  }

  // Find existing credential
  async findCredential(service: string, type: string, value: string): Promise<StoredCredential | null> {
    // We can't directly compare encrypted values, so we need to check by service and type
    const existing = await db.select()
      .from(credentials)
      .where(and(
        eq(credentials.service, service),
        eq(credentials.type, type)
      ));
    
    // Decrypt and compare values
    for (const cred of existing) {
      try {
        const decrypted = this.decrypt(cred.encryptedValue);
        if (decrypted === value) {
          return cred as StoredCredential;
        }
      } catch {}
    }
    
    return null;
  }

  // Get credentials for a service with user confirmation
  async getCredentialsForService(
    service: string,
    options: {
      type?: string;
      autoUse?: boolean;
      userId?: number;
    } = {}
  ): Promise<{ credential: StoredCredential; value: string } | null> {
    const conditions = [
      or(
        eq(credentials.service, service),
        like(credentials.service, `%${service}%`)
      )
    ];
    
    if (options.type) {
      conditions.push(eq(credentials.type, options.type));
    }
    
    const available = await db.select()
      .from(credentials)
      .where(and(...conditions))
      .orderBy(credentials.useCount, credentials.lastUsed);
    
    if (available.length === 0) {
      return null;
    }
    
    let selected: typeof available[0];
    
    if (available.length === 1 || options.autoUse) {
      // Use the most frequently used or most recent
      selected = available[0];
    } else {
      // In a real implementation, this would prompt the user
      // For now, use the most frequently used
      selected = available[0];
    }
    
    // Update usage statistics
    await db.update(credentials)
      .set({
        useCount: selected.useCount + 1,
        lastUsed: new Date()
      })
      .where(eq(credentials.id, selected.id));
    
    // Log usage
    if (options.userId) {
      await db.insert(credentialUsageLog).values({
        credentialId: selected.id,
        userId: options.userId,
        usedAt: new Date(),
        purpose: `Accessed for ${service}`
      });
    }
    
    // Decrypt and return
    const decrypted = this.decrypt(selected.encryptedValue);
    
    return {
      credential: selected as StoredCredential,
      value: decrypted
    };
  }

  // Get all stored credentials (without decrypting)
  async listCredentials(filter?: { service?: string; type?: string }): Promise<StoredCredential[]> {
    let query = db.select().from(credentials);
    
    if (filter?.service) {
      query = query.where(like(credentials.service, `%${filter.service}%`));
    }
    
    if (filter?.type) {
      query = query.where(eq(credentials.type, filter.type));
    }
    
    const results = await query;
    return results as StoredCredential[];
  }

  // Delete credential
  async deleteCredential(id: number): Promise<boolean> {
    const result = await db.delete(credentials)
      .where(eq(credentials.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Scan common locations for credentials
  async scanCommonLocations(): Promise<StoredCredential[]> {
    const allDetected: StoredCredential[] = [];
    
    // Environment variables
    for (const [key, value] of Object.entries(process.env)) {
      if (value && this.looksLikeCredential(key, value)) {
        const detected = await this.scanForCredentials(`${key}=${value}`, 'environment');
        allDetected.push(...detected);
      }
    }
    
    // Common config file locations
    const configPaths = [
      '.env',
      '.env.local',
      'config.json',
      'config.yaml',
      '.aws/credentials',
      '.git/config',
      'package.json'
    ];
    
    for (const configPath of configPaths) {
      try {
        const fullPath = path.join(process.cwd(), configPath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const detected = await this.scanForCredentials(content, configPath);
        allDetected.push(...detected);
      } catch {
        // File doesn't exist or can't be read
      }
    }
    
    return allDetected;
  }

  // Check if a string looks like a credential
  private looksLikeCredential(key: string, value: string): boolean {
    const keyLower = key.toLowerCase();
    const credentialKeywords = [
      'key', 'token', 'secret', 'password', 'pwd', 'auth',
      'credential', 'api', 'access', 'private'
    ];
    
    return credentialKeywords.some(keyword => keyLower.includes(keyword)) &&
           value.length > 10 &&
           value !== 'true' &&
           value !== 'false' &&
           !value.includes(' ') &&
           !/^\d+$/.test(value);
  }

  // OAuth-specific methods
  async storeOAuthTokens(data: {
    service: string;
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
    scope?: string;
  }): Promise<void> {
    // Store client credentials
    await this.storeCredential({
      service: data.service,
      type: 'oauth_client_id',
      identifier: 'client_id',
      value: data.clientId,
      metadata: { tokenType: data.tokenType, scope: data.scope }
    });

    await this.storeCredential({
      service: data.service,
      type: 'oauth_client_secret',
      identifier: 'client_secret',
      value: data.clientSecret
    });

    // Store access token with expiry
    const expiresAt = data.expiresIn 
      ? new Date(Date.now() + data.expiresIn * 1000).toISOString()
      : null;

    await this.storeCredential({
      service: data.service,
      type: 'oauth_access_token',
      identifier: 'access_token',
      value: data.accessToken,
      metadata: { 
        expiresAt, 
        tokenType: data.tokenType || 'Bearer',
        scope: data.scope 
      }
    });

    // Store refresh token if provided
    if (data.refreshToken) {
      await this.storeCredential({
        service: data.service,
        type: 'oauth_refresh_token',
        identifier: 'refresh_token',
        value: data.refreshToken
      });
    }
  }

  // Get OAuth tokens with automatic refresh
  async getOAuthTokens(
    service: string,
    refreshConfig?: {
      tokenUrl: string;
      grantType?: string;
    }
  ): Promise<{
    accessToken: string;
    tokenType: string;
    expiresAt?: string;
    refreshed?: boolean;
  } | null> {
    // Get access token
    const tokenCred = await this.getCredentialsForService(service, {
      type: 'oauth_access_token',
      autoUse: true
    });

    if (!tokenCred) {
      return null;
    }

    const metadata = tokenCred.credential.metadata as any;
    const expiresAt = metadata?.expiresAt;

    // Check if token is expired
    if (expiresAt && new Date(expiresAt) < new Date()) {
      // Try to refresh token
      if (refreshConfig) {
        const refreshed = await this.refreshOAuthToken(service, refreshConfig);
        if (refreshed) {
          return {
            ...refreshed,
            refreshed: true
          };
        }
      }
    }

    return {
      accessToken: tokenCred.value,
      tokenType: metadata?.tokenType || 'Bearer',
      expiresAt,
      refreshed: false
    };
  }

  // Refresh OAuth token
  private async refreshOAuthToken(
    service: string,
    config: {
      tokenUrl: string;
      grantType?: string;
    }
  ): Promise<{
    accessToken: string;
    tokenType: string;
    expiresAt?: string;
  } | null> {
    try {
      // Get refresh token
      const refreshCred = await this.getCredentialsForService(service, {
        type: 'oauth_refresh_token'
      });

      if (!refreshCred) {
        console.log('No refresh token found for', service);
        return null;
      }

      // Get client credentials
      const clientIdCred = await this.getCredentialsForService(service, {
        type: 'oauth_client_id'
      });
      const clientSecretCred = await this.getCredentialsForService(service, {
        type: 'oauth_client_secret'
      });

      if (!clientIdCred || !clientSecretCred) {
        console.log('Missing client credentials for token refresh');
        return null;
      }

      // Make refresh request
      const response = await axios.post(config.tokenUrl, {
        grant_type: config.grantType || 'refresh_token',
        refresh_token: refreshCred.value,
        client_id: clientIdCred.value,
        client_secret: clientSecretCred.value
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, token_type, expires_in, refresh_token } = response.data;

      // Update stored tokens
      const expiresAt = expires_in 
        ? new Date(Date.now() + expires_in * 1000).toISOString()
        : null;

      await this.storeCredential({
        service,
        type: 'oauth_access_token',
        identifier: 'access_token',
        value: access_token,
        metadata: { 
          expiresAt, 
          tokenType: token_type || 'Bearer'
        }
      });

      // Update refresh token if a new one was provided
      if (refresh_token) {
        await this.storeCredential({
          service,
          type: 'oauth_refresh_token',
          identifier: 'refresh_token',
          value: refresh_token
        });
      }

      return {
        accessToken: access_token,
        tokenType: token_type || 'Bearer',
        expiresAt
      };
    } catch (error) {
      console.error('Failed to refresh OAuth token:', error);
      return null;
    }
  }

  // Apply credentials to a configuration object
  async applyCredentials(
    config: any,
    service: string,
    userId?: number
  ): Promise<{ applied: boolean; credentials: string[] }> {
    const appliedCreds: string[] = [];
    
    // Common credential field mappings
    const fieldMappings = {
      'api_key': ['apiKey', 'api_key', 'key', 'token'],
      'bearer_token': ['token', 'bearerToken', 'authToken', 'accessToken'],
      'oauth_client_id': ['clientId', 'client_id', 'oauthId'],
      'oauth_client_secret': ['clientSecret', 'client_secret', 'oauthSecret'],
      'oauth_access_token': ['accessToken', 'access_token', 'oauthToken'],
      'oauth_refresh_token': ['refreshToken', 'refresh_token'],
      'database_url': ['databaseUrl', 'DATABASE_URL', 'dbUrl', 'connectionString']
    };
    
    // Try to find and apply matching credentials
    for (const [credType, fields] of Object.entries(fieldMappings)) {
      const cred = await this.getCredentialsForService(service, {
        type: credType,
        autoUse: true,
        userId
      });
      
      if (cred) {
        for (const field of fields) {
          if (field in config && !config[field]) {
            config[field] = cred.value;
            appliedCreds.push(`${field} (${credType})`);
            break;
          }
        }
      }
    }
    
    // Special handling for OAuth - check if we need full OAuth flow
    if (config.oauth || config.useOAuth) {
      const oauthTokens = await this.getOAuthTokens(service, config.oauthRefreshConfig);
      if (oauthTokens) {
        config.authorization = `${oauthTokens.tokenType} ${oauthTokens.accessToken}`;
        appliedCreds.push('authorization (OAuth)');
        if (oauthTokens.refreshed) {
          appliedCreds.push('(token auto-refreshed)');
        }
      }
    }
    
    return {
      applied: appliedCreds.length > 0,
      credentials: appliedCreds
    };
  }
}

export const universalCredentialManager = UniversalCredentialManager.getInstance();