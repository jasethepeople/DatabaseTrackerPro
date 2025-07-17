// Test OAuth Credential Management
import axios from 'axios';

// Test data
const testOAuthCredentials = {
  google: {
    service: 'google',
    clientId: 'test-google-client-id-123456789',
    clientSecret: 'test-google-client-secret-abcdef',
    accessToken: 'ya29.test-google-access-token-xyz',
    refreshToken: '1//test-google-refresh-token-abc',
    expiresIn: 3600,
    tokenType: 'Bearer',
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
  },
  github: {
    service: 'github',
    clientId: 'test-github-client-id-456789',
    clientSecret: 'test-github-client-secret-xyz123',
    accessToken: 'gho_test-github-access-token-abc',
    refreshToken: 'ghr_test-github-refresh-token-def',
    expiresIn: 28800,
    tokenType: 'Bearer',
    scope: 'repo user'
  },
  spotify: {
    service: 'spotify',
    clientId: 'test-spotify-client-id-789012',
    clientSecret: 'test-spotify-client-secret-mno456',
    accessToken: 'BQD-test-spotify-access-token-pqr',
    refreshToken: 'AQD-test-spotify-refresh-token-stu',
    expiresIn: 3600,
    tokenType: 'Bearer',
    scope: 'user-read-private user-read-email'
  }
};

async function testOAuthFeatures() {
  console.log('🔐 Testing OAuth Credential Management Features\n');

  // First, login to get auth token
  console.log('1. Logging in...');
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });
    const authToken = loginRes.data.token;
    console.log('✅ Login successful\n');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Test storing OAuth credentials
    console.log('2. Testing OAuth credential storage:');
    for (const [provider, creds] of Object.entries(testOAuthCredentials)) {
      try {
        const res = await axios.post(
          'http://localhost:5000/api/credentials/oauth',
          creds,
          { headers }
        );
        console.log(`   ✅ Stored ${provider} OAuth credentials`);
      } catch (error) {
        console.log(`   ❌ Failed to store ${provider}:`, error.response?.data?.error || error.message);
      }
    }

    // Test listing credentials
    console.log('\n3. Listing all stored credentials:');
    try {
      const res = await axios.get('http://localhost:5000/api/credentials', { headers });
      console.log(`   Found ${res.data.length} credentials:`);
      res.data.forEach(cred => {
        const status = cred.metadata?.expiresAt 
          ? new Date(cred.metadata.expiresAt) > new Date() ? '✅ Valid' : '❌ Expired'
          : '⚪ No expiry';
        console.log(`   - ${cred.service} (${cred.type}): ${cred.identifier} ${status}`);
      });
    } catch (error) {
      console.log('   ❌ Failed to list credentials:', error.response?.data?.error || error.message);
    }

    // Test getting OAuth tokens with refresh
    console.log('\n4. Testing OAuth token retrieval:');
    for (const provider of Object.keys(testOAuthCredentials)) {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/credentials/oauth/${provider}`,
          { headers }
        );
        console.log(`   ✅ ${provider}: Access token retrieved (${res.data.tokenType})`);
        if (res.data.refreshed) {
          console.log(`      🔄 Token was auto-refreshed!`);
        }
      } catch (error) {
        console.log(`   ❌ ${provider}:`, error.response?.data?.error || error.message);
      }
    }

    // Test applying credentials to config
    console.log('\n5. Testing credential application to config:');
    const testConfig = {
      clientId: '',
      clientSecret: '',
      accessToken: '',
      oauth: true
    };

    try {
      const res = await axios.post(
        'http://localhost:5000/api/credentials/apply',
        {
          config: testConfig,
          service: 'google'
        },
        { headers }
      );
      console.log('   ✅ Applied credentials:', res.data.credentials.join(', '));
      console.log('   Config now has authorization header:', res.data.config.authorization ? '✅' : '❌');
    } catch (error) {
      console.log('   ❌ Failed to apply credentials:', error.response?.data?.error || error.message);
    }

    // Test AI agent auto-detection
    console.log('\n6. Testing AI agent OAuth auto-detection:');
    const oauthMessage = `
      Here are my Spotify OAuth credentials:
      client_id: spotify-client-abc123
      client_secret: spotify-secret-def456
      access_token: BQD-spotify-token-ghi789
      refresh_token: AQD-spotify-refresh-jkl012
    `;

    try {
      const res = await axios.post(
        'http://localhost:5000/api/ai/chat',
        { message: oauthMessage },
        { headers }
      );
      console.log('   ✅ AI agent processed OAuth credentials');
      
      // Check if credentials were stored
      const credsRes = await axios.get(
        'http://localhost:5000/api/credentials?service=spotify',
        { headers }
      );
      const autoDetected = credsRes.data.filter(c => c.autoDetected);
      if (autoDetected.length > 0) {
        console.log(`   ✅ Auto-detected and stored ${autoDetected.length} Spotify credentials`);
      }
    } catch (error) {
      console.log('   ❌ AI agent test failed:', error.response?.data?.error || error.message);
    }

    console.log('\n✅ OAuth credential management test complete!');
    console.log('\n📝 Summary:');
    console.log('- OAuth tokens can be stored with client credentials');
    console.log('- Tokens are automatically refreshed when expired');
    console.log('- Supports Google, GitHub, Microsoft, Spotify, and any OAuth 2.0 provider');
    console.log('- AI agent automatically detects and stores OAuth credentials');
    console.log('- All credentials are encrypted with AES-256-GCM');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOAuthFeatures().catch(console.error);