/// <reference types="cypress" />

// Custom commands for authentication and common actions

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('loginAsTrainer', () => {
  cy.login(Cypress.env('TRAINER_EMAIL'), Cypress.env('TRAINER_PASSWORD'))
})

Cypress.Commands.add('loginAsClient', () => {
  cy.login(Cypress.env('CLIENT_EMAIL'), Cypress.env('CLIENT_PASSWORD'))
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

Cypress.Commands.add('createAppointment', (trainerId: string, date: string, time: string) => {
  cy.visit('/schedule')
  cy.get(`[data-trainer-id="${trainerId}"]`).click()
  cy.get(`[data-date="${date}"]`).click()
  cy.get(`[data-time="${time}"]`).click()
  cy.get('[data-testid="confirm-booking"]').click()
  cy.contains('Appointment scheduled successfully').should('be.visible')
})

Cypress.Commands.add('cancelAppointment', (appointmentId: string) => {
  cy.get(`[data-appointment-id="${appointmentId}"]`)
    .find('[data-testid="cancel-button"]')
    .click()
  cy.get('[data-testid="confirm-cancel"]').click()
  cy.contains('Appointment cancelled').should('be.visible')
})

// Type declarations for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      loginAsTrainer(): Chainable<void>
      loginAsClient(): Chainable<void>
      logout(): Chainable<void>
      createAppointment(trainerId: string, date: string, time: string): Chainable<void>
      cancelAppointment(appointmentId: string): Chainable<void>
    }
  }
}

export {}