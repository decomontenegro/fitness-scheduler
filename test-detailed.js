#!/usr/bin/env node
/**
 * Detailed Fitness Scheduler System Test
 * Tests system components step by step with proper token management
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';
const TRAINER_CREDS = { email: 'personal@teste.com', password: '123456' };
const CLIENT_CREDS = { email: 'cliente@teste.com', password: '123456' };

class DetailedTester {
    constructor() {
        this.results = [];
        this.tokens = {
            trainer: null,
            client: null
        };
    }

    async logTest(testName, success, message = '', details = null) {
        const result = { test: testName, success, message, details, timestamp: new Date().toISOString() };
        this.results.push(result);
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName} - ${message}`);
        if (details) console.log(`   Details:`, JSON.stringify(details, null, 2));
    }

    // Comprehensive authentication test
    async testAuthentication() {
        console.log('\n🔐 Testing Authentication System...');
        
        // Test trainer login
        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(TRAINER_CREDS)
            });

            if (response.ok) {
                const data = await response.json();
                this.tokens.trainer = data.accessToken;
                await this.logTest('Trainer Authentication', true, `Role: ${data.user.role}`, {
                    userId: data.user.id,
                    email: data.user.email,
                    tokenExists: !!data.accessToken
                });
            } else {
                const error = await response.json();
                await this.logTest('Trainer Authentication', false, `Failed: ${response.status}`, error);
            }
        } catch (error) {
            await this.logTest('Trainer Authentication', false, 'Request failed', error);
        }

        // Test client login
        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(CLIENT_CREDS)
            });

            if (response.ok) {
                const data = await response.json();
                this.tokens.client = data.accessToken;
                await this.logTest('Client Authentication', true, `Role: ${data.user.role}`, {
                    userId: data.user.id,
                    email: data.user.email,
                    tokenExists: !!data.accessToken
                });
            } else {
                const error = await response.json();
                await this.logTest('Client Authentication', false, `Failed: ${response.status}`, error);
            }
        } catch (error) {
            await this.logTest('Client Authentication', false, 'Request failed', error);
        }

        // Test JWT validation
        if (this.tokens.trainer) {
            try {
                const response = await fetch(`${BASE_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${this.tokens.trainer}` }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    await this.logTest('JWT Token Validation', true, 'Token valid', {
                        email: userData.email,
                        role: userData.role
                    });
                } else {
                    const error = await response.json();
                    await this.logTest('JWT Token Validation', false, `Invalid token: ${response.status}`, error);
                }
            } catch (error) {
                await this.logTest('JWT Token Validation', false, 'Request failed', error);
            }
        }
    }

    // Test trainer dashboard
    async testTrainerDashboard() {
        console.log('\n📊 Testing Trainer Dashboard...');
        
        if (!this.tokens.trainer) {
            await this.logTest('Trainer Dashboard', false, 'No trainer token available');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/dashboard/trainer`, {
                headers: { 'Authorization': `Bearer ${this.tokens.trainer}` }
            });

            if (response.ok) {
                const data = await response.json();
                await this.logTest('Trainer Dashboard API', true, 'Dashboard loaded', {
                    hasStats: !!data.stats,
                    hasAppointments: Array.isArray(data.appointments),
                    hasActivities: Array.isArray(data.activities),
                    appointmentCount: data.appointments?.length || 0
                });
            } else {
                const error = await response.json();
                await this.logTest('Trainer Dashboard API', false, `Failed: ${response.status}`, error);
            }
        } catch (error) {
            await this.logTest('Trainer Dashboard API', false, 'Request failed', error);
        }

        // Test trainer profile endpoint
        try {
            const response = await fetch(`${BASE_URL}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${this.tokens.trainer}` }
            });

            if (response.ok) {
                const profile = await response.json();
                await this.logTest('Trainer Profile API', true, 'Profile loaded', {
                    hasProfile: !!profile,
                    email: profile.email
                });
            } else {
                await this.logTest('Trainer Profile API', false, `Failed: ${response.status}`);
            }
        } catch (error) {
            await this.logTest('Trainer Profile API', false, 'Request failed', error);
        }
    }

    // Test client dashboard
    async testClientDashboard() {
        console.log('\n📱 Testing Client Dashboard...');
        
        if (!this.tokens.client) {
            await this.logTest('Client Dashboard', false, 'No client token available');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/dashboard/client`, {
                headers: { 'Authorization': `Bearer ${this.tokens.client}` }
            });

            if (response.ok) {
                const data = await response.json();
                await this.logTest('Client Dashboard API', true, 'Dashboard loaded', {
                    hasStats: !!data.stats,
                    hasWorkouts: Array.isArray(data.workouts),
                    hasUpcoming: Array.isArray(data.upcoming),
                    workoutCount: data.workouts?.length || 0
                });
            } else {
                const error = await response.json();
                await this.logTest('Client Dashboard API', false, `Failed: ${response.status}`, error);
            }
        } catch (error) {
            await this.logTest('Client Dashboard API', false, 'Request failed', error);
        }
    }

    // Test appointment system
    async testAppointmentSystem() {
        console.log('\n📅 Testing Appointment System...');

        if (!this.tokens.client) {
            await this.logTest('Appointments Test', false, 'No client token available');
            return;
        }

        // Test get appointments
        try {
            const response = await fetch(`${BASE_URL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${this.tokens.client}` }
            });

            if (response.ok) {
                const appointments = await response.json();
                await this.logTest('Get Appointments', true, 'Appointments loaded', {
                    count: appointments.length,
                    isArray: Array.isArray(appointments)
                });
            } else {
                const error = await response.json();
                await this.logTest('Get Appointments', false, `Failed: ${response.status}`, error);
            }
        } catch (error) {
            await this.logTest('Get Appointments', false, 'Request failed', error);
        }

        // Test availability
        try {
            const response = await fetch(`${BASE_URL}/api/availability`);
            
            if (response.ok) {
                const availability = await response.json();
                await this.logTest('Availability API', true, 'Availability loaded', {
                    hasData: !!availability,
                    isArray: Array.isArray(availability)
                });
            } else {
                const error = await response.json();
                await this.logTest('Availability API', false, `Failed: ${response.status}`, error);
            }
        } catch (error) {
            await this.logTest('Availability API', false, 'Request failed', error);
        }
    }

    // Test API endpoints individually
    async testAPIEndpoints() {
        console.log('\n🔌 Testing Individual API Endpoints...');

        const endpoints = [
            { path: '/api/trainers', method: 'GET', requiresAuth: false },
            { path: '/api/notifications', method: 'GET', requiresAuth: true, token: 'trainer' },
            { path: '/api/users/profile', method: 'GET', requiresAuth: true, token: 'trainer' }
        ];

        for (const endpoint of endpoints) {
            try {
                const options = { method: endpoint.method };
                
                if (endpoint.requiresAuth && endpoint.token && this.tokens[endpoint.token]) {
                    options.headers = { 'Authorization': `Bearer ${this.tokens[endpoint.token]}` };
                }

                const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
                
                const success = response.status < 500; // Accept 200, 400 (bad request), 401 (unauthorized) but not 500 (server error)
                await this.logTest(`API ${endpoint.path}`, success, `Status: ${response.status}`, {
                    method: endpoint.method,
                    requiresAuth: endpoint.requiresAuth,
                    hasAuth: !!options.headers
                });
                
            } catch (error) {
                await this.logTest(`API ${endpoint.path}`, false, 'Request failed', error);
            }
        }
    }

    // Test page accessibility
    async testPageAccessibility() {
        console.log('\n🌐 Testing Page Accessibility...');

        const pages = [
            { path: '/', name: 'Homepage' },
            { path: '/login', name: 'Login Page' },
            { path: '/register', name: 'Register Page' },
        ];

        for (const page of pages) {
            try {
                const response = await fetch(`${BASE_URL}${page.path}`);
                const success = response.status === 200;
                await this.logTest(`Page ${page.name}`, success, `Status: ${response.status}`, {
                    path: page.path,
                    contentType: response.headers.get('content-type')
                });
            } catch (error) {
                await this.logTest(`Page ${page.name}`, false, 'Request failed', error);
            }
        }
    }

    // Generate comprehensive report
    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);

        console.log('\n' + '='.repeat(70));
        console.log('📋 DETAILED FITNESS SCHEDULER TEST REPORT');
        console.log('='.repeat(70));
        console.log(`📊 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log('='.repeat(70));

        // Group results by category
        const categories = {};
        this.results.forEach(result => {
            const category = result.test.split(' ')[0];
            if (!categories[category]) categories[category] = [];
            categories[category].push(result);
        });

        console.log('\n📊 RESULTS BY CATEGORY:');
        Object.entries(categories).forEach(([category, tests]) => {
            const passed = tests.filter(t => t.success).length;
            const total = tests.length;
            const rate = Math.round((passed / total) * 100);
            console.log(`  ${category}: ${passed}/${total} (${rate}%)`);
        });

        if (failedTests > 0) {
            console.log('\n❌ FAILED TESTS ANALYSIS:');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`  • ${result.test}: ${result.message}`);
                if (result.details && result.details.error) {
                    console.log(`    Error: ${result.details.error}`);
                }
            });
        }

        // System health assessment
        console.log('\n🏥 SYSTEM HEALTH ASSESSMENT:');
        
        const authWorking = this.results.some(r => r.test.includes('Authentication') && r.success);
        const dashboardWorking = this.results.some(r => r.test.includes('Dashboard') && r.success);
        const apiWorking = this.results.filter(r => r.test.startsWith('API')).filter(r => r.success).length > 0;
        
        console.log(`  🔐 Authentication: ${authWorking ? '✅ Working' : '❌ Issues'}`);
        console.log(`  📊 Dashboards: ${dashboardWorking ? '✅ Working' : '❌ Issues'}`);
        console.log(`  🔌 API Endpoints: ${apiWorking ? '✅ Partially Working' : '❌ Major Issues'}`);

        console.log('\n🔧 RECOMMENDATIONS:');
        
        if (!authWorking) {
            console.log('  • Critical: Fix authentication system');
        }
        
        if (failedTests > totalTests * 0.5) {
            console.log('  • High priority: Multiple system components need attention');
        }
        
        if (successRate > 70) {
            console.log('  • System core functionality is working');
            console.log('  • Focus on fixing remaining API endpoints');
        }

        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate,
            authWorking,
            dashboardWorking,
            apiWorking
        };
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 Starting Detailed Fitness Scheduler Test Suite');
        console.log(`🎯 Target URL: ${BASE_URL}`);
        console.log('⏱️ Test started at:', new Date().toISOString());

        await this.testAuthentication();
        await this.testTrainerDashboard();
        await this.testClientDashboard();
        await this.testAppointmentSystem();
        await this.testAPIEndpoints();
        await this.testPageAccessibility();

        return this.generateReport();
    }
}

// Run the detailed tests
const tester = new DetailedTester();
tester.runAllTests().then(report => {
    console.log('\n🏁 Detailed test suite completed.');
    process.exit(report.failed > 0 ? 1 : 0);
}).catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});