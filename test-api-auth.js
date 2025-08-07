#!/usr/bin/env node

const baseUrl = 'http://localhost:3000';

// Test credentials
const testClient = {
  email: 'test-client@fitness.com',
  password: 'password123'
};

const testTrainer = {
  email: 'test-trainer@fitness.com',
  password: 'password123'
};

async function testAuth() {
  console.log('🔧 Testing Authentication System...\n');

  try {
    // Test 1: Login as Client
    console.log('📝 Test 1: Client Login');
    const clientLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testClient)
    });
    
    if (!clientLoginResponse.ok) {
      throw new Error(`Client login failed: ${clientLoginResponse.status}`);
    }
    
    const clientData = await clientLoginResponse.json();
    console.log('✅ Client login successful');
    console.log(`   Token: ${clientData.accessToken?.substring(0, 20)}...`);
    console.log(`   Role: ${clientData.user?.role}`);
    
    // Test 2: Access Client Dashboard API
    console.log('\n📝 Test 2: Client Dashboard API');
    const clientDashboardResponse = await fetch(`${baseUrl}/api/dashboard/client`, {
      headers: {
        'Authorization': `Bearer ${clientData.accessToken}`
      }
    });
    
    if (!clientDashboardResponse.ok) {
      const error = await clientDashboardResponse.text();
      console.log(`❌ Client dashboard API failed: ${clientDashboardResponse.status}`);
      console.log(`   Error: ${error}`);
    } else {
      const dashboardData = await clientDashboardResponse.json();
      console.log('✅ Client dashboard API accessible');
      console.log(`   Upcoming appointments: ${dashboardData.upcomingAppointments?.length || 0}`);
    }
    
    // Test 3: Login as Trainer
    console.log('\n📝 Test 3: Trainer Login');
    const trainerLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTrainer)
    });
    
    if (!trainerLoginResponse.ok) {
      throw new Error(`Trainer login failed: ${trainerLoginResponse.status}`);
    }
    
    const trainerData = await trainerLoginResponse.json();
    console.log('✅ Trainer login successful');
    console.log(`   Token: ${trainerData.accessToken?.substring(0, 20)}...`);
    console.log(`   Role: ${trainerData.user?.role}`);
    
    // Test 4: Access Trainer Dashboard API
    console.log('\n📝 Test 4: Trainer Dashboard API');
    const trainerDashboardResponse = await fetch(`${baseUrl}/api/dashboard/trainer`, {
      headers: {
        'Authorization': `Bearer ${trainerData.accessToken}`
      }
    });
    
    if (!trainerDashboardResponse.ok) {
      const error = await trainerDashboardResponse.text();
      console.log(`❌ Trainer dashboard API failed: ${trainerDashboardResponse.status}`);
      console.log(`   Error: ${error}`);
    } else {
      const dashboardData = await trainerDashboardResponse.json();
      console.log('✅ Trainer dashboard API accessible');
      console.log(`   Today appointments: ${dashboardData.todayAppointments?.length || 0}`);
      console.log(`   Total clients: ${dashboardData.totalClients || 0}`);
    }
    
    // Test 5: Analytics API
    console.log('\n📝 Test 5: Analytics API');
    const analyticsResponse = await fetch(`${baseUrl}/api/analytics/trainer?period=7d`, {
      headers: {
        'Authorization': `Bearer ${trainerData.accessToken}`
      }
    });
    
    if (!analyticsResponse.ok) {
      const error = await analyticsResponse.text();
      console.log(`❌ Analytics API failed: ${analyticsResponse.status}`);
      console.log(`   Error: ${error}`);
    } else {
      const analyticsData = await analyticsResponse.json();
      console.log('✅ Analytics API accessible');
      console.log(`   Revenue metrics available: ${analyticsData.revenue ? 'Yes' : 'No'}`);
    }
    
    console.log('\n✨ Authentication tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testAuth();