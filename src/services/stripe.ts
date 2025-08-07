import { stripe, formatAmountForStripe, calculateSplit, STRIPE_CONFIG } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export class StripeService {
  // Customer Management
  static async createCustomer(userId: string, email: string, name: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      })

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      })

      return customer
    } catch (error) {
      console.error('Error creating Stripe customer:', error)
      throw new Error('Failed to create customer')
    }
  }

  static async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId
    }

    const customer = await this.createCustomer(userId, user.email, user.name)
    return customer.id
  }

  // Payment Intent for single sessions
  static async createPaymentIntent({
    userId,
    appointmentId,
    amount,
    trainerId,
    description = 'Personal Training Session'
  }: {
    userId: string
    appointmentId?: string
    amount: number
    trainerId?: string
    description?: string
  }): Promise<Stripe.PaymentIntent> {
    try {
      const customerId = await this.getOrCreateCustomer(userId)
      const stripeAmount = formatAmountForStripe(amount)
      const split = calculateSplit(stripeAmount)

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: stripeAmount,
        currency: STRIPE_CONFIG.currency,
        customer: customerId,
        payment_method_types: ['card', 'pix'],
        description,
        metadata: {
          userId,
          ...(appointmentId && { appointmentId }),
          ...(trainerId && { trainerId }),
          trainerAmount: split.trainerAmount.toString(),
          platformFee: split.platformFee.toString()
        },
        setup_future_usage: 'off_session', // Save payment method for future use
      }

      // Add transfer data for trainer payments (if applicable)
      if (trainerId) {
        const trainer = await prisma.trainerProfile.findUnique({
          where: { id: trainerId },
          include: { user: true }
        })

        if (trainer?.user.stripeCustomerId) {
          // Note: This would require Stripe Connect for actual transfers
          // For now, we'll handle splits in our application logic
        }
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

      // Create payment record
      await prisma.payment.create({
        data: {
          userId,
          appointmentId,
          stripePaymentIntentId: paymentIntent.id,
          stripeCustomerId: customerId,
          amount: amount,
          currency: STRIPE_CONFIG.currency,
          method: 'card', // Will be updated based on actual payment method
          status: 'pending',
          description,
          trainerAmount: split.trainerAmount / 100,
          platformAmount: split.platformFee / 100,
          metadata: paymentIntent.metadata
        }
      })

      return paymentIntent
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw new Error('Failed to create payment intent')
    }
  }

  // Package Payment Intent
  static async createPackagePaymentIntent({
    userId,
    packageId,
    amount,
    description
  }: {
    userId: string
    packageId: string
    amount: number
    description?: string
  }): Promise<Stripe.PaymentIntent> {
    try {
      const customerId = await this.getOrCreateCustomer(userId)
      const stripeAmount = formatAmountForStripe(amount)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: STRIPE_CONFIG.currency,
        customer: customerId,
        payment_method_types: ['card', 'pix'],
        description: description || 'Session Package Purchase',
        metadata: {
          userId,
          packageId,
          type: 'package'
        },
        setup_future_usage: 'off_session'
      })

      // Create payment record
      await prisma.payment.create({
        data: {
          userId,
          packageId,
          stripePaymentIntentId: paymentIntent.id,
          stripeCustomerId: customerId,
          amount: amount,
          currency: STRIPE_CONFIG.currency,
          method: 'card',
          status: 'pending',
          description: description || 'Session Package Purchase',
          metadata: paymentIntent.metadata
        }
      })

      return paymentIntent
    } catch (error) {
      console.error('Error creating package payment intent:', error)
      throw new Error('Failed to create package payment intent')
    }
  }

  // Subscription Management
  static async createSubscription({
    userId,
    priceId,
    trialDays = 7
  }: {
    userId: string
    priceId: string
    trialDays?: number
  }): Promise<Stripe.Subscription> {
    try {
      const customerId = await this.getOrCreateCustomer(userId)

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId
        }
      })

      // Create subscription record
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { stripePriceId: priceId }
      })

      if (plan) {
        const now = new Date()
        const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)

        await prisma.subscription.create({
          data: {
            userId,
            planId: plan.id,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            status: 'trialing',
            currentPeriodStart: now,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            trialStart: now,
            trialEnd: trialEnd
          }
        })
      }

      return subscription
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw new Error('Failed to create subscription')
    }
  }

  static async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId)

      // Update local subscription record
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          endedAt: new Date(subscription.current_period_end * 1000)
        }
      })

      return subscription
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  // Payment Methods
  static async createSetupIntent(userId: string): Promise<Stripe.SetupIntent> {
    try {
      const customerId = await this.getOrCreateCustomer(userId)

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      })

      return setupIntent
    } catch (error) {
      console.error('Error creating setup intent:', error)
      throw new Error('Failed to create setup intent')
    }
  }

  static async getPaymentMethods(userId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true }
      })

      if (!user?.stripeCustomerId) {
        return []
      }

      const { data: paymentMethods } = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card'
      })

      return paymentMethods
    } catch (error) {
      console.error('Error getting payment methods:', error)
      throw new Error('Failed to get payment methods')
    }
  }

  static async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId)

      // Remove from local database
      await prisma.paymentMethod.deleteMany({
        where: { stripePaymentMethodId: paymentMethodId }
      })

      return paymentMethod
    } catch (error) {
      console.error('Error detaching payment method:', error)
      throw new Error('Failed to detach payment method')
    }
  }

  // Refunds
  static async createRefund({
    paymentIntentId,
    amount,
    reason = 'requested_by_customer'
  }: {
    paymentIntentId: string
    amount?: number
    reason?: Stripe.RefundCreateParams.Reason
  }): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? formatAmountForStripe(amount) : undefined,
        reason
      })

      // Create refund record
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId }
      })

      if (payment) {
        await prisma.refund.create({
          data: {
            paymentId: payment.id,
            stripeRefundId: refund.id,
            amount: (refund.amount || 0) / 100,
            currency: refund.currency.toUpperCase(),
            reason,
            status: refund.status || 'pending'
          }
        })

        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'refunded' }
        })
      }

      return refund
    } catch (error) {
      console.error('Error creating refund:', error)
      throw new Error('Failed to create refund')
    }
  }

  // Webhooks
  static async constructEvent(body: string, signature: string): Promise<Stripe.Event> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
      }

      return stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Error constructing webhook event:', error)
      throw error
    }
  }

  static async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
          break
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
          break
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
        case 'setup_intent.succeeded':
          await this.handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent)
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Error handling webhook event:', error)
      throw error
    }
  }

  private static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'succeeded',
        method: paymentIntent.payment_method_types[0] || 'card',
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null
      }
    })

    // Handle appointment payment
    if (paymentIntent.metadata?.appointmentId) {
      await prisma.appointment.update({
        where: { id: paymentIntent.metadata.appointmentId },
        data: { isPaid: true }
      })
    }

    // Handle package purchase
    if (paymentIntent.metadata?.packageId) {
      const packageData = await prisma.package.findUnique({
        where: { id: paymentIntent.metadata.packageId },
        select: { sessions: true, validityDays: true }
      })

      if (packageData) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + packageData.validityDays)

        // Create package sessions
        for (let i = 0; i < packageData.sessions; i++) {
          await prisma.packageSession.create({
            data: {
              packageId: paymentIntent.metadata.packageId,
              userId: paymentIntent.metadata.userId,
              expiresAt
            }
          })
        }
      }
    }
  }

  private static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
      }
    })
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
      }
    })
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        endedAt: new Date(),
        canceledAt: new Date()
      }
    })
  }

  private static async handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent): Promise<void> {
    if (!setupIntent.customer || !setupIntent.payment_method) return

    const customer = setupIntent.customer as string
    const paymentMethodId = setupIntent.payment_method as string

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    // Find user by customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customer }
    })

    if (user && paymentMethod.type === 'card' && paymentMethod.card) {
      await prisma.paymentMethod.create({
        data: {
          userId: user.id,
          stripePaymentMethodId: paymentMethodId,
          stripeCustomerId: customer,
          type: paymentMethod.type,
          card: {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
            funding: paymentMethod.card.funding
          }
        }
      })
    }
  }
}