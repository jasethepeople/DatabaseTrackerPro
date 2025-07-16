#!/usr/bin/env node

import http from 'http';

async function testDeploymentCapabilities() {
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'password'
  });

  // Login first
  const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
  const token = loginResponse.token;

  console.log('\n🚀 TESTING DEPLOYMENT CAPABILITIES');
  console.log('==================================');

  // Test comprehensive deployment
  try {
    const deploymentTest = await makeRequest('/api/deployment/test-comprehensive', 'POST', JSON.stringify({}), token);
    
    if (deploymentTest.success) {
      const { testing } = deploymentTest;
      
      console.log(`✅ Multi-Platform Deployment: SUCCESS`);
      console.log(`📊 Total Deployments: ${testing.totalDeployments}`);
      console.log(`🎯 Successful Deployments: ${testing.successfulDeployments}`);
      console.log(`❌ Failed Deployments: ${testing.failedDeployments}`);
      console.log(`🌐 Platforms Tested: ${testing.platforms.join(', ')}`);
      console.log(`🏆 Overall Success: ${testing.overallSuccess ? 'YES' : 'NO'}`);
      
      console.log('\n🔍 DEPLOYMENT RESULTS BY PLATFORM:');
      testing.results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.platform.toUpperCase()}: ${result.success ? result.url : 'Failed'}`);
      });
      
      const successRate = (testing.successfulDeployments / testing.totalDeployments * 100).toFixed(1);
      console.log(`\n📈 Success Rate: ${successRate}%`);
      
      if (testing.overallSuccess) {
        console.log('\n🎉 DEPLOYMENT CAPABILITIES FULLY FUNCTIONAL!');
      } else {
        console.log('\n⚠️ Some deployment platforms need attention.');
      }
      
    } else {
      console.log('❌ Deployment test failed:', deploymentTest.error);
    }
  } catch (error) {
    console.log('❌ Error testing deployment:', error.message);
  }

  // Test individual platform deployment (Heroku)
  try {
    console.log('\n🔧 Testing Individual Platform Deployment (Heroku)...');
    const herokuTest = await makeRequest('/api/deployment/heroku', 'POST', JSON.stringify({
      appName: 'test-individual-app',
      region: 'us',
      buildpack: 'heroku/nodejs'
    }), token);
    
    if (herokuTest.success) {
      console.log(`✅ Heroku Deployment: ${herokuTest.deployment.url}`);
      console.log(`⏱️ Duration: ${herokuTest.deployment.duration}ms`);
    } else {
      console.log('❌ Heroku deployment failed:', herokuTest.error);
    }
  } catch (error) {
    console.log('❌ Error testing Heroku deployment:', error.message);
  }

  console.log('\n📋 DEPLOYMENT FEATURES AVAILABLE:');
  console.log('• Multi-platform deployment (Heroku, Vercel, AWS, Docker)');
  console.log('• Automated deployment with health monitoring');
  console.log('• Credential management for deployment platforms');
  console.log('• Deployment status tracking and logging');
  console.log('• Comprehensive testing and validation');
}

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

testDeploymentCapabilities().catch(console.error);