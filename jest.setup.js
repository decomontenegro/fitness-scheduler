// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'
process.env.DATABASE_URL = 'file:./test.db'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key'
process.env.NODE_ENV = 'test'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
    }
  },
  headers() {
    return new Headers()
  },
}))

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CLIENT',
  isActive: true,
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: true,
  pushNotifications: true,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

global.createMockAppointment = (overrides = {}) => ({
  id: 'test-appointment-id',
  trainerId: 'trainer-id',
  clientId: 'client-id',
  serviceId: 'service-id',
  date: new Date(),
  startTime: '09:00',
  endTime: '10:00',
  status: 'SCHEDULED',
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Suppress console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})