import { db } from "../db";
import { apiCredentials, type ApiCredential, type InsertApiCredential } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// Encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

export class CredentialManager {
  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 32), 'utf8');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 32), 'utf8');
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async storeCredential(credential: InsertApiCredential): Promise<ApiCredential> {
    const encryptedKey = this.encrypt(credential.encryptedKey);
    const encryptedSecret = credential.encryptedSecret ? this.encrypt(credential.encryptedSecret) : null;

    const [stored] = await db.insert(apiCredentials).values({
      ...credential,
      encryptedKey,
      encryptedSecret,
    }).returning();

    return stored;
  }

  async getCredential(userId: number, apiId: string): Promise<{
    apiKey: string;
    secret?: string;
    permissions: any;
  } | null> {
    const [credential] = await db
      .select()
      .from(apiCredentials)
      .where(and(
        eq(apiCredentials.userId, userId),
        eq(apiCredentials.apiId, apiId),
        eq(apiCredentials.isActive, true)
      ));

    if (!credential) return null;

    // Update last used timestamp
    await db
      .update(apiCredentials)
      .set({ lastUsed: new Date() })
      .where(eq(apiCredentials.id, credential.id));

    return {
      apiKey: this.decrypt(credential.encryptedKey),
      secret: credential.encryptedSecret ? this.decrypt(credential.encryptedSecret) : undefined,
      permissions: credential.permissions || {},
    };
  }

  async getUserCredentials(userId: number): Promise<ApiCredential[]> {
    return await db
      .select()
      .from(apiCredentials)
      .where(and(
        eq(apiCredentials.userId, userId),
        eq(apiCredentials.isActive, true)
      ));
  }

  async deleteCredential(userId: number, credentialId: number): Promise<boolean> {
    const result = await db
      .update(apiCredentials)
      .set({ isActive: false })
      .where(and(
        eq(apiCredentials.id, credentialId),
        eq(apiCredentials.userId, userId)
      ));

    return result.rowCount > 0;
  }
}

export const credentialManager = new CredentialManager();