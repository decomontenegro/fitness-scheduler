describe('Appointment Booking Flow', () => {
  beforeEach(() => {
    // Login as client before each test
    cy.loginAsClient()
  })

  describe('Schedule Page', () => {
    it('should display available trainers', () => {
      cy.visit('/schedule')
      
      // Should show trainer selection
      cy.contains('Escolha seu Personal Trainer').should('be.visible')
      cy.contains('João Personal').should('be.visible')
      cy.contains('Ana Fitness').should('be.visible')
      cy.contains('Carlos Strong').should('be.visible')
    })

    it('should show trainer specialties and ratings', () => {
      cy.visit('/schedule')
      
      // Check trainer cards have required info
      cy.get('[data-testid="trainer-card"]').first().within(() => {
        cy.contains('Especialidades').should('be.visible')
        cy.get('[data-testid="rating"]').should('be.visible')
        cy.get('[data-testid="hourly-rate"]').should('be.visible')
      })
    })
  })

  describe('Service Selection', () => {
    it('should display services after selecting trainer', () => {
      cy.visit('/schedule')
      
      // Select a trainer
      cy.get('[data-testid="trainer-card"]').first().click()
      
      // Should show services
      cy.contains('Escolha o Serviço').should('be.visible')
      cy.get('[data-testid="service-option"]').should('have.length.greaterThan', 0)
    })

    it('should show service details', () => {
      cy.visit('/schedule')
      cy.get('[data-testid="trainer-card"]').first().click()
      
      // Check service details
      cy.get('[data-testid="service-option"]').first().within(() => {
        cy.get('[data-testid="service-name"]').should('be.visible')
        cy.get('[data-testid="service-duration"]').should('be.visible')
        cy.get('[data-testid="service-price"]').should('be.visible')
      })
    })
  })

  describe('Date and Time Selection', () => {
    it('should display calendar after selecting service', () => {
      cy.visit('/schedule')
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      
      // Should show calendar
      cy.contains('Escolha a Data').should('be.visible')
      cy.get('[data-testid="calendar"]').should('be.visible')
    })

    it('should disable past dates', () => {
      cy.visit('/schedule')
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      
      // Past dates should be disabled
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const dateString = yesterday.toISOString().split('T')[0]
      
      cy.get(`[data-date="${dateString}"]`).should('have.class', 'disabled')
    })

    it('should show available time slots after selecting date', () => {
      cy.visit('/schedule')
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      
      // Select tomorrow's date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      cy.get(`[data-date="${dateString}"]`).click()
      
      // Should show time slots
      cy.contains('Escolha o Horário').should('be.visible')
      cy.get('[data-testid="time-slot"]').should('have.length.greaterThan', 0)
    })

    it('should disable unavailable time slots', () => {
      cy.visit('/schedule')
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      cy.get(`[data-date="${dateString}"]`).click()
      
      // Some slots might be unavailable
      cy.get('[data-testid="time-slot"].unavailable').should('have.attr', 'disabled')
    })
  })

  describe('Booking Confirmation', () => {
    it('should show confirmation modal with booking details', () => {
      cy.visit('/schedule')
      
      // Complete booking flow
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      cy.get(`[data-date="${dateString}"]`).click()
      cy.get('[data-testid="time-slot"]').first().click()
      
      // Should show confirmation modal
      cy.get('[data-testid="confirmation-modal"]').should('be.visible')
      cy.get('[data-testid="booking-summary"]').within(() => {
        cy.contains('Personal Trainer').should('be.visible')
        cy.contains('Serviço').should('be.visible')
        cy.contains('Data').should('be.visible')
        cy.contains('Horário').should('be.visible')
        cy.contains('Valor').should('be.visible')
      })
    })

    it('should successfully create appointment', () => {
      cy.visit('/schedule')
      
      // Complete booking flow
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      cy.get(`[data-date="${dateString}"]`).click()
      cy.get('[data-testid="time-slot"]').first().click()
      
      // Confirm booking
      cy.get('[data-testid="confirm-booking"]').click()
      
      // Should show success message
      cy.contains('Agendamento realizado com sucesso').should('be.visible')
      
      // Should redirect to dashboard or appointments page
      cy.url().should('include', '/dashboard')
    })

    it('should handle booking conflicts', () => {
      // First, create a booking
      cy.visit('/schedule')
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      cy.get(`[data-date="${dateString}"]`).click()
      cy.get('[data-testid="time-slot"]').first().click()
      cy.get('[data-testid="confirm-booking"]').click()
      
      // Try to book the same slot again
      cy.visit('/schedule')
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      cy.get(`[data-date="${dateString}"]`).click()
      
      // The previously booked slot should be unavailable
      cy.get('[data-testid="time-slot"]').first().should('have.class', 'unavailable')
    })
  })

  describe('Appointment Management', () => {
    it('should display upcoming appointments in dashboard', () => {
      // Create an appointment first
      cy.visit('/schedule')
      cy.get('[data-testid="trainer-card"]').first().click()
      cy.get('[data-testid="service-option"]').first().click()
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      cy.get(`[data-date="${dateString}"]`).click()
      cy.get('[data-testid="time-slot"]').first().click()
      cy.get('[data-testid="confirm-booking"]').click()
      
      // Go to dashboard
      cy.visit('/dashboard/client')
      
      // Should show the appointment
      cy.get('[data-testid="upcoming-appointments"]').within(() => {
        cy.contains('Próximo Treino').should('be.visible')
        cy.get('[data-testid="appointment-card"]').should('exist')
      })
    })

    it('should allow cancelling appointments', () => {
      // Assuming there's an existing appointment
      cy.visit('/dashboard/client')
      
      // Find and cancel appointment
      cy.get('[data-testid="appointment-card"]').first().within(() => {
        cy.get('[data-testid="cancel-button"]').click()
      })
      
      // Confirm cancellation
      cy.get('[data-testid="cancel-modal"]').within(() => {
        cy.contains('Confirmar Cancelamento').should('be.visible')
        cy.get('[data-testid="confirm-cancel"]').click()
      })
      
      // Should show success message
      cy.contains('Agendamento cancelado').should('be.visible')
    })

    it('should not allow cancellation within 24 hours', () => {
      // This would need an appointment scheduled for today
      // Mock or create such appointment
      
      cy.visit('/dashboard/client')
      
      // Appointments within 24 hours should not have cancel button
      cy.get('[data-testid="appointment-today"]').within(() => {
        cy.get('[data-testid="cancel-button"]').should('not.exist')
        cy.contains('Cancelamento não permitido').should('be.visible')
      })
    })
  })

  describe('Appointment History', () => {
    it('should display past appointments', () => {
      cy.visit('/dashboard/client')
      
      // Navigate to history section
      cy.get('[data-testid="history-tab"]').click()
      
      // Should show past appointments
      cy.get('[data-testid="appointment-history"]').within(() => {
        cy.contains('Histórico de Treinos').should('be.visible')
        cy.get('[data-testid="past-appointment"]').should('have.length.greaterThan', 0)
      })
    })

    it('should show appointment details in history', () => {
      cy.visit('/dashboard/client')
      cy.get('[data-testid="history-tab"]').click()
      
      // Check appointment details
      cy.get('[data-testid="past-appointment"]').first().within(() => {
        cy.get('[data-testid="appointment-date"]').should('be.visible')
        cy.get('[data-testid="appointment-trainer"]').should('be.visible')
        cy.get('[data-testid="appointment-service"]').should('be.visible')
        cy.get('[data-testid="appointment-status"]').should('be.visible')
      })
    })
  })
})