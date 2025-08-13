# 🧪 FitScheduler - Testing Documentation

## 📋 Overview

This project uses a comprehensive testing strategy with Jest for unit/integration testing and Cypress for E2E testing.

## 🚀 Quick Start

### Run All Tests
```bash
npm test              # Run all unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e      # Run E2E tests
npm run test:all      # Run all test suites
```

## 🏗️ Testing Architecture

### Test Structure
```
src/__tests__/           # Unit and integration tests
├── auth/               # Authentication tests
│   ├── jwt.test.ts    # JWT token tests
│   └── password.test.ts # Password hashing tests
├── api/                # API route tests
├── components/         # Component tests
├── lib/                # Utility tests
└── hooks/              # Custom hook tests

cypress/                 # E2E tests
├── e2e/                # E2E test specs
│   ├── auth.cy.ts     # Authentication flows
│   └── booking.cy.ts  # Booking workflows
├── fixtures/           # Test data
└── support/            # Custom commands
```

## 🧪 Unit Testing

### Running Unit Tests
```bash
npm test                    # Run all tests
npm test jwt.test.ts       # Run specific test file
npm run test:unit          # Run only unit tests
npm run test:watch         # Watch mode for development
```

### Writing Unit Tests

#### Example: Testing Authentication
```typescript
// src/__tests__/auth/jwt.test.ts
import { generateAccessToken, verifyToken } from '@/lib/auth'

describe('JWT Authentication', () => {
  it('should generate a valid JWT token', () => {
    const payload = {
      userId: 'test-123',
      email: 'test@example.com',
      role: 'CLIENT'
    }
    
    const token = generateAccessToken(payload)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
  })
})
```

#### Example: Testing Components
```typescript
// src/__tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## 🎯 E2E Testing

### Running E2E Tests
```bash
npm run test:e2e        # Run E2E tests headlessly
npm run test:e2e:open   # Open Cypress UI
```

### Writing E2E Tests

#### Example: Authentication Flow
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  it('should login successfully', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type('trainer@test.com')
    cy.get('input[name="password"]').type('123456')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.contains('Dashboard').should('be.visible')
  })
})
```

#### Example: Booking Flow
```typescript
// cypress/e2e/booking.cy.ts
describe('Appointment Booking', () => {
  beforeEach(() => {
    cy.loginAsClient()
  })

  it('should book an appointment', () => {
    cy.visit('/schedule')
    cy.get('[data-testid="trainer-card"]').first().click()
    cy.get('[data-testid="service-option"]').first().click()
    cy.get('[data-testid="date-picker"]').click()
    cy.get('[data-testid="time-slot"]').first().click()
    cy.get('[data-testid="confirm-booking"]').click()
    
    cy.contains('Appointment scheduled').should('be.visible')
  })
})
```

## 📊 Test Coverage

### Current Coverage Goals
- **Unit Tests**: 80% coverage
- **Integration Tests**: 70% coverage
- **E2E Tests**: Critical user paths 100%

### Viewing Coverage Reports
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 75,
    lines: 75,
    statements: 75,
  }
}
```

## 🔧 Custom Test Commands

### Cypress Custom Commands
```typescript
// Login as trainer
cy.loginAsTrainer()

// Login as client
cy.loginAsClient()

// Create appointment
cy.createAppointment(trainerId, date, time)

// Cancel appointment
cy.cancelAppointment(appointmentId)
```

### Jest Test Utilities
```javascript
// Create mock user
global.createMockUser({ role: 'TRAINER' })

// Create mock appointment
global.createMockAppointment({ status: 'SCHEDULED' })
```

## 🐛 Debugging Tests

### Debug Unit Tests
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
node --inspect-brk ./node_modules/.bin/jest --runInBand jwt.test.ts
```

### Debug E2E Tests
```bash
# Open Cypress UI for interactive debugging
npm run test:e2e:open

# Run with Chrome DevTools
CYPRESS_REMOTE_DEBUGGING_PORT=9222 npm run test:e2e
```

## 📝 Test Data

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Trainer 1 | trainer@test.com | 123456 |
| Trainer 2 | trainer2@test.com | 123456 |
| Client | client@test.com | 123456 |

### Test Database
- Development: `dev.db`
- Testing: `test.db`
- E2E: Uses development database

## ✅ Testing Checklist

### Before Committing
- [ ] All tests pass locally
- [ ] Coverage meets thresholds
- [ ] No console errors in tests
- [ ] E2E tests run successfully
- [ ] New features have tests

### Testing Best Practices
1. **Write tests first** (TDD approach when possible)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Keep tests isolated and independent**
5. **Mock external dependencies**
6. **Use fixtures for test data**
7. **Clean up after tests**

## 🚨 Common Issues

### Issue: Tests fail with "Cannot find module"
**Solution**: Check module aliases in jest.config.js match tsconfig.json

### Issue: E2E tests timeout
**Solution**: Increase timeout in cypress.config.ts or use cy.wait()

### Issue: Database conflicts in tests
**Solution**: Use separate test database or transactions

### Issue: Mock data not working
**Solution**: Clear mocks between tests with `jest.clearAllMocks()`

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🎯 Next Steps

1. **Increase test coverage** to meet thresholds
2. **Add API integration tests** for all endpoints
3. **Implement visual regression testing**
4. **Set up CI/CD pipeline** with automated testing
5. **Add performance testing** with Lighthouse
6. **Implement mutation testing** for code quality

---

**Remember**: Good tests are the foundation of reliable software! 🚀