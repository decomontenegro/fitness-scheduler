import jwt from 'jsonwebtoken'
import { generateAccessToken, verifyToken } from '@/lib/auth'

// Mock the jsonwebtoken module
jest.mock('jsonwebtoken')

describe('JWT Authentication', () => {
  const mockUserId = 'test-user-123'
  const mockEmail = 'test@example.com'
  const mockRole = 'CLIENT'
  const mockToken = 'mock.jwt.token'
  const mockSecret = 'fitness-scheduler-jwt-super-secure-secret-key-development-only-32-chars'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const mockSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>
      mockSign.mockReturnValue(mockToken as any)

      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole
      }

      const token = generateAccessToken(payload)

      expect(mockSign).toHaveBeenCalledWith(
        { ...payload, tokenType: 'access' },
        mockSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      )
      expect(token).toBe(mockToken)
    })

    it('should handle errors when generating token', () => {
      const mockSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>
      mockSign.mockImplementation(() => {
        throw new Error('Token generation failed')
      })

      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole
      }

      expect(() => generateAccessToken(payload)).toThrow('Token generation failed')
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid JWT token', () => {
      const mockVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>
      const mockPayload = { userId: mockUserId }
      mockVerify.mockReturnValue(mockPayload as any)

      const payload = verifyToken(mockToken)

      expect(mockVerify).toHaveBeenCalledWith(mockToken, mockSecret)
      expect(payload).toEqual(mockPayload)
    })

    it('should throw error for invalid token', () => {
      const mockVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      expect(() => verifyToken('invalid.token')).toThrow('Invalid token')
    })

    it('should throw error for expired token', () => {
      const mockVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>
      mockVerify.mockImplementation(() => {
        throw new Error('Token expired')
      })

      expect(() => verifyToken(mockToken)).toThrow('Token expired')
    })
  })

  describe('Token Expiration', () => {
    it('should add tokenType to payload', () => {
      const mockSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>
      mockSign.mockReturnValue(mockToken as any)

      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole
      }

      generateAccessToken(payload)

      expect(mockSign).toHaveBeenCalledWith(
        { ...payload, tokenType: 'access' },
        mockSecret,
        { expiresIn: '1h' }
      )
    })

    it('should include all payload fields in token', () => {
      const mockSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>
      mockSign.mockReturnValue(mockToken as any)

      const payload = {
        userId: mockUserId,
        email: mockEmail,
        role: 'TRAINER',
        deviceId: 'test-device'
      }

      const token = generateAccessToken(payload)

      expect(mockSign).toHaveBeenCalled()
      expect(token).toBe(mockToken)
      
      const callArgs = mockSign.mock.calls[0][0]
      expect(callArgs).toHaveProperty('tokenType', 'access')
      expect(callArgs).toHaveProperty('userId', mockUserId)
      expect(callArgs).toHaveProperty('email', mockEmail)
    })
  })
})