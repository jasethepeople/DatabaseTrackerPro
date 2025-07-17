#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🧪 ${title}`, 'bright');
  console.log('='.repeat(60));
}

function logTest(name, success, details = '') {
  const status = success ? `✅ PASS` : `❌ FAIL`;
  const color = success ? 'green' : 'red';
  log(`  ${status} - ${name}`, color);
  if (details) {
    log(`       ${details}`, 'yellow');
  }
}

async function apiRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    return { ok: response.ok, status: response.status, data: result };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// Test 1: Authentication and Token Generation
async function testAuthentication() {
  logSection('AUTHENTICATION SYSTEM');
  
  // Test login
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password' })
  });
  
  const loginData = await loginResponse.json();
  authToken = loginData.token;
  
  logTest('Admin login', loginResponse.ok && authToken, `Token length: ${authToken?.length || 0}`);
  
  // Test token validation
  const meResponse = await apiRequest('GET', '/api/auth/me');
  logTest('Token validation', meResponse.ok && meResponse.data.username === 'admin');
  
  return authToken ? 1 : 0;
}

// Test 2: Deployment Dashboard and API
async function testDeploymentDashboard() {
  logSection('DEPLOYMENT DASHBOARD');
  
  // Test deployment list
  const listResponse = await apiRequest('GET', '/api/deployment/list');
  logTest('Get deployment list', listResponse.ok && Array.isArray(listResponse.data.deployments));
  
  // Test Heroku deployment
  const herokuResponse = await apiRequest('POST', '/api/deployment/heroku', {
    appName: 'test-app-' + Date.now(),
    buildpack: 'heroku/nodejs',
    environment: { NODE_ENV: 'production' },
    region: 'us'
  });
  logTest('Heroku deployment', herokuResponse.ok && herokuResponse.data.success, 
    herokuResponse.data?.url || 'No URL returned');
  
  // Test Vercel deployment
  const vercelResponse = await apiRequest('POST', '/api/deployment/vercel', {
    projectName: 'test-project-' + Date.now(),
    framework: 'nextjs',
    environment: { NODE_ENV: 'production' }
  });
  logTest('Vercel deployment', vercelResponse.ok && vercelResponse.data.success,
    vercelResponse.data?.url || 'No URL returned');
  
  // Test comprehensive deployment test
  const comprehensiveResponse = await apiRequest('POST', '/api/deployment/test-comprehensive');
  logTest('Comprehensive deployment test', 
    comprehensiveResponse.ok && comprehensiveResponse.data.success,
    `Success rate: ${comprehensiveResponse.data?.testing?.successfulDeployments || 0}/${comprehensiveResponse.data?.testing?.totalDeployments || 0}`);
  
  return (listResponse.ok && herokuResponse.ok && vercelResponse.ok) ? 1 : 0;
}

// Test 3: Self-Repair System
async function testSelfRepair() {
  logSection('AUTONOMOUS SELF-REPAIR SYSTEM');
  
  // Test system health check
  const healthResponse = await apiRequest('GET', '/api/repair/system-status');
  logTest('System health check', healthResponse.ok && healthResponse.data.status,
    `Database: ${healthResponse.data.status?.database?.healthy ? 'Healthy' : 'Issues'}`);
  
  // Test repair history
  const historyResponse = await apiRequest('GET', '/api/repair/history');
  logTest('Repair history', historyResponse.ok && Array.isArray(historyResponse.data.history),
    `Total repairs: ${historyResponse.data?.history?.length || 0}`);
  
  // Test knowledge base size
  const knowledgeResponse = await apiRequest('GET', '/api/repair/knowledge-base-size');
  logTest('Knowledge base', knowledgeResponse.ok && knowledgeResponse.data.size !== undefined,
    `Size: ${knowledgeResponse.data?.size || 0} entries`);
  
  // Test AI knowledge
  const aiKnowledgeResponse = await apiRequest('GET', '/api/debug/ai-knowledge');
  logTest('AI knowledge base', aiKnowledgeResponse.ok && Array.isArray(aiKnowledgeResponse.data.knowledge),
    `Patterns: ${aiKnowledgeResponse.data?.knowledge?.length || 0}`);
  
  // Test force repair capability
  const repairResponse = await apiRequest('POST', '/api/repair/force-repair', {
    issue: { type: 'test_issue', description: 'Testing repair capability' }
  });
  logTest('Force repair capability', repairResponse.ok && repairResponse.data.success !== undefined);
  
  return healthResponse.ok && historyResponse.ok ? 1 : 0;
}

// Test 4: API Discovery System
async function testAPIDiscovery() {
  logSection('API DISCOVERY SYSTEM');
  
  // Test API search
  const searchResponse = await apiRequest('POST', '/api/discovery/search', {
    query: 'payment processing',
    category: 'payment',
    useCase: 'e-commerce'
  });
  logTest('API search', searchResponse.ok && Array.isArray(searchResponse.data.apis),
    `Found: ${searchResponse.data?.apis?.length || 0} APIs`);
  
  // Test popular APIs
  const popularResponse = await apiRequest('GET', '/api/discovery/popular');
  logTest('Popular APIs', popularResponse.ok && Array.isArray(popularResponse.data.apis),
    `Available: ${popularResponse.data?.apis?.length || 0} APIs`);
  
  // Test API categories
  const categoriesResponse = await apiRequest('GET', '/api/discovery/categories');
  logTest('API categories', categoriesResponse.ok && Array.isArray(categoriesResponse.data.categories),
    `Categories: ${categoriesResponse.data?.categories?.join(', ') || 'None'}`);
  
  return searchResponse.ok && popularResponse.ok ? 1 : 0;
}

// Test 5: Credential Management
async function testCredentialManagement() {
  logSection('CREDENTIAL MANAGEMENT SYSTEM');
  
  // Test credential scan
  const scanResponse = await apiRequest('POST', '/api/discovery/scan-credentials', {
    environment: 'browser',
    autoExtract: true
  });
  logTest('Credential scan', scanResponse.ok,
    `Found: ${scanResponse.data?.credentials?.length || 0} credentials`);
  
  // Test credential storage
  const storeResponse = await apiRequest('POST', '/api/credentials/store', {
    service: 'test-api',
    key: 'test_key_' + Date.now(),
    value: 'test_secret_value',
    encrypted: true
  });
  logTest('Store credential', storeResponse.ok && storeResponse.data.success);
  
  // Test credential retrieval
  const getResponse = await apiRequest('GET', '/api/credentials/list');
  logTest('List credentials', getResponse.ok && Array.isArray(getResponse.data.credentials),
    `Stored: ${getResponse.data?.credentials?.length || 0} credentials`);
  
  // Test encryption status
  const encryptionResponse = await apiRequest('GET', '/api/credentials/encryption-status');
  logTest('Encryption status', encryptionResponse.ok,
    `Algorithm: ${encryptionResponse.data?.algorithm || 'Unknown'}`);
  
  return storeResponse.ok && getResponse.ok ? 1 : 0;
}

// Test 6: Account Creation System
async function testAccountCreation() {
  logSection('AUTOMATED ACCOUNT CREATION');
  
  // Test supported services
  const servicesResponse = await apiRequest('GET', '/api/discovery/supported-services');
  logTest('Supported services', servicesResponse.ok && Array.isArray(servicesResponse.data.services),
    `Services: ${servicesResponse.data?.services?.join(', ') || 'None'}`);
  
  // Test account creation for GitHub
  const githubResponse = await apiRequest('POST', '/api/discovery/create-account', {
    service: 'github',
    username: 'test_user_' + Date.now(),
    email: 'test@example.com'
  });
  logTest('GitHub account creation', githubResponse.ok,
    `Success: ${githubResponse.data?.success || false}`);
  
  // Test account creation for Heroku
  const herokuResponse = await apiRequest('POST', '/api/discovery/create-account', {
    service: 'heroku',
    email: 'test@example.com'
  });
  logTest('Heroku account creation', herokuResponse.ok,
    `Success: ${herokuResponse.data?.success || false}`);
  
  // Test account validation
  const validateResponse = await apiRequest('POST', '/api/discovery/validate-account', {
    service: 'github',
    credentials: { username: 'test_user', token: 'test_token' }
  });
  logTest('Account validation', validateResponse.ok);
  
  return servicesResponse.ok ? 1 : 0;
}

// Test 7: Database Storage
async function testDatabaseStorage() {
  logSection('DATABASE STORAGE SYSTEM');
  
  // Test database connection
  const dbStatusResponse = await apiRequest('GET', '/api/system/database-status');
  logTest('Database connection', dbStatusResponse.ok && dbStatusResponse.data.connected,
    `Status: ${dbStatusResponse.data?.status || 'Unknown'}`);
  
  // Test data persistence
  const testData = {
    type: 'test_record',
    data: { timestamp: Date.now(), value: 'test_value' }
  };
  
  const createResponse = await apiRequest('POST', '/api/system/test-persistence', testData);
  logTest('Data persistence', createResponse.ok && createResponse.data.id);
  
  // Test data retrieval
  if (createResponse.ok && createResponse.data.id) {
    const getDataResponse = await apiRequest('GET', `/api/system/test-persistence/${createResponse.data.id}`);
    logTest('Data retrieval', getDataResponse.ok && getDataResponse.data.data.value === 'test_value');
  }
  
  // Test encryption in database
  const encryptedResponse = await apiRequest('POST', '/api/system/test-encrypted-storage', {
    sensitive: 'secret_data',
    encrypted: true
  });
  logTest('Encrypted storage', encryptedResponse.ok && encryptedResponse.data.success);
  
  return dbStatusResponse.ok && createResponse.ok ? 1 : 0;
}

// Test 8: AI Capabilities
async function testAICapabilities() {
  logSection('AI AGENT CAPABILITIES');
  
  // Test AI chat
  const chatResponse = await apiRequest('POST', '/api/ai/chat', {
    message: 'Generate a simple hello world function in JavaScript'
  });
  logTest('AI chat response', chatResponse.ok && chatResponse.data.response,
    `Response length: ${chatResponse.data?.response?.length || 0} chars`);
  
  // Test code generation
  const codeGenResponse = await apiRequest('POST', '/api/ai/generate-code', {
    prompt: 'Create a REST API endpoint for user authentication',
    language: 'javascript'
  });
  logTest('Code generation', codeGenResponse.ok && codeGenResponse.data.code);
  
  // Test AI suggestions
  const suggestionsResponse = await apiRequest('POST', '/api/ai/suggestions', {
    code: 'function add(a, b) { return a + b }',
    language: 'javascript'
  });
  logTest('AI suggestions', suggestionsResponse.ok && Array.isArray(suggestionsResponse.data.suggestions),
    `Suggestions: ${suggestionsResponse.data?.suggestions?.length || 0}`);
  
  return chatResponse.ok && codeGenResponse.ok ? 1 : 0;
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('🚀 COMPREHENSIVE FEATURE TESTING SUITE', 'cyan');
  console.log('='.repeat(60));
  log(`Testing server at: ${BASE_URL}`, 'blue');
  log(`Started at: ${new Date().toLocaleString()}`, 'blue');
  
  let totalTests = 0;
  let passedTests = 0;
  
  try {
    // Run all tests
    passedTests += await testAuthentication();
    totalTests++;
    
    passedTests += await testDeploymentDashboard();
    totalTests++;
    
    passedTests += await testSelfRepair();
    totalTests++;
    
    passedTests += await testAPIDiscovery();
    totalTests++;
    
    passedTests += await testCredentialManagement();
    totalTests++;
    
    passedTests += await testAccountCreation();
    totalTests++;
    
    passedTests += await testDatabaseStorage();
    totalTests++;
    
    passedTests += await testAICapabilities();
    totalTests++;
    
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  log('📊 TEST SUMMARY', 'bright');
  console.log('='.repeat(60));
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  const summaryColor = passedTests === totalTests ? 'green' : passedTests > totalTests / 2 ? 'yellow' : 'red';
  
  log(`Total Test Categories: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  log(`Success Rate: ${successRate}%`, summaryColor);
  
  if (passedTests === totalTests) {
    log('\n🎉 ALL TESTS PASSED! System is fully operational.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the logs above.', 'yellow');
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(console.error);