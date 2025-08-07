#!/usr/bin/env node

/**
 * JWT Authentication Debug Tool
 * Tests API endpoint access with JWT tokens to diagnose HTML vs JSON response issues
 */

const fs = require('fs');
const https = require('https');

const BASE_URL = 'http://localhost:3002';
const TEST_CREDENTIALS = {
  email: 'test-client@fitness.com',
  password: 'password123'
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : require('http');
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JWT-Debug-Tool/1.0',
        ...options.headers
      }
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    log('blue', `Making ${requestOptions.method} request to ${url}`);
    if (options.headers?.Authorization) {
      log('cyan', `Authorization header: ${options.headers.Authorization.substring(0, 20)}...`);
    }

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      
      log('green', `Response status: ${res.statusCode}`);
      log('cyan', `Response headers:`, res.headers);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsedData;
        const contentType = res.headers['content-type'] || '';
        
        try {
          if (contentType.includes('application/json')) {
            parsedData = JSON.parse(data);
            log('green', 'Response is valid JSON');
          } else {
            parsedData = data;
            log('yellow', `Response content type: ${contentType}`);
            if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
              log('red', 'Response appears to be HTML instead of JSON!');
            }
          }
        } catch (error) {
          log('red', `Failed to parse response: ${error.message}`);
          parsedData = data;
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData,
          rawData: data
        });
      });
    });

    req.on('error', (error) => {
      log('red', `Request error: ${error.message}`);
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function login() {
  log('blue', 'Step 1: Attempting login...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    if (response.statusCode === 200 && response.data.success) {
      log('green', 'Login successful!');
      log('cyan', 'Login response:', response.data);
      
      // Extract cookies from response
      const cookies = {};
      const setCookieHeaders = response.headers['set-cookie'] || [];
      
      setCookieHeaders.forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          cookies[name.trim()] = value.trim();
        }
      });
      
      log('cyan', 'Extracted cookies:', cookies);
      
      return {
        user: response.data.user,
        accessToken: response.data.accessToken,
        cookies: cookies,
        requiresTwoFactor: response.data.requiresTwoFactor
      };
    } else {
      log('red', 'Login failed!');
      log('red', 'Response:', response);
      return null;
    }
  } catch (error) {
    log('red', `Login error: ${error.message}`);
    return null;
  }
}

async function testApiEndpoint(authData, endpoint) {
  log('blue', `Step 2: Testing API endpoint ${endpoint}...`);
  
  if (!authData) {
    log('red', 'No authentication data available');
    return;
  }
  
  const tests = [
    {
      name: 'Using Authorization Header',
      headers: {
        'Authorization': `Bearer ${authData.accessToken}`
      }
    },
    {
      name: 'Using Cookie (access-token)',
      headers: {
        'Cookie': `access-token=${authData.cookies['access-token'] || authData.accessToken}`
      }
    },
    {
      name: 'Using Cookie (auth-token)',
      headers: {
        'Cookie': `auth-token=${authData.cookies['auth-token'] || authData.accessToken}`
      }
    },
    {
      name: 'Using Multiple Cookies',
      headers: {
        'Cookie': Object.entries(authData.cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')
      }
    }
  ];
  
  for (const test of tests) {
    log('magenta', `\nTesting: ${test.name}`);
    
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: test.headers
      });
      
      log('cyan', `Status: ${response.statusCode}`);
      
      // Check if we got redirected
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        log('yellow', 'Redirect detected!');
        log('yellow', `Location: ${response.headers.location}`);
      }
      
      // Check response content type
      const contentType = response.headers['content-type'] || '';
      log('cyan', `Content-Type: ${contentType}`);
      
      // Analyze response
      if (contentType.includes('application/json')) {
        log('green', '✅ Received JSON response');
        if (typeof response.data === 'object') {
          log('green', 'Response data:', response.data);
        }
      } else if (contentType.includes('text/html')) {
        log('red', '❌ Received HTML instead of JSON!');
        
        // Check if it's a login page
        if (response.rawData.includes('login') || response.rawData.includes('Login')) {
          log('red', '🚨 Appears to be redirected to login page');
        }
        
        // Show first few lines of HTML for debugging
        const htmlLines = response.rawData.split('\n').slice(0, 10);
        log('yellow', 'HTML content preview:');
        htmlLines.forEach(line => console.log(`  ${line.trim()}`));
      } else {
        log('yellow', `Unexpected content type: ${contentType}`);
      }
      
      // Check for specific headers that might indicate middleware processing
      if (response.headers['x-user-id']) {
        log('green', '✅ User ID header present:', response.headers['x-user-id']);
      } else {
        log('red', '❌ User ID header missing');
      }
      
      if (response.headers['x-user-role']) {
        log('green', '✅ User role header present:', response.headers['x-user-role']);
      } else {
        log('red', '❌ User role header missing');
      }
      
    } catch (error) {
      log('red', `Test failed: ${error.message}`);
    }
    
    log('blue', '─'.repeat(80));
  }
}

async function testTokenValidity(accessToken) {
  log('blue', 'Step 3: Testing JWT token validity...');
  
  if (!accessToken) {
    log('red', 'No access token available');
    return;
  }
  
  try {
    // Decode JWT without verification (just to inspect)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      log('red', 'Invalid JWT format');
      return;
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    log('green', 'JWT Header:', header);
    log('green', 'JWT Payload:', payload);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp) {
      const timeToExpiry = payload.exp - now;
      if (timeToExpiry > 0) {
        log('green', `✅ Token valid for ${Math.floor(timeToExpiry / 60)} more minutes`);
      } else {
        log('red', '❌ Token has expired!');
      }
    }
    
    // Check required fields
    const requiredFields = ['userId', 'email', 'role'];
    requiredFields.forEach(field => {
      if (payload[field]) {
        log('green', `✅ ${field}: ${payload[field]}`);
      } else {
        log('red', `❌ Missing ${field} in token`);
      }
    });
    
  } catch (error) {
    log('red', `Token parsing error: ${error.message}`);
  }
}

async function testMiddlewareConfig() {
  log('blue', 'Step 4: Testing middleware configuration...');
  
  // Test if the middleware is being triggered for API routes
  try {
    const response = await makeRequest(`${BASE_URL}/api/dashboard/client`);
    
    if (response.statusCode === 401) {
      log('green', '✅ Middleware is protecting the API route (returns 401)');
    } else if (response.statusCode === 302 || response.statusCode === 307) {
      log('yellow', '⚠️  Middleware is redirecting (might be to login page)');
      log('yellow', `Redirect location: ${response.headers.location}`);
    } else if (response.statusCode === 200) {
      log('red', '❌ API route is not protected (returns 200 without auth)');
    } else {
      log('yellow', `Unexpected status code: ${response.statusCode}`);
    }
  } catch (error) {
    log('red', `Middleware test error: ${error.message}`);
  }
}

async function generateCurlExamples(authData) {
  log('blue', 'Step 5: Generating curl examples for manual testing...');
  
  if (!authData) {
    log('red', 'No authentication data available');
    return;
  }
  
  const curlExamples = [
    {
      name: 'Using Authorization Header',
      command: `curl -H "Authorization: Bearer ${authData.accessToken}" \\
     -H "Content-Type: application/json" \\
     -v "${BASE_URL}/api/dashboard/client"`
    },
    {
      name: 'Using Cookie',
      command: `curl -H "Cookie: access-token=${authData.accessToken}" \\
     -H "Content-Type: application/json" \\
     -v "${BASE_URL}/api/dashboard/client"`
    },
    {
      name: 'Login curl command',
      command: `curl -X POST \\
     -H "Content-Type: application/json" \\
     -d '${JSON.stringify(TEST_CREDENTIALS)}' \\
     -c cookies.txt \\
     -v "${BASE_URL}/api/auth/login"`
    },
    {
      name: 'API call with saved cookies',
      command: `curl -b cookies.txt \\
     -H "Content-Type: application/json" \\
     -v "${BASE_URL}/api/dashboard/client"`
    }
  ];
  
  log('green', '\n📋 Manual testing commands:');
  curlExamples.forEach((example, index) => {
    console.log(`\n${index + 1}. ${example.name}:`);
    console.log(example.command);
  });
}

async function main() {
  console.log(`
${colors.cyan}
╔══════════════════════════════════════════════════════════════════════════════╗
║                           JWT Authentication Debug Tool                      ║
║                           Testing API endpoint access                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}
`);

  log('blue', 'Starting JWT authentication debug session...');
  log('cyan', `Base URL: ${BASE_URL}`);
  log('cyan', `Test credentials: ${TEST_CREDENTIALS.email}`);
  
  console.log('\n' + '═'.repeat(80) + '\n');
  
  // Step 1: Login
  const authData = await login();
  console.log('\n' + '═'.repeat(80) + '\n');
  
  // Step 2: Test API endpoint
  await testApiEndpoint(authData, '/api/dashboard/client');
  console.log('\n' + '═'.repeat(80) + '\n');
  
  // Step 3: Test token validity
  await testTokenValidity(authData?.accessToken);
  console.log('\n' + '═'.repeat(80) + '\n');
  
  // Step 4: Test middleware
  await testMiddlewareConfig();
  console.log('\n' + '═'.repeat(80) + '\n');
  
  // Step 5: Generate curl examples
  await generateCurlExamples(authData);
  
  console.log(`\n${colors.green}
╔══════════════════════════════════════════════════════════════════════════════╗
║                               Debug Complete                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  if (authData) {
    console.log(`\n${colors.yellow}💡 Key findings to check:
1. Are you getting HTML responses instead of JSON?
2. Is the middleware properly setting user headers (x-user-id, x-user-role)?
3. Is the JWT token valid and not expired?
4. Are cookies being set and sent correctly?
5. Is there a redirect happening that you're not expecting?${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Login failed - check:
1. Is the server running on ${BASE_URL}?
2. Do the test credentials exist in the database?
3. Are there any server errors in the logs?${colors.reset}`);
  }
}

// Run the debug session
if (require.main === module) {
  main().catch(error => {
    log('red', `Fatal error: ${error.message}`);
    process.exit(1);
  });
}