// Test Venice AI code generation
import fetch from 'node-fetch';

async function testVeniceAI() {
  console.log('🧪 Testing Venice AI Code Generation...\n');
  
  // First login to get auth token
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'password'
    })
  });
  
  const { token } = await loginRes.json();
  console.log('✅ Authenticated successfully');
  
  // Test prompts
  const testPrompts = [
    {
      prompt: "Create a Python function that validates email addresses using regex with proper error handling",
      language: "python",
      type: "function",
      includeTests: true,
      includeDocumentation: true
    },
    {
      prompt: "Build a React component for a todo list with add, delete, and complete functionality",
      language: "typescript",
      framework: "react",
      type: "frontend",
      includeTests: false,
      includeDocumentation: true
    },
    {
      prompt: "Generate an Express.js REST API endpoint for user authentication with JWT",
      language: "typescript",
      framework: "express",
      type: "api",
      includeTests: true,
      includeDocumentation: true
    },
    {
      prompt: "Create a database schema for an e-commerce platform with users, products, and orders",
      language: "typescript",
      type: "script",
      includeTests: false,
      includeDocumentation: true
    },
    {
      prompt: "Write a Python script to scrape weather data from a website and store it in JSON",
      language: "python",
      type: "script",
      includeTests: true,
      includeDocumentation: true
    }
  ];
  
  console.log('\n📝 Running test prompts...\n');
  
  for (let i = 0; i < testPrompts.length; i++) {
    const test = testPrompts[i];
    console.log(`\nTest ${i + 1}: ${test.prompt.substring(0, 50)}...`);
    console.log(`Language: ${test.language}, Type: ${test.type}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/venice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(test)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Code generated successfully');
        console.log(`   Description: ${result.description}`);
        console.log(`   Language: ${result.language}`);
        if (result.dependencies?.length) {
          console.log(`   Dependencies: ${result.dependencies.join(', ')}`);
        }
        console.log(`   Code preview: ${result.code.substring(0, 100)}...`);
      } else {
        console.log('❌ Generation failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  console.log('\n\n🎉 Venice AI testing complete!');
}

testVeniceAI().catch(console.error);