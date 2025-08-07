import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Stripe is optional - will work without it but payments will be disabled
const STRIPE_ENABLED = !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

// Server-side Stripe instance (only if configured)
export const stripe = STRIPE_ENABLED 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  : null

// Client-side Stripe instance (only if configured)
export const stripePromise = STRIPE_ENABLED 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  : null

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'brl',
  country: 'BR',
  locale: 'pt-BR',
  paymentMethods: ['card', 'pix'],
  minimumAmount: 100, // R$ 1.00 in cents
  maximumAmount: 10000000, // R$ 100,000.00 in cents
  
  // Platform fee (20% to platform, 80% to trainer)
  platformFeePercentage: 20,
  
  // Subscription plans
  subscriptionPlans: {
    basic: {
      name: 'Basic',
      price: 2900, // R$ 29.00
      features: ['Up to 50 clients', 'Basic analytics', 'Email support']
    },
    pro: {
      name: 'Pro',
      price: 5900, // R$ 59.00
      features: ['Up to 200 clients', 'Advanced analytics', 'Custom branding', 'Priority support']
    },
    premium: {
      name: 'Premium',
      price: 9900, // R$ 99.00
      features: ['Unlimited clients', 'Advanced analytics', 'Custom branding', 'Priority support', 'API access']
    }
  }
}

// Helper functions
export function formatAmountForStripe(amount: number): number {
  // Convert to cents for Stripe
  return Math.round(amount * 100)
}

export function formatAmountForDisplay(amount: number): string {
  // Convert from cents and format for display
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount / 100)
}

export function calculateSplit(amount: number) {
  const platformFee = Math.round(amount * (STRIPE_CONFIG.platformFeePercentage / 100))
  const trainerAmount = amount - platformFee
  
  return {
    total: amount,
    trainerAmount,
    platformFee,
    processingFee: 0 // Will be calculated by Stripe
  }
}

// Webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED: 'payment_intent.payment_failed',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  SETUP_INTENT_SUCCEEDED: 'setup_intent.succeeded',
} as const

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[keyof typeof STRIPE_WEBHOOK_EVENTS]