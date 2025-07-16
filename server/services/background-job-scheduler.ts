import { db } from "../db";
import { backgroundJobs, dataCache, type BackgroundJob, type InsertBackgroundJob } from "@shared/schema";
import { eq, and, lt, lte } from "drizzle-orm";
import { credentialManager } from "./credential-manager";
import { externalAPIService } from "./external-apis";

interface CronExpression {
  minute: number | '*';
  hour: number | '*';
  day: number | '*';
  month: number | '*';
  dayOfWeek: number | '*';
}

export class BackgroundJobScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    console.log('Starting background job scheduler...');
    this.isRunning = true;
    
    // Check for pending jobs every minute
    this.intervalId = setInterval(() => {
      this.processJobs();
    }, 60000);

    // Process immediately on start
    this.processJobs();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Background job scheduler stopped');
  }

  async createJob(job: InsertBackgroundJob): Promise<BackgroundJob> {
    const nextRun = this.calculateNextRun(job.schedule);
    
    const [created] = await db.insert(backgroundJobs).values({
      ...job,
      nextRun,
      status: 'pending',
    }).returning();

    return created;
  }

  private async processJobs() {
    try {
      const now = new Date();
      
      // Get all active jobs that are due to run
      const dueJobs = await db
        .select()
        .from(backgroundJobs)
        .where(and(
          eq(backgroundJobs.isActive, true),
          lte(backgroundJobs.nextRun, now)
        ));

      for (const job of dueJobs) {
        await this.executeJob(job);
      }
    } catch (error) {
      console.error('Error processing background jobs:', error);
    }
  }

  private async executeJob(job: BackgroundJob) {
    try {
      console.log(`Executing job ${job.id}: ${job.jobType} for API ${job.apiId}`);
      
      // Update job status to running
      await db
        .update(backgroundJobs)
        .set({ 
          status: 'running',
          lastRun: new Date()
        })
        .where(eq(backgroundJobs.id, job.id));

      // Get credentials for this job
      const credentials = await credentialManager.getCredential(job.userId, job.apiId);
      if (!credentials) {
        throw new Error(`No credentials found for API ${job.apiId}`);
      }

      // Execute the API call
      let result;
      switch (job.jobType) {
        case 'api_sync':
          result = await this.syncAPIData(job, credentials);
          break;
        case 'data_poll':
          result = await this.pollData(job, credentials);
          break;
        case 'webhook':
          result = await this.processWebhook(job, credentials);
          break;
        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Cache the result
      await this.cacheResult(job, result);

      // Update job status and calculate next run
      const nextRun = this.calculateNextRun(job.schedule);
      await db
        .update(backgroundJobs)
        .set({
          status: 'completed',
          nextRun,
          errorCount: 0,
        })
        .where(eq(backgroundJobs.id, job.id));

      console.log(`Job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      // Increment error count and update status
      await db
        .update(backgroundJobs)
        .set({
          status: 'failed',
          errorCount: job.errorCount + 1,
          nextRun: new Date(Date.now() + 30 * 60 * 1000), // Retry in 30 minutes
        })
        .where(eq(backgroundJobs.id, job.id));
    }
  }

  private async syncAPIData(job: BackgroundJob, credentials: any) {
    const config = job.config as any || {};
    
    return await externalAPIService.makeAPICall(
      job.apiId,
      job.endpoint,
      'GET',
      undefined,
      {
        'Authorization': `Bearer ${credentials.apiKey}`,
        ...config.headers
      }
    );
  }

  private async pollData(job: BackgroundJob, credentials: any) {
    const config = job.config as any || {};
    
    return await externalAPIService.makeAPICall(
      job.apiId,
      job.endpoint,
      config.method || 'GET',
      config.body,
      {
        'Authorization': `Bearer ${credentials.apiKey}`,
        ...config.headers
      }
    );
  }

  private async processWebhook(job: BackgroundJob, credentials: any) {
    // Webhook processing logic here
    const config = job.config as any || {};
    
    return await externalAPIService.makeAPICall(
      job.apiId,
      job.endpoint,
      'POST',
      config.payload,
      {
        'Authorization': `Bearer ${credentials.apiKey}`,
        ...config.headers
      }
    );
  }

  private async cacheResult(job: BackgroundJob, result: any) {
    const cacheKey = `${job.apiId}:${job.endpoint}:${job.userId}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(dataCache).values({
      userId: job.userId,
      cacheKey,
      apiId: job.apiId,
      endpoint: job.endpoint,
      data: result,
      expiresAt,
    }).onConflictDoUpdate({
      target: [dataCache.cacheKey, dataCache.userId],
      set: {
        data: result,
        expiresAt,
      }
    });
  }

  private calculateNextRun(schedule: string): Date {
    // Parse cron expression (minute hour day month dayOfWeek)
    const parts = schedule.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }

    const now = new Date();
    
    // For simplicity, implement basic scheduling
    // In production, use a proper cron parser like node-cron
    
    if (schedule === '*/5 * * * *') { // Every 5 minutes
      return new Date(now.getTime() + 5 * 60 * 1000);
    } else if (schedule === '0 * * * *') { // Every hour
      return new Date(now.getTime() + 60 * 60 * 1000);
    } else if (schedule === '0 0 * * *') { // Daily
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      // Default to 1 hour
      return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }

  async getUserJobs(userId: number): Promise<BackgroundJob[]> {
    return await db
      .select()
      .from(backgroundJobs)
      .where(and(
        eq(backgroundJobs.userId, userId),
        eq(backgroundJobs.isActive, true)
      ));
  }

  async deleteJob(userId: number, jobId: number): Promise<boolean> {
    const result = await db
      .update(backgroundJobs)
      .set({ isActive: false })
      .where(and(
        eq(backgroundJobs.id, jobId),
        eq(backgroundJobs.userId, userId)
      ));

    return result.rowCount > 0;
  }
}

export const backgroundJobScheduler = new BackgroundJobScheduler();