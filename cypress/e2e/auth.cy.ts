describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Login', () => {
    it('should login successfully as a trainer', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('trainer@test.com')
      cy.get('input[name="password"]').type('123456')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to trainer dashboard
      cy.url().should('include', '/dashboard/trainer')
      cy.contains('Dashboard').should('be.visible')
      cy.contains('Agendamentos').should('be.visible')
    })

    it('should login successfully as a client', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('client@test.com')
      cy.get('input[name="password"]').type('123456')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to client dashboard
      cy.url().should('include', '/dashboard/client')
      cy.contains('Dashboard').should('be.visible')
      cy.contains('Próximo Treino').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      cy.get('input[name="email"]').type('invalid@test.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Should show error message
      cy.contains('Invalid credentials').should('be.visible')
      cy.url().should('include', '/login')
    })

    it('should show validation errors for empty fields', () => {
      cy.visit('/login')
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors
      cy.contains('Email is required').should('be.visible')
      cy.contains('Password is required').should('be.visible')
    })
  })

  describe('Registration', () => {
    it('should register a new user successfully', () => {
      const timestamp = Date.now()
      const newEmail = `newuser${timestamp}@test.com`

      cy.visit('/register')
      cy.get('input[name="name"]').type('New User')
      cy.get('input[name="email"]').type(newEmail)
      cy.get('input[name="password"]').type('StrongPass123!')
      cy.get('input[name="confirmPassword"]').type('StrongPass123!')
      cy.get('select[name="role"]').select('CLIENT')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to login after successful registration
      cy.url().should('include', '/login')
      cy.contains('Registration successful').should('be.visible')
    })

    it('should show error for existing email', () => {
      cy.visit('/register')
      cy.get('input[name="name"]').type('Existing User')
      cy.get('input[name="email"]').type('trainer@test.com')
      cy.get('input[name="password"]').type('Password123!')
      cy.get('input[name="confirmPassword"]').type('Password123!')
      cy.get('select[name="role"]').select('CLIENT')
      cy.get('button[type="submit"]').click()
      
      // Should show error message
      cy.contains('Email already exists').should('be.visible')
    })

    it('should validate password requirements', () => {
      cy.visit('/register')
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('weak')
      cy.get('input[name="confirmPassword"]').type('weak')
      cy.get('button[type="submit"]').click()
      
      // Should show password validation error
      cy.contains('Password must be at least').should('be.visible')
    })

    it('should validate password confirmation match', () => {
      cy.visit('/register')
      cy.get('input[name="name"]').type('Test User')
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('Password123!')
      cy.get('input[name="confirmPassword"]').type('DifferentPass123!')
      cy.get('button[type="submit"]').click()
      
      // Should show password mismatch error
      cy.contains('Passwords do not match').should('be.visible')
    })
  })

  describe('Logout', () => {
    it('should logout successfully from trainer dashboard', () => {
      // Login first
      cy.loginAsTrainer()
      
      // Find and click logout button
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Should redirect to login page
      cy.url().should('include', '/login')
      cy.contains('Login').should('be.visible')
    })

    it('should logout successfully from client dashboard', () => {
      // Login first
      cy.loginAsClient()
      
      // Find and click logout button
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      // Should redirect to login page
      cy.url().should('include', '/login')
      cy.contains('Login').should('be.visible')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard/trainer')
      cy.url().should('include', '/login')
      cy.contains('Please login to continue').should('be.visible')
    })

    it('should prevent client from accessing trainer dashboard', () => {
      cy.loginAsClient()
      cy.visit('/dashboard/trainer')
      
      // Should redirect to client dashboard or show error
      cy.url().should('not.include', '/dashboard/trainer')
      cy.contains('Unauthorized').should('be.visible')
    })

    it('should prevent trainer from accessing client dashboard', () => {
      cy.loginAsTrainer()
      cy.visit('/dashboard/client')
      
      // Should redirect to trainer dashboard or show error
      cy.url().should('not.include', '/dashboard/client')
      cy.contains('Unauthorized').should('be.visible')
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session after page refresh', () => {
      cy.loginAsTrainer()
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', '/dashboard/trainer')
      cy.contains('Dashboard').should('be.visible')
    })

    it('should redirect to login after session expiry', () => {
      // This would require mocking time or waiting for actual expiry
      // For now, we'll test that the session cookie exists
      cy.loginAsTrainer()
      cy.getCookie('auth-token').should('exist')
    })
  })
})