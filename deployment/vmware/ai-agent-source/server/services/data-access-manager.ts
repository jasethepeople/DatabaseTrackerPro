import { db } from "../db";
import { dataCache, backgroundJobs } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { backgroundJobScheduler } from "./background-job-scheduler";
import { credentialManager } from "./credential-manager";
import { externalAPIService } from "./external-apis";

export class DataAccessManager {
  
  async getData(userId: number, apiId: string, endpoint: string, forceRefresh = false): Promise<any> {
    const cacheKey = `${apiId}:${endpoint}:${userId}`;
    
    if (!forceRefresh) {
      // Try to get from cache first
      const cached = await this.getCachedData(userId, cacheKey);
      if (cached) {
        console.log(`Returning cached data for ${cacheKey}`);
        return cached.data;
      }
    }

    // If not in cache or force refresh, fetch fresh data
    console.log(`Fetching fresh data for ${cacheKey}`);
    return await this.fetchFreshData(userId, apiId, endpoint);
  }

  private async getCachedData(userId: number, cacheKey: string) {
    const now = new Date();
    
    const [cached] = await db
      .select()
      .from(dataCache)
      .where(and(
        eq(dataCache.userId, userId),
        eq(dataCache.cacheKey, cacheKey),
        gt(dataCache.expiresAt, now)
      ));

    return cached;
  }

  private async fetchFreshData(userId: number, apiId: string, endpoint: string) {
    // Get credentials
    const credentials = await credentialManager.getCredential(userId, apiId);
    if (!credentials) {
      throw new Error(`No credentials found for API ${apiId}. Please configure your API keys.`);
    }

    try {
      // Make the API call
      const data = await externalAPIService.makeAPICall(
        apiId,
        endpoint,
        'GET',
        undefined,
        {
          'Authorization': `Bearer ${credentials.apiKey}`,
        }
      );

      // Cache the result
      await this.cacheData(userId, apiId, endpoint, data);

      return data;
    } catch (error) {
      console.error(`Failed to fetch data from ${apiId}:`, error);
      throw error;
    }
  }

  private async cacheData(userId: number, apiId: string, endpoint: string, data: any) {
    const cacheKey = `${apiId}:${endpoint}:${userId}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours default

    await db.insert(dataCache).values({
      userId,
      cacheKey,
      apiId,
      endpoint,
      data,
      expiresAt,
    }).onConflictDoUpdate({
      target: [dataCache.cacheKey, dataCache.userId],
      set: {
        data,
        expiresAt,
      }
    });
  }

  async setupAutoSync(userId: number, apiId: string, endpoint: string, schedule = '*/30 * * * *') {
    // Check if job already exists
    const [existingJob] = await db
      .select()
      .from(backgroundJobs)
      .where(and(
        eq(backgroundJobs.userId, userId),
        eq(backgroundJobs.apiId, apiId),
        eq(backgroundJobs.endpoint, endpoint),
        eq(backgroundJobs.isActive, true)
      ));

    if (existingJob) {
      console.log(`Auto-sync already configured for ${apiId}:${endpoint}`);
      return existingJob;
    }

    // Create new background job
    const job = await backgroundJobScheduler.createJob({
      userId,
      jobType: 'data_poll',
      apiId,
      endpoint,
      schedule, // Every 30 minutes by default
      config: {
        autoCreated: true,
        description: `Auto-sync for ${apiId} ${endpoint}`,
      },
    });

    console.log(`Created auto-sync job for ${apiId}:${endpoint}`);
    return job;
  }

  async getAvailableData(userId: number): Promise<{
    apiId: string;
    endpoint: string;
    lastUpdate: Date;
    dataPreview: any;
  }[]> {
    const cached = await db
      .select()
      .from(dataCache)
      .where(and(
        eq(dataCache.userId, userId),
        gt(dataCache.expiresAt, new Date())
      ));

    return cached.map(cache => ({
      apiId: cache.apiId,
      endpoint: cache.endpoint,
      lastUpdate: cache.createdAt,
      dataPreview: this.createDataPreview(cache.data),
    }));
  }

  private createDataPreview(data: any): any {
    if (!data) return null;
    
    if (Array.isArray(data)) {
      return {
        type: 'array',
        count: data.length,
        sample: data.slice(0, 3),
      };
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return {
        type: 'object',
        keys: keys.slice(0, 10),
        totalKeys: keys.length,
      };
    }
    
    return {
      type: typeof data,
      value: String(data).substring(0, 100),
    };
  }

  async clearCache(userId: number, apiId?: string): Promise<void> {
    let query = db.delete(dataCache).where(eq(dataCache.userId, userId));
    
    if (apiId) {
      query = query.where(eq(dataCache.apiId, apiId));
    }
    
    await query;
    console.log(`Cache cleared for user ${userId}${apiId ? ` and API ${apiId}` : ''}`);
  }
}

export const dataAccessManager = new DataAccessManager();