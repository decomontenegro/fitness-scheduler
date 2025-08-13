import { cn, formatDate, formatTime, formatCurrency, generateTimeSlots } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toBe('base-class additional-class')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base', isActive && 'active')
      expect(result).toBe('base active')
    })

    it('should filter out false values', () => {
      const result = cn('base', false, null, undefined, 'valid')
      expect(result).toBe('base valid')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should override conflicting Tailwind classes', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toContain('px-4')
      expect(result).toContain('py-1')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly in pt-BR format', () => {
      // Use UTC to avoid timezone issues
      const date = new Date(Date.UTC(2024, 0, 15))
      const result = formatDate(date)
      expect(result).toMatch(/15\/01\/2024/)
    })

    it('should handle string dates', () => {
      const result = formatDate('2024-01-15T12:00:00')
      expect(result).toMatch(/15\/01\/2024/)
    })

    it('should return Invalid Date for invalid input', () => {
      const result = formatDate('invalid-date')
      expect(result).toMatch(/Invalid/)
    })
  })

  describe('formatTime', () => {
    it('should format time in pt-BR format', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatTime(date)
      expect(result).toMatch(/14:30/)
    })

    it('should handle string dates', () => {
      const result = formatTime('2024-01-15T09:00:00')
      expect(result).toMatch(/09:00/)
    })

    it('should handle invalid dates', () => {
      const result = formatTime('invalid')
      expect(result).toMatch(/Invalid/)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency in BRL', () => {
      const result = formatCurrency(100)
      expect(result).toMatch(/100/)
      expect(result).toMatch(/R\$/)
    })

    it('should handle decimal values', () => {
      const result = formatCurrency(99.99)
      expect(result).toMatch(/99/)
      expect(result).toMatch(/99/)
    })

    it('should handle zero', () => {
      const result = formatCurrency(0)
      expect(result).toMatch(/0/)
    })
  })

  describe('generateTimeSlots', () => {
    it('should generate hourly slots', () => {
      const slots = generateTimeSlots('09:00', '12:00')
      expect(slots).toEqual(['09:00', '10:00', '11:00'])
    })

    it('should generate 30-minute slots', () => {
      const slots = generateTimeSlots('09:00', '11:00', 30)
      expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30'])
    })

    it('should handle edge cases', () => {
      const slots = generateTimeSlots('23:00', '23:59')
      expect(slots).toEqual(['23:00'])
    })

    it('should return empty array for invalid range', () => {
      const slots = generateTimeSlots('12:00', '09:00')
      expect(slots).toEqual([])
    })
  })
})