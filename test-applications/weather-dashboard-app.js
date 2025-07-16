#!/usr/bin/env node
/**
 * Weather Dashboard Test Application
 * 
 * This application demonstrates the automated data collection and credential management
 * by creating a weather monitoring system that:
 * 1. Stores API credentials securely
 * 2. Sets up background jobs for data polling
 * 3. Retrieves and displays weather data automatically
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';
const USER_ID = 2; // Admin user ID

class WeatherDashboardApp {
  constructor() {
    this.apiCredentials = null;
    this.backgroundJobs = [];
  }

  async init() {
    console.log('🌤️  Weather Dashboard Test Application');
    console.log('=====================================');
    
    try {
      // Step 1: Store weather API credentials
      await this.storeWeatherAPICredentials();
      
      // Step 2: Create background job for weather data polling
      await this.createWeatherPollingJob();
      
      // Step 3: Test manual data retrieval with auto-credential usage
      await this.testManualDataRetrieval();
      
      // Step 4: Monitor background job execution
      await this.monitorBackgroundJobs();
      
      console.log('\n✅ Weather Dashboard App test completed successfully!');
    } catch (error) {
      console.error('❌ Error running Weather Dashboard App:', error.message);
    }
  }

  async storeWeatherAPICredentials() {
    console.log('\n📦 Step 1: Storing Weather API Credentials...');
    
    // Store OpenWeatherMap API credentials
    const credentialData = {
      apiId: 'openweathermap',
      name: 'OpenWeatherMap Production Key',
      keyType: 'api-key',
      keyValue: 'demo_weather_api_key_12345', // Demo key for testing
      permissions: ['read', 'current_weather', 'forecasts']
    };

    try {
      const response = await fetch(`${API_BASE}/api/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token' // In real app, use actual auth
        },
        body: JSON.stringify(credentialData)
      });

      if (response.ok) {
        this.apiCredentials = await response.json();
        console.log('✅ Weather API credentials stored successfully');
        console.log(`   - Credential ID: ${this.apiCredentials.credential.id}`);
        console.log(`   - API: ${this.apiCredentials.credential.apiId}`);
        console.log(`   - Permissions: ${this.apiCredentials.credential.permissions.join(', ')}`);
      } else {
        const error = await response.json();
        console.log('⚠️  Credential storage response:', error);
        console.log('   (This is expected in demo mode)');
      }
    } catch (error) {
      console.log('⚠️  Credential storage failed (demo mode):', error.message);
    }
  }

  async createWeatherPollingJob() {
    console.log('\n🔄 Step 2: Creating Weather Data Polling Job...');
    
    const jobData = {
      name: 'Weather Data Sync - Major Cities',
      type: 'poll_data',
      apiId: 'openweathermap',
      endpoint: '/weather',
      schedule: '*/15 * * * *', // Every 15 minutes
      metadata: {
        cities: ['London', 'New York', 'Tokyo', 'Sydney'],
        parameters: 'temperature,humidity,wind_speed,conditions'
      }
    };

    try {
      const response = await fetch(`${API_BASE}/api/background-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        const job = await response.json();
        this.backgroundJobs.push(job.job);
        console.log('✅ Weather polling job created successfully');
        console.log(`   - Job ID: ${job.job.id}`);
        console.log(`   - Schedule: ${job.job.schedule} (every 15 minutes)`);
        console.log(`   - Next run: ${new Date(job.job.nextRun).toLocaleString()}`);
      } else {
        const error = await response.json();
        console.log('⚠️  Job creation response:', error);
      }
    } catch (error) {
      console.log('⚠️  Job creation failed (demo mode):', error.message);
    }
  }

  async testManualDataRetrieval() {
    console.log('\n🔍 Step 3: Testing Manual Data Retrieval with Auto-Credentials...');
    
    const testEndpoints = [
      { api: 'openweathermap', endpoint: '/weather?q=London' },
      { api: 'openweathermap', endpoint: '/weather?q=New York' },
      { api: 'openweathermap', endpoint: '/forecast?q=Tokyo' }
    ];

    for (const test of testEndpoints) {
      try {
        console.log(`   Testing: ${test.api}${test.endpoint}`);
        
        const response = await fetch(`${API_BASE}/api/data/${test.api}${test.endpoint}`, {
          headers: {
            'Authorization': 'Bearer demo_token'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Data retrieved successfully (${Object.keys(data).length} fields)`);
        } else {
          const error = await response.json();
          console.log(`   ⚠️  Response: ${error.message || 'Demo mode - no real API calls'}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Request failed: ${error.message}`);
      }
    }
  }

  async monitorBackgroundJobs() {
    console.log('\n📊 Step 4: Monitoring Background Job Status...');
    
    try {
      const response = await fetch(`${API_BASE}/api/background-jobs`, {
        headers: {
          'Authorization': 'Bearer demo_token'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const jobs = data.jobs || [];
        
        console.log(`   Found ${jobs.length} background jobs:`);
        jobs.forEach(job => {
          console.log(`   - ${job.name} (${job.status})`);
          console.log(`     API: ${job.apiId}, Type: ${job.type}`);
          console.log(`     Last run: ${job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}`);
          console.log(`     Next run: ${new Date(job.nextRun).toLocaleString()}`);
        });
      } else {
        console.log('   ⚠️  Could not fetch job status (demo mode)');
      }
    } catch (error) {
      console.log(`   ⚠️  Monitoring failed: ${error.message}`);
    }
  }

  async testCacheRetrieval() {
    console.log('\n💾 Testing Cache Retrieval...');
    
    try {
      const response = await fetch(`${API_BASE}/api/data/available`, {
        headers: {
          'Authorization': 'Bearer demo_token'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('   Available cached data sources:');
        Object.entries(data.data || {}).forEach(([apiId, info]) => {
          console.log(`   - ${apiId}: ${info.endpoints.length} endpoints`);
          console.log(`     Last update: ${new Date(info.lastUpdate).toLocaleString()}`);
        });
      }
    } catch (error) {
      console.log(`   ⚠️  Cache retrieval failed: ${error.message}`);
    }
  }
}

// Run the test application
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new WeatherDashboardApp();
  app.init().catch(console.error);
}

export default WeatherDashboardApp;