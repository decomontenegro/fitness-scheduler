import { prisma } from '@/lib/prisma'

describe('Prisma Client', () => {
  it('should export a prisma client instance', () => {
    expect(prisma).toBeDefined()
    expect(prisma).toHaveProperty('user')
    expect(prisma).toHaveProperty('appointment')
    expect(prisma).toHaveProperty('trainerProfile')
    expect(prisma).toHaveProperty('clientProfile')
  })

  it('should have all required models', () => {
    const requiredModels = [
      'user',
      'trainerProfile',
      'clientProfile', 
      'appointment',
      'service',
      'availability',
      'payment',
      'review',
      'message',
      'notification',
      'authToken',
      'auditLog'
    ]

    requiredModels.forEach(model => {
      expect(prisma).toHaveProperty(model)
    })
  })

  it('should be a singleton instance', () => {
    const { prisma: prisma2 } = require('@/lib/prisma')
    expect(prisma).toBe(prisma2)
  })
})