const jwt = require('jsonwebtoken');

const JWT_SECRET = 'fitness-scheduler-jwt-super-secure-secret-key-development-only-32-chars';
const JWT_EXPIRES_IN = '1h';

console.log('Testing JWT configuration...\n');

// Test with the same configuration as the app
const payload = {
  userId: 'test-user',
  email: 'test@example.com',
  role: 'CLIENT',
  tokenType: 'access'
};

console.log('JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

// Generate token
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: JWT_EXPIRES_IN
});

console.log('Generated token:', token.substring(0, 50) + '...');

// Decode and check
const decoded = jwt.decode(token);
const now = Math.floor(Date.now() / 1000);

console.log('\nDecoded token:');
console.log('iat (issued at):', decoded.iat, '=', new Date(decoded.iat * 1000).toISOString());
console.log('exp (expires):', decoded.exp, '=', new Date(decoded.exp * 1000).toISOString());
console.log('Duration:', decoded.exp - decoded.iat, 'seconds =', (decoded.exp - decoded.iat) / 3600, 'hours');

// Verify token
try {
  const verified = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Token verification: PASSED');
} catch (error) {
  console.log('\n❌ Token verification: FAILED');
  console.log('Error:', error.message);
}