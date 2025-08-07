const jwt = require('jsonwebtoken');

// Use the same JWT_SECRET
const JWT_SECRET = 'fitness-scheduler-jwt-super-secure-secret-key-development-only-32-chars';

async function testTokenFlow() {
  console.log('🔧 Testing Complete JWT Flow\n');
  
  // Step 1: Login to get a fresh token
  console.log('1. Getting fresh token from login...');
  
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test-client@fitness.com',
      password: 'password123'
    })
  });
  
  const loginData = await loginResponse.json();
  const token = loginData.accessToken;
  
  if (!token) {
    console.log('❌ Failed to get token from login');
    console.log('Response:', loginData);
    return;
  }
  
  console.log('✅ Got token:', token.substring(0, 30) + '...\n');
  
  // Step 2: Decode and verify the token
  console.log('2. Decoding token...');
  const decoded = jwt.decode(token);
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
  
  // Step 3: Verify token with our secret
  console.log('\n3. Verifying token with our secret...');
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verification PASSED');
    console.log('Verified payload:', JSON.stringify(verified, null, 2));
  } catch (error) {
    console.log('❌ Token verification FAILED');
    console.log('Error:', error.message);
  }
  
  // Step 4: Test API call with token
  console.log('\n4. Testing API call with token...');
  const apiResponse = await fetch('http://localhost:3000/api/dashboard/client', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('API Response Status:', apiResponse.status);
  const apiData = await apiResponse.text();
  
  try {
    const jsonData = JSON.parse(apiData);
    console.log('API Response (JSON):', JSON.stringify(jsonData, null, 2));
  } catch {
    console.log('API Response (Text):', apiData.substring(0, 200));
  }
  
  // Step 5: Check time sync
  console.log('\n5. Time Synchronization Check:');
  const now = Math.floor(Date.now() / 1000);
  console.log('Current Unix time:', now);
  console.log('Token iat:', decoded.iat);
  console.log('Token exp:', decoded.exp);
  console.log('Time until expiry:', (decoded.exp - now), 'seconds');
  console.log('Token age:', (now - decoded.iat), 'seconds');
}

testTokenFlow().catch(console.error);