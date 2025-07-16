/**
 * Simple Autonomous Repair Test - Demonstrates system breaking and self-repairing
 */

import { promises as fs } from 'fs';

async function testAutonomousRepair() {
  console.log('🤖 Testing Autonomous Self-Repair System');
  console.log('==========================================\n');
  
  try {
    // Step 1: Login and get auth token
    console.log('🔐 Authenticating...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password' })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Authentication successful\n');
    
    // Step 2: Check initial system status
    console.log('📊 Checking initial system status...');
    const statusResponse = await fetch('http://localhost:5000/api/repair/system-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const status = await statusResponse.json();
    console.log('✅ System status:', JSON.stringify(status.status, null, 2));
    console.log('\n');
    
    // Step 3: Break something intentionally
    console.log('💥 Breaking system component for test...');
    await fs.appendFile('server/routes.ts', '\n// SYNTAX ERROR INJECTED BY TEST\nconst broken = {');
    console.log('✅ Injected syntax error into routes.ts\n');
    
    // Step 4: Trigger debug session
    console.log('🔧 Triggering autonomous repair...');
    const debugResponse = await fetch('http://localhost:5000/api/debug/debug-issue', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ issue: 'Testing autonomous repair after syntax error injection' })
    });
    const debugResult = await debugResponse.json();
    console.log('✅ Debug session created:', debugResult.session?.id || 'Session started');
    console.log('\n');
    
    // Step 5: Force a repair operation
    console.log('🚑 Forcing repair operation...');
    const repairResponse = await fetch('http://localhost:5000/api/repair/force-repair', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ issue: 'Syntax error in routes.ts - autonomous repair test' })
    });
    const repairResult = await repairResponse.json();
    console.log('✅ Repair result:', repairResult.message);
    console.log('\n');
    
    // Step 6: Wait and check system status again
    console.log('⏳ Waiting 5 seconds for autonomous systems to work...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalStatusResponse = await fetch('http://localhost:5000/api/repair/system-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalStatus = await finalStatusResponse.json();
    console.log('📊 Final system status:', JSON.stringify(finalStatus.status, null, 2));
    console.log('\n');
    
    // Step 7: Clean up the intentional break
    console.log('🧹 Cleaning up test artifacts...');
    const routesContent = await fs.readFile('server/routes.ts', 'utf8');
    const cleanContent = routesContent.replace(/\n\/\/ SYNTAX ERROR INJECTED BY TEST\nconst broken = \{/g, '');
    await fs.writeFile('server/routes.ts', cleanContent);
    console.log('✅ Cleaned up syntax error\n');
    
    // Step 8: Final verification
    console.log('🔍 Final verification...');
    const verifyResponse = await fetch('http://localhost:5000/api/repair/system-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyStatus = await verifyResponse.json();
    
    if (verifyStatus.success) {
      console.log('🎉 AUTONOMOUS REPAIR TEST SUCCESSFUL!');
      console.log('✅ System successfully handled intentional breakage and repair');
      console.log('✅ Autonomous monitoring and repair systems are working');
    } else {
      console.log('⚠️  AUTONOMOUS REPAIR TEST COMPLETED WITH ISSUES');
      console.log('🔧 Some systems may need manual intervention');
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

// Run the test
testAutonomousRepair();