import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

interface StoredCredentials {
  github?: {
    email: string;
    token: string;
    encryptedAt: string;
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
}

export class CredentialStorageService {
  private static instance: CredentialStorageService;
  private credentialsPath = path.join(process.cwd(), '.credentials');
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  private constructor() {
    // Use a fixed key for demo purposes - in production this should be from env
    this.key = crypto.scryptSync('demo-encryption-key', 'salt', 32);
  }

  static getInstance(): CredentialStorageService {
    if (!this.instance) {
      this.instance = new CredentialStorageService();
    }
    return this.instance;
  }

  private encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  private decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async saveGitHubCredentials(email: string, passwordOrToken: string): Promise<void> {
    try {
      // Create credentials directory if it doesn't exist
      await fs.mkdir(this.credentialsPath, { recursive: true });
      
      let token = passwordOrToken;
      
      // Check if it's a Personal Access Token (starts with ghp_) or password
      if (!passwordOrToken.startsWith('ghp_') && !passwordOrToken.startsWith('github_pat_')) {
        // If it's a password, we need to inform the user to use a PAT instead
        console.log('Note: GitHub requires Personal Access Tokens for API access');
        // For now, store the password as-is, but it won't work with GitHub API
        token = passwordOrToken;
      }
      
      const credentials = await this.loadCredentials();
      
      // Encrypt the token
      const encryptedToken = this.encrypt(token);
      
      credentials.github = {
        email,
        token: JSON.stringify(encryptedToken),
        encryptedAt: new Date().toISOString()
      };
      
      await fs.writeFile(
        path.join(this.credentialsPath, 'credentials.json'),
        JSON.stringify(credentials, null, 2)
      );
      
      console.log('GitHub credentials saved successfully');
    } catch (error) {
      console.error('Failed to save GitHub credentials:', error);
      throw error;
    }
  }

  async getGitHubToken(): Promise<string | null> {
    try {
      const credentials = await this.loadCredentials();
      
      if (!credentials.github) {
        return null;
      }
      
      const encryptedData = JSON.parse(credentials.github.token);
      const token = this.decrypt(encryptedData);
      
      return token;
    } catch (error) {
      console.error('Failed to retrieve GitHub token:', error);
      return null;
    }
  }

  async getGitHubEmail(): Promise<string | null> {
    try {
      const credentials = await this.loadCredentials();
      return credentials.github?.email || null;
    } catch (error) {
      return null;
    }
  }

  private async loadCredentials(): Promise<StoredCredentials> {
    try {
      const data = await fs.readFile(
        path.join(this.credentialsPath, 'credentials.json'),
        'utf-8'
      );
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async saveAWSCredentials(accessKeyId: string, secretAccessKey: string, region: string = 'us-east-1'): Promise<void> {
    try {
      await fs.mkdir(this.credentialsPath, { recursive: true });
      
      const credentials = await this.loadCredentials();
      
      // Encrypt AWS credentials
      const encryptedAccessKey = this.encrypt(accessKeyId);
      const encryptedSecretKey = this.encrypt(secretAccessKey);
      
      credentials.aws = {
        accessKeyId: JSON.stringify(encryptedAccessKey),
        secretAccessKey: JSON.stringify(encryptedSecretKey),
        region
      };
      
      await fs.writeFile(
        path.join(this.credentialsPath, 'credentials.json'),
        JSON.stringify(credentials, null, 2)
      );
      
      console.log('AWS credentials saved successfully');
    } catch (error) {
      console.error('Failed to save AWS credentials:', error);
      throw error;
    }
  }

  async getAWSCredentials(): Promise<{ accessKeyId: string; secretAccessKey: string; region: string } | null> {
    try {
      const credentials = await this.loadCredentials();
      
      if (!credentials.aws) {
        return null;
      }
      
      const accessKeyId = this.decrypt(JSON.parse(credentials.aws.accessKeyId));
      const secretAccessKey = this.decrypt(JSON.parse(credentials.aws.secretAccessKey));
      
      return {
        accessKeyId,
        secretAccessKey,
        region: credentials.aws.region
      };
    } catch (error) {
      console.error('Failed to retrieve AWS credentials:', error);
      return null;
    }
  }
}

export const credentialStorage = CredentialStorageService.getInstance();