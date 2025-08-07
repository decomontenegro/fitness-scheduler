const jwt = require('jsonwebtoken');

const JWT_SECRET = 'fitness-scheduler-jwt-super-secure-secret-key-development-only-32-chars';

// This is the actual token from the login
const actualToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWUwM3pzcHkwMDAwcnRseTl3bjNmNWQzIiwiZW1haWwiOiJ0ZXN0LWNsaWVudEBmaXRuZXNzLmNvbSIsInJvbGUiOiJDTElFTlQiLCJkZXZpY2VJZCI6IjdhMDQyYzYwOTIyNTEwZjciLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NTQ0OTU1ODUsImV4cCI6MTc1NTEwMDM4NX0.jbLC8lOLoDREE-sqQuUfLK_EbZMiXkaPLxfUXHYX4Rg';

console.log('Testing actual token from login...\n');

// Decode without verification
const decoded = jwt.decode(actualToken);
console.log('Decoded payload:', JSON.stringify(decoded, null, 2));

// Check timestamps
const now = Math.floor(Date.now() / 1000);
console.log('\nTime analysis:');
console.log('Current time:', now);
console.log('Token iat:', decoded.iat);
console.log('Token exp:', decoded.exp);
console.log('Duration:', (decoded.exp - decoded.iat) / 3600, 'hours');
console.log('Time until expiry:', (decoded.exp - now) / 3600, 'hours');

// Try to verify
console.log('\nVerifying token with JWT_SECRET...');
try {
  const verified = jwt.verify(actualToken, JWT_SECRET);
  console.log('✅ Verification PASSED');
  console.log('Verified payload:', JSON.stringify(verified, null, 2));
} catch (error) {
  console.log('❌ Verification FAILED');
  console.log('Error:', error.message);
  
  // Try with different options
  console.log('\nTrying with ignoreExpiration...');
  try {
    const verifiedIgnoreExp = jwt.verify(actualToken, JWT_SECRET, { ignoreExpiration: true });
    console.log('✅ Verification PASSED (ignoring expiration)');
  } catch (err2) {
    console.log('❌ Still failed:', err2.message);
  }
}