import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'

const SUBSCRIPTION_PLANS = [
  {
    name: 'Basic',
    description: 'Perfect for new trainers getting started',
    price: 2900, // R$ 29.00
    currency: 'BRL',
    interval: 'month',
    intervalCount: 1,
    trialDays: 7,
    maxClients: 50,
    maxServices: 10,
    hasAnalytics: false,
    hasCustomBranding: false,
    hasAdvancedScheduling: false,
    hasPrioritySupport: false,
    features: [
      'Up to 50 clients',
      'Up to 10 services',
      'Basic scheduling',
      'Email support',
      '7-day free trial'
    ]
  },
  {
    name: 'Pro',
    description: 'For growing fitness professionals',
    price: 5900, // R$ 59.00
    currency: 'BRL',
    interval: 'month',
    intervalCount: 1,
    trialDays: 7,
    maxClients: 200,
    maxServices: 50,
    hasAnalytics: true,
    hasCustomBranding: false,
    hasAdvancedScheduling: true,
    hasPrioritySupport: false,
    features: [
      'Up to 200 clients',
      'Up to 50 services',
      'Advanced scheduling',
      'Analytics dashboard',
      'Email & WhatsApp notifications',
      'Priority support',
      '7-day free trial'
    ]
  },
  {
    name: 'Premium',
    description: 'For established fitness businesses',
    price: 9900, // R$ 99.00
    currency: 'BRL',
    interval: 'month',
    intervalCount: 1,
    trialDays: 7,
    maxClients: null, // Unlimited
    maxServices: null, // Unlimited
    hasAnalytics: true,
    hasCustomBranding: true,
    hasAdvancedScheduling: true,
    hasPrioritySupport: true,
    features: [
      'Unlimited clients',
      'Unlimited services',
      'Advanced scheduling',
      'Advanced analytics',
      'Custom branding',
      'All notification channels',
      'Priority support',
      'API access',
      '7-day free trial'
    ]
  }
]

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...')
  
  for (const planData of SUBSCRIPTION_PLANS) {
    try {
      // Create product in Stripe
      const product = await stripe.products.create({
        name: `Fitness Scheduler ${planData.name}`,
        description: planData.description,
        metadata: {
          plan: planData.name.toLowerCase(),
          maxClients: planData.maxClients?.toString() || 'unlimited',
          maxServices: planData.maxServices?.toString() || 'unlimited'
        }
      })

      console.log(`Created product: ${product.name} (${product.id})`)

      // Create price in Stripe
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: planData.price,
        currency: planData.currency.toLowerCase(),
        recurring: {
          interval: planData.interval as 'month' | 'year',
          interval_count: planData.intervalCount,
          trial_period_days: planData.trialDays
        },
        metadata: {
          plan: planData.name.toLowerCase()
        }
      })

      console.log(`Created price: ${planData.price / 100} ${planData.currency}/${planData.interval} (${price.id})`)

      // Create or update plan in database
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { name: planData.name }
      })

      if (existingPlan) {
        await prisma.subscriptionPlan.update({
          where: { id: existingPlan.id },
          data: {
            description: planData.description,
            price: planData.price / 100, // Convert from cents to BRL
            stripePriceId: price.id,
            stripeProductId: product.id,
            maxClients: planData.maxClients,
            maxServices: planData.maxServices,
            hasAnalytics: planData.hasAnalytics,
            hasCustomBranding: planData.hasCustomBranding,
            hasAdvancedScheduling: planData.hasAdvancedScheduling,
            hasPrioritySupport: planData.hasPrioritySupport,
            trialDays: planData.trialDays,
            isActive: true
          }
        })
        console.log(`Updated plan: ${planData.name}`)
      } else {
        await prisma.subscriptionPlan.create({
          data: {
            name: planData.name,
            description: planData.description,
            price: planData.price / 100, // Convert from cents to BRL
            currency: planData.currency,
            interval: planData.interval,
            intervalCount: planData.intervalCount,
            trialDays: planData.trialDays,
            stripePriceId: price.id,
            stripeProductId: product.id,
            maxClients: planData.maxClients,
            maxServices: planData.maxServices,
            hasAnalytics: planData.hasAnalytics,
            hasCustomBranding: planData.hasCustomBranding,
            hasAdvancedScheduling: planData.hasAdvancedScheduling,
            hasPrioritySupport: planData.hasPrioritySupport,
            isActive: true
          }
        })
        console.log(`Created plan: ${planData.name}`)
      }

    } catch (error) {
      console.error(`Error creating plan ${planData.name}:`, error)
    }
  }
}

async function createSamplePackages() {
  console.log('Creating sample session packages...')

  // Get a trainer to create packages for (you can modify this)
  const trainer = await prisma.trainerProfile.findFirst({
    include: { user: true }
  })

  if (!trainer) {
    console.log('No trainer found. Skipping package creation.')
    return
  }

  const packages = [
    {
      name: '5 Sessions Package',
      description: 'Save 10% with our 5-session package',
      sessions: 5,
      price: 450, // R$ 450 (normally R$ 500)
      discount: 10,
      validityDays: 60,
      trainerId: trainer.id
    },
    {
      name: '10 Sessions Package',
      description: 'Save 15% with our 10-session package',
      sessions: 10,
      price: 850, // R$ 850 (normally R$ 1000)
      discount: 15,
      validityDays: 90,
      trainerId: trainer.id
    },
    {
      name: '20 Sessions Package',
      description: 'Save 20% with our 20-session package',
      sessions: 20,
      price: 1600, // R$ 1600 (normally R$ 2000)
      discount: 20,
      validityDays: 120,
      trainerId: trainer.id
    }
  ]

  for (const packageData of packages) {
    try {
      const existingPackage = await prisma.package.findFirst({
        where: {
          name: packageData.name,
          trainerId: packageData.trainerId
        }
      })

      if (!existingPackage) {
        await prisma.package.create({
          data: packageData
        })
        console.log(`Created package: ${packageData.name}`)
      } else {
        console.log(`Package already exists: ${packageData.name}`)
      }
    } catch (error) {
      console.error(`Error creating package ${packageData.name}:`, error)
    }
  }
}

async function createSampleVouchers() {
  console.log('Creating sample vouchers...')

  const vouchers = [
    {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: '10% off your first purchase',
      type: 'percentage',
      amount: 10,
      maxUses: 1000,
      maxUsesPerUser: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      minAmount: 50,
      applicableTo: 'all',
      isActive: true
    },
    {
      code: 'FIRST50',
      name: 'First Purchase Bonus',
      description: 'R$ 50 off your first package',
      type: 'fixed_amount',
      amount: 50,
      maxUses: 500,
      maxUsesPerUser: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      minAmount: 200,
      applicableTo: 'packages',
      isActive: true
    },
    {
      code: 'SUMMER20',
      name: 'Summer Special',
      description: '20% off session packages',
      type: 'percentage',
      amount: 20,
      maxUses: 200,
      maxUsesPerUser: 2,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      minAmount: 300,
      applicableTo: 'packages',
      isActive: true
    }
  ]

  for (const voucherData of vouchers) {
    try {
      const existingVoucher = await prisma.voucher.findUnique({
        where: { code: voucherData.code }
      })

      if (!existingVoucher) {
        await prisma.voucher.create({
          data: voucherData
        })
        console.log(`Created voucher: ${voucherData.code}`)
      } else {
        console.log(`Voucher already exists: ${voucherData.code}`)
      }
    } catch (error) {
      console.error(`Error creating voucher ${voucherData.code}:`, error)
    }
  }
}

async function main() {
  try {
    console.log('Starting payment system seed...')

    await createStripeProducts()
    await createSamplePackages()
    await createSampleVouchers()

    console.log('Payment system seed completed successfully!')
  } catch (error) {
    console.error('Error seeding payment system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

export default main