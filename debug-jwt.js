const jwt = require('jsonwebtoken');

// Use the same JWT_SECRET from .env
const JWT_SECRET = "fitness-scheduler-jwt-super-secure-secret-key-development-only-32-chars";

// Test token generation
function testTokenGeneration() {
  console.log('🔍 Testing JWT Token Generation\n');
  
  const payload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'CLIENT',
    tokenType: 'access'
  };
  
  // Generate a token with 1 hour expiration
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h'
  });
  
  console.log('✅ Generated Token:', token.substring(0, 50) + '...');
  
  // Decode without verification to see contents
  const decoded = jwt.decode(token);
  console.log('\n📝 Decoded Token Contents:');
  console.log(JSON.stringify(decoded, null, 2));
  
  // Check timestamps
  const now = Math.floor(Date.now() / 1000);
  console.log('\n⏰ Timestamp Analysis:');
  console.log(`   Current Unix Time: ${now}`);
  console.log(`   Token iat (issued): ${decoded.iat}`);
  console.log(`   Token exp (expires): ${decoded.exp}`);
  console.log(`   Difference (iat vs now): ${decoded.iat - now} seconds`);
  console.log(`   Token validity: ${decoded.exp - decoded.iat} seconds (${(decoded.exp - decoded.iat) / 3600} hours)`);
  
  // Verify the token
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    console.log('\n✅ Token verification: PASSED');
  } catch (error) {
    console.log(`\n❌ Token verification: FAILED - ${error.message}`);
  }
  
  // Test with a real token from login
  console.log('\n\n🔍 Testing Real Token from Login\n');
  
  // This would be the token from actual login
  const realTokenSample = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUwM3pheG4wMDAwcnRqNTVwdHBvbnR0IiwiZW1haWwiOiJ0ZXN0LWNsaWVudEBmaXRuZXNzLmNvbSIsInJvbGUiOiJDTElFTlQiLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NTQ0OTM1NTQsImV4cCI6MTc1NTA5ODM1NH0.FJNacJL2I61dLfHPxaVGjLmBVh7f0VUv4A8VwyOOL10';
  
  try {
    const decodedReal = jwt.decode(realTokenSample);
    console.log('📝 Real Token Decoded:');
    console.log(JSON.stringify(decodedReal, null, 2));
    
    const nowReal = Math.floor(Date.now() / 1000);
    console.log('\n⏰ Real Token Timestamp Analysis:');
    console.log(`   Current Unix Time: ${nowReal}`);
    console.log(`   Token iat: ${decodedReal.iat}`);
    console.log(`   Token exp: ${decodedReal.exp}`);
    console.log(`   Issue with iat: Token appears to be from ${new Date(decodedReal.iat * 1000).toISOString()}`);
    console.log(`   Current time is: ${new Date(nowReal * 1000).toISOString()}`);
    
    // Try to verify
    const verifiedReal = jwt.verify(realTokenSample, JWT_SECRET);
    console.log('\n✅ Real token verification: PASSED');
  } catch (error) {
    console.log(`\n❌ Real token verification: FAILED - ${error.message}`);
  }
  
  // Check system time
  console.log('\n\n🕐 System Time Check:');
  console.log(`   System Date: ${new Date().toISOString()}`);
  console.log(`   System Unix: ${Math.floor(Date.now() / 1000)}`);
}

testTokenGeneration();