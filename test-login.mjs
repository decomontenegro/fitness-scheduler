import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testLogin() {
  console.log('🔐 Testando login...\n');
  
  // Test login as client
  console.log('1. Fazendo login como cliente...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'client@test.com',
      password: '123456'
    })
  });

  const loginData = await loginResponse.json();
  console.log('   Resposta:', loginData.success ? '✅ Sucesso' : '❌ Falhou');
  
  if (loginData.success) {
    console.log('   User:', loginData.user.name);
    console.log('   Role:', loginData.user.role);
    console.log('   Token (primeiros 20 chars):', loginData.token.substring(0, 20) + '...');
    
    // Get cookie from response
    const setCookie = loginResponse.headers.get('set-cookie');
    console.log('   Cookie definido:', setCookie ? '✅ Sim' : '❌ Não');
    
    if (setCookie) {
      // Test accessing dashboard with cookie
      console.log('\n2. Tentando acessar dashboard com cookie...');
      const dashboardResponse = await fetch(`${BASE_URL}/dashboard/client`, {
        headers: {
          'Cookie': setCookie
        },
        redirect: 'manual'
      });
      
      console.log('   Status:', dashboardResponse.status);
      console.log('   Status Text:', dashboardResponse.statusText);
      
      if (dashboardResponse.status === 307) {
        console.log('   Redirecionado para:', dashboardResponse.headers.get('location'));
      } else if (dashboardResponse.status === 200) {
        console.log('   ✅ Dashboard acessível!');
      }
    }
  } else {
    console.log('   Erro:', loginData.error);
  }
}

testLogin().catch(console.error);