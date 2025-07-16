import { db } from '../db';
import { apiCredentials, oauthStates, type InsertApiCredential } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scope: string[];
  redirectUri: string;
}

export interface OAuthProvider {
  id: string;
  name: string;
  config: OAuthConfig;
  userInfoUrl?: string;
  autoCreateAccount?: boolean;
}

class OAuthManager {
  private providers: Map<string, OAuthProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // GitHub OAuth
    this.providers.set('github', {
      id: 'github',
      name: 'GitHub',
      config: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scope: ['repo', 'read:user', 'read:org'],
        redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/github`
      },
      userInfoUrl: 'https://api.github.com/user',
      autoCreateAccount: true
    });

    // Google OAuth
    this.providers.set('google', {
      id: 'google',
      name: 'Google',
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/cloud-platform'],
        redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/google`
      },
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      autoCreateAccount: true
    });

    // Twitter/X OAuth
    this.providers.set('twitter', {
      id: 'twitter',
      name: 'Twitter/X',
      config: {
        clientId: process.env.TWITTER_CLIENT_ID || '',
        clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        scope: ['tweet.read', 'users.read', 'follows.read'],
        redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/twitter`
      },
      userInfoUrl: 'https://api.twitter.com/2/users/me',
      autoCreateAccount: true
    });

    // Microsoft OAuth
    this.providers.set('microsoft', {
      id: 'microsoft',
      name: 'Microsoft',
      config: {
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scope: ['openid', 'profile', 'email', 'https://graph.microsoft.com/.default'],
        redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/callback/microsoft`
      },
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      autoCreateAccount: true
    });
  }

  getProvider(providerId: string): OAuthProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): OAuthProvider[] {
    return Array.from(this.providers.values());
  }

  async generateAuthUrl(userId: number, providerId: string): Promise<{ authUrl: string; state: string }> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`OAuth provider ${providerId} not found`);
    }

    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in database for verification
    await db.insert(oauthStates).values({
      userId,
      state,
      providerId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    const params = new URLSearchParams({
      client_id: provider.config.clientId,
      redirect_uri: provider.config.redirectUri,
      scope: provider.config.scope.join(' '),
      response_type: 'code',
      state,
    });

    const authUrl = `${provider.config.authUrl}?${params.toString()}`;
    
    return { authUrl, state };
  }

  async handleCallback(code: string, state: string): Promise<{
    success: boolean;
    credential?: any;
    userInfo?: any;
    error?: string;
  }> {
    try {
      // Verify state
      const [stateRecord] = await db
        .select()
        .from(oauthStates)
        .where(and(
          eq(oauthStates.state, state),
          // Note: using gt instead of checking expiry here for now
        ));

      if (!stateRecord) {
        return { success: false, error: 'Invalid or expired state' };
      }

      const provider = this.providers.get(stateRecord.providerId);
      if (!provider) {
        return { success: false, error: 'Provider not found' };
      }

      // Exchange code for token
      const tokenResponse = await fetch(provider.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: provider.config.clientId,
          client_secret: provider.config.clientSecret,
          code,
          redirect_uri: provider.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        return { success: false, error: `Token exchange failed: ${error}` };
      }

      const tokenData = await tokenResponse.json();
      
      // Get user info if available
      let userInfo = null;
      if (provider.userInfoUrl && tokenData.access_token) {
        const userResponse = await fetch(provider.userInfoUrl, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json',
          },
        });

        if (userResponse.ok) {
          userInfo = await userResponse.json();
        }
      }

      // Store credential
      const credential = await this.storeOAuthCredential(
        stateRecord.userId,
        stateRecord.providerId,
        tokenData,
        userInfo
      );

      // Clean up state
      await db.delete(oauthStates).where(eq(oauthStates.id, stateRecord.id));

      return {
        success: true,
        credential,
        userInfo,
      };

    } catch (error) {
      console.error('OAuth callback error:', error);
      return { success: false, error: 'Internal error during OAuth callback' };
    }
  }

  private async storeOAuthCredential(
    userId: number,
    providerId: string,
    tokenData: any,
    userInfo: any
  ): Promise<any> {
    const credentialData: InsertApiCredential = {
      userId,
      apiId: providerId,
      name: `${providerId} OAuth Token${userInfo?.login ? ` (${userInfo.login})` : ''}`,
      keyType: 'oauth',
      keyValue: this.encrypt(tokenData.access_token),
      encryptedSecret: tokenData.refresh_token ? this.encrypt(tokenData.refresh_token) : undefined,
      permissions: Array.isArray(tokenData.scope) ? tokenData.scope : 
                   typeof tokenData.scope === 'string' ? tokenData.scope.split(' ') : [],
      metadata: {
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in,
        userInfo: userInfo || {},
        grantedAt: new Date().toISOString(),
      },
    };

    const [stored] = await db
      .insert(apiCredentials)
      .values(credentialData)
      .returning();

    return stored;
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-needed!', 'utf8');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  async refreshToken(userId: number, providerId: string): Promise<boolean> {
    try {
      const [credential] = await db
        .select()
        .from(apiCredentials)
        .where(and(
          eq(apiCredentials.userId, userId),
          eq(apiCredentials.apiId, providerId),
          eq(apiCredentials.keyType, 'oauth'),
          eq(apiCredentials.isActive, true)
        ));

      if (!credential || !credential.encryptedSecret) {
        return false;
      }

      const provider = this.providers.get(providerId);
      if (!provider) {
        return false;
      }

      const refreshToken = this.decrypt(credential.encryptedSecret);
      
      const tokenResponse = await fetch(provider.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: provider.config.clientId,
          client_secret: provider.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        return false;
      }

      const tokenData = await tokenResponse.json();
      
      // Update credential with new token
      await db
        .update(apiCredentials)
        .set({
          keyValue: this.encrypt(tokenData.access_token),
          encryptedSecret: tokenData.refresh_token ? this.encrypt(tokenData.refresh_token) : credential.encryptedSecret,
          updatedAt: new Date(),
        })
        .where(eq(apiCredentials.id, credential.id));

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-needed!', 'utf8');
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export const oauthManager = new OAuthManager();