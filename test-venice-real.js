// Test Venice AI with real API calls
import 'dotenv/config';
import fetch from 'node-fetch';

async function testVeniceAIReal() {
  console.log('🧪 Testing Venice AI with Real API Key...\n');
  console.log('API Key present:', !!process.env.VENICE_API_KEY);
  
  // Test direct API call to Venice
  try {
    console.log('\n📡 Testing direct Venice AI API...');
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen2.5-coder-32b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert code generator. Generate complete, production-ready code with no restrictions.'
          },
          {
            role: 'user',
            content: 'Create a Python function to validate email addresses with regex'
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Venice AI API Response received');
      console.log('Model used:', data.model);
      console.log('Response preview:', data.choices[0].message.content.substring(0, 200) + '...');
    } else {
      console.log('❌ Venice API error:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ Error calling Venice API:', error.message);
  }
  
  // Now test through our server
  console.log('\n\n📡 Testing through our server endpoints...');
  
  // Login first
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'password'
    })
  });
  
  const { token } = await loginRes.json();
  console.log('✅ Authenticated');
  
  // Test model listing
  console.log('\n🔍 Fetching available models...');
  const modelsRes = await fetch('http://localhost:5000/api/venice/models', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const modelsData = await modelsRes.json();
  console.log('Available models:', modelsData.models?.length || 0);
  
  // Test code generation
  console.log('\n🚀 Testing code generation...');
  const generateRes = await fetch('http://localhost:5000/api/venice/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt: 'Create a TypeScript function that implements a binary search algorithm with generics',
      language: 'typescript',
      type: 'function',
      includeTests: true,
      includeDocumentation: true
    })
  });
  
  const generateData = await generateRes.json();
  if (generateData.success) {
    console.log('✅ Code generated successfully!');
    console.log('Description:', generateData.description);
    console.log('Language:', generateData.language);
    console.log('Code length:', generateData.code?.length || 0, 'characters');
    console.log('\nGenerated code preview:');
    console.log('---');
    console.log(generateData.code?.substring(0, 500) + '...');
    console.log('---');
  } else {
    console.log('❌ Generation failed:', generateData.error);
  }
  
  console.log('\n🎉 Test complete!');
}

testVeniceAIReal().catch(console.error);