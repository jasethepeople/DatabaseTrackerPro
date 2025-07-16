#!/usr/bin/env node

import http from 'http';

async function getTestResults() {
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'password'
  });

  // Login
  const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
  const token = loginResponse.token;

  // Get test results
  const testResponse = await makeRequest('/api/testing/run-all-prompts', 'POST', JSON.stringify({}), token);
  
  console.log('\n🎯 ENHANCED SYSTEM WITH DEPLOYMENT CAPABILITIES');
  console.log('==============================================');
  console.log(`📊 Overall Score: ${testResponse.testing.totalScore}%`);
  console.log(`✅ Passed Tests: ${testResponse.testing.passedCount}/16`);
  console.log(`🏆 Status: ${testResponse.testing.summary}`);
  console.log('\n📋 KEY IMPROVEMENTS:');
  
  // Show credential management improvement
  const credTest = testResponse.testing.results.find(r => r.promptId === 1);
  console.log(`🔐 Credential Management: ${credTest.score}% (${credTest.status}) - ${credTest.details}`);
  
  // Show account creation improvement  
  const accountTest = testResponse.testing.results.find(r => r.promptId === 2);
  console.log(`🏭 Account Creation: ${accountTest.score}% (${accountTest.status}) - ${accountTest.details}`);
  
  console.log('\n🚀 DEPLOYMENT STATUS:');
  console.log(`Ready for Deployment: ${testResponse.testing.readyForDeployment ? 'YES' : 'PENDING'}`);
  
  if (testResponse.testing.totalScore >= 90) {
    console.log('\n🎉 SYSTEM READY FOR PRODUCTION DEPLOYMENT!');
  } else {
    console.log(`\n⚠️ System at ${testResponse.testing.totalScore}% - Near deployment threshold`);
  }
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

getTestResults().catch(console.error);