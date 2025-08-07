const http = require('http');

// Login request
const loginData = JSON.stringify({
  email: 'test-trainer@fitness.com',
  password: '123456'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.success) {
      console.log('✅ Login successful\!');
      console.log('User:', result.user.name, '(' + result.user.role + ')');
      console.log('Token:', result.accessToken ? 'Present' : 'Missing');
      console.log('\n📝 To access dashboard, use this token in localStorage:');
      console.log('localStorage.setItem("token", "' + result.accessToken + '");');
      console.log('localStorage.setItem("user", \'' + JSON.stringify(result.user) + '\');');
      console.log('\n🚀 Then navigate to: http://localhost:3001/dashboard/trainer');
    } else {
      console.log('❌ Login failed:', result.error);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(loginData);
req.end();
