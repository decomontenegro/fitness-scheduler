#!/usr/bin/env node
/**
 * Comprehensive Fitness Scheduler System Test
 * Tests all major functionality including authentication, dashboards, and APIs
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

// Test credentials from the guide
const TRAINER_CREDS = { email: 'personal@teste.com', password: '123456' };
const CLIENT_CREDS = { email: 'cliente@teste.com', password: '123456' };

class FitnessSchedulerTester {
    constructor() {
        this.results = [];
        this.authToken = null;
        this.testStartTime = new Date();
    }

    // Helper method to log test results
    logTest(testName, success, message = '', error = null) {
        const result = {
            test: testName,
            success,
            message,
            error: error ? error.toString() : null,
            timestamp: new Date().toISOString()
        };
        this.results.push(result);
        
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName} - ${message}`);
        if (error) console.log(`   Error: ${error}`);
    }

    // Test server connectivity
    async testServerConnectivity() {
        console.log('\n🔍 Testing Server Connectivity...');
        try {
            const response = await fetch(BASE_URL, { timeout: 5000 });
            const success = response.status === 200;
            this.logTest('Server Connectivity', success, `Status: ${response.status}`);
            return success;
        } catch (error) {
            this.logTest('Server Connectivity', false, 'Server unreachable', error);
            return false;
        }
    }

    // Test authentication system
    async testAuthentication() {
        console.log('\n🔐 Testing Authentication System...');
        
        // Test login with trainer credentials
        await this.testLogin('Trainer Login', TRAINER_CREDS, 'trainer');
        
        // Test login with client credentials  
        await this.testLogin('Client Login', CLIENT_CREDS, 'client');
        
        // Test invalid credentials
        await this.testLogin('Invalid Credentials', 
            { email: 'invalid@test.com', password: 'wrong' }, 
            null, false);
        
        // Test JWT token validation
        await this.testJWTValidation();
        
        // Test rate limiting
        await this.testRateLimit();
    }

    async testLogin(testName, credentials, expectedRole, shouldSucceed = true) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            const success = shouldSucceed ? response.ok : !response.ok;
            
            if (shouldSucceed && response.ok) {
                this.authToken = data.token;
                this.logTest(testName, success, `Role: ${data.user?.role || 'unknown'}`);
            } else {
                this.logTest(testName, success, shouldSucceed ? 'Login failed' : 'Correctly rejected');
            }
        } catch (error) {
            this.logTest(testName, false, 'Request failed', error);
        }
    }

    async testJWTValidation() {
        if (!this.authToken) {
            this.logTest('JWT Validation', false, 'No auth token available');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            const success = response.ok;
            this.logTest('JWT Validation', success, `Status: ${response.status}`);
        } catch (error) {
            this.logTest('JWT Validation', false, 'Request failed', error);
        }
    }

    async testRateLimit() {
        console.log('   Testing rate limiting...');
        const requests = [];
        
        // Send multiple login requests rapidly
        for (let i = 0; i < 10; i++) {
            requests.push(
                fetch(`${BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
                })
            );
        }

        try {
            const responses = await Promise.all(requests);
            const rateLimited = responses.some(r => r.status === 429);
            this.logTest('Rate Limiting', rateLimited, 
                rateLimited ? 'Rate limiting active' : 'No rate limiting detected');
        } catch (error) {
            this.logTest('Rate Limiting', false, 'Test failed', error);
        }
    }

    // Test dashboard functionality
    async testDashboards() {
        console.log('\n📊 Testing Dashboards...');
        
        await this.testTrainerDashboard();
        await this.testClientDashboard();
    }

    async testTrainerDashboard() {
        if (!this.authToken) {
            this.logTest('Trainer Dashboard', false, 'No auth token');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/dashboard/trainer`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const hasStats = data.stats && typeof data.stats === 'object';
                const hasAppointments = Array.isArray(data.appointments);
                
                this.logTest('Trainer Dashboard API', true, 
                    `Stats: ${hasStats}, Appointments: ${hasAppointments}`);
            } else {
                this.logTest('Trainer Dashboard API', false, `Status: ${response.status}`);
            }
        } catch (error) {
            this.logTest('Trainer Dashboard API', false, 'Request failed', error);
        }
    }

    async testClientDashboard() {
        // First login as client
        await this.testLogin('Client Dashboard Login', CLIENT_CREDS, 'client');
        
        if (!this.authToken) {
            this.logTest('Client Dashboard', false, 'No client auth token');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/dashboard/client`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const hasStats = data.stats && typeof data.stats === 'object';
                const hasWorkouts = Array.isArray(data.workouts);
                
                this.logTest('Client Dashboard API', true, 
                    `Stats: ${hasStats}, Workouts: ${hasWorkouts}`);
            } else {
                this.logTest('Client Dashboard API', false, `Status: ${response.status}`);
            }
        } catch (error) {
            this.logTest('Client Dashboard API', false, 'Request failed', error);
        }
    }

    // Test appointment system
    async testAppointmentSystem() {
        console.log('\n📅 Testing Appointment System...');
        
        await this.testAppointmentCRUD();
        await this.testAvailability();
    }

    async testAppointmentCRUD() {
        if (!this.authToken) {
            this.logTest('Appointments CRUD', false, 'No auth token');
            return;
        }

        try {
            // Test GET appointments
            const getResponse = await fetch(`${BASE_URL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            const success = getResponse.ok;
            this.logTest('Get Appointments', success, `Status: ${getResponse.status}`);
            
            if (success) {
                const appointments = await getResponse.json();
                this.logTest('Appointments Data', Array.isArray(appointments), 
                    `Count: ${appointments.length}`);
            }
        } catch (error) {
            this.logTest('Appointments CRUD', false, 'Request failed', error);
        }
    }

    async testAvailability() {
        try {
            const response = await fetch(`${BASE_URL}/api/availability`);
            const success = response.ok;
            this.logTest('Availability API', success, `Status: ${response.status}`);
        } catch (error) {
            this.logTest('Availability API', false, 'Request failed', error);
        }
    }

    // Test notification system
    async testNotificationSystem() {
        console.log('\n🔔 Testing Notification System...');
        
        if (!this.authToken) {
            this.logTest('Notifications', false, 'No auth token');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            const success = response.ok;
            this.logTest('Notifications API', success, `Status: ${response.status}`);
        } catch (error) {
            this.logTest('Notifications API', false, 'Request failed', error);
        }
    }

    // Test payment system
    async testPaymentSystem() {
        console.log('\n💳 Testing Payment System...');
        
        await this.testPaymentEndpoints();
    }

    async testPaymentEndpoints() {
        const endpoints = [
            '/api/payments/setup-intent',
            '/api/payments/subscription',
            '/api/billing/invoices'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${BASE_URL}${endpoint}`, {
                    headers: this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}
                });
                
                // For payment endpoints, we expect either success or proper authentication error
                const success = response.status < 500;
                this.logTest(`Payment ${endpoint}`, success, `Status: ${response.status}`);
            } catch (error) {
                this.logTest(`Payment ${endpoint}`, false, 'Request failed', error);
            }
        }
    }

    // Test analytics system
    async testAnalytics() {
        console.log('\n📈 Testing Analytics System...');
        
        if (!this.authToken) {
            this.logTest('Analytics', false, 'No auth token');
            return;
        }

        const analyticsEndpoints = [
            '/api/analytics/metrics',
            '/api/analytics/revenue',
            '/api/analytics/occupancy'
        ];

        for (const endpoint of analyticsEndpoints) {
            try {
                const response = await fetch(`${BASE_URL}${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                });
                
                const success = response.ok;
                this.logTest(`Analytics ${endpoint}`, success, `Status: ${response.status}`);
            } catch (error) {
                this.logTest(`Analytics ${endpoint}`, false, 'Request failed', error);
            }
        }
    }

    // Generate comprehensive test report
    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        const testDuration = new Date() - this.testStartTime;
        const durationSeconds = Math.round(testDuration / 1000);

        console.log('\n' + '='.repeat(60));
        console.log('📋 COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(60));
        console.log(`📊 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`⏱️ Duration: ${durationSeconds}s`);
        console.log('='.repeat(60));

        if (failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`  • ${result.test}: ${result.message}`);
                if (result.error) console.log(`    Error: ${result.error}`);
            });
        }

        // Detailed recommendations
        console.log('\n🔧 RECOMMENDATIONS:');
        
        const authFailed = this.results.some(r => r.test.includes('Login') && !r.success);
        if (authFailed) {
            console.log('  • Check authentication system and database seeding');
        }
        
        const serverDown = this.results.some(r => r.test === 'Server Connectivity' && !r.success);
        if (serverDown) {
            console.log('  • Ensure server is running on port 3002');
        }
        
        const apiErrors = this.results.filter(r => r.test.includes('API') && !r.success).length;
        if (apiErrors > 3) {
            console.log('  • Multiple API endpoints failing - check database connection');
        }

        if (successRate > 90) {
            console.log('  ✅ System is functioning well!');
        } else if (successRate > 70) {
            console.log('  ⚠️ System has some issues but core functionality works');
        } else {
            console.log('  🚨 System has significant issues requiring attention');
        }

        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate,
            duration: durationSeconds,
            results: this.results
        };
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 Starting Comprehensive Fitness Scheduler Test Suite');
        console.log(`🎯 Target URL: ${BASE_URL}`);
        console.log('⏱️ Test started at:', new Date().toISOString());
        
        const serverOnline = await this.testServerConnectivity();
        
        if (serverOnline) {
            await this.testAuthentication();
            await this.testDashboards();
            await this.testAppointmentSystem();
            await this.testNotificationSystem();
            await this.testPaymentSystem();
            await this.testAnalytics();
        } else {
            console.log('🔴 Server is offline. Skipping functional tests.');
        }
        
        return this.generateReport();
    }
}

// Run tests
const tester = new FitnessSchedulerTester();
tester.runAllTests().then(report => {
    console.log('\n🏁 Test suite completed.');
    process.exit(report.failed > 0 ? 1 : 0);
}).catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});