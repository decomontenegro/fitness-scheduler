# Fitness Scheduler - Complete Payment System

## Overview

This document describes the comprehensive payment system implemented for the Fitness Scheduler application, featuring Stripe integration, subscription management, wallet system, vouchers, referrals, and PCI compliance measures.

## 🏗️ System Architecture

### Core Components

1. **Stripe Integration**
   - Payment processing with Stripe Elements
   - Subscription management
   - Webhook handling
   - Customer management

2. **Database Schema**
   - Extended Prisma schema with 15+ payment-related models
   - Complete payment lifecycle tracking
   - Audit logging and security measures

3. **API Endpoints**
   - RESTful APIs for all payment operations
   - Secure webhook handling
   - Rate limiting and validation

4. **Frontend Components**
   - Secure checkout page with Stripe Elements
   - Billing dashboards for clients and trainers
   - Responsive payment UI components

## 🔧 Installation & Setup

### 1. Install Dependencies

The following packages have been installed:
- `@stripe/stripe-js` - Client-side Stripe integration
- `stripe` - Server-side Stripe SDK

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENCRYPTION_KEY="your-32-character-encryption-key"
```

### 3. Database Migration

Update your database with the new payment schema:

```bash
npx prisma db push
```

### 4. Seed Subscription Plans

Create subscription plans and sample data:

```bash
npm run seed-payments
```

## 📊 Database Schema

### Core Payment Models

#### Payment
```prisma
model Payment {
  id                String         @id @default(cuid())
  appointmentId     String?        @unique
  subscriptionId    String?
  packageId         String?
  userId            String
  
  // Stripe fields
  stripePaymentIntentId String?    @unique
  stripeCustomerId      String?
  stripePaymentMethodId String?
  
  amount            Float
  currency          String         @default("BRL")
  method            String
  status            String
  
  // Split payment fields
  trainerAmount     Float?         // 80% to trainer
  platformAmount    Float?         // 20% to platform
  processingFee     Float?
  
  // ... additional fields
}
```

#### Subscription Plans
```prisma
model SubscriptionPlan {
  id                String         @id @default(cuid())
  name              String         @unique // Basic, Pro, Premium
  price             Float          // Monthly price in BRL
  trialDays         Int            @default(7)
  
  // Stripe fields
  stripePriceId     String?        @unique
  stripeProductId   String?        @unique
  
  // Features
  maxClients        Int?
  maxServices       Int?
  hasAnalytics      Boolean        @default(false)
  // ... more features
}
```

#### Wallet System
```prisma
model WalletTransaction {
  id                String         @id @default(cuid())
  userId            String
  type              String         // credit, debit, refund, cashback, referral_bonus
  amount            Float
  description       String
  // ... additional fields
}
```

#### Voucher System
```prisma
model Voucher {
  id                String         @id @default(cuid())
  code              String         @unique
  type              String         // percentage, fixed_amount
  amount            Float
  maxUses           Int?
  validFrom         DateTime
  validUntil        DateTime
  // ... additional fields
}
```

## 🛡️ Security & PCI Compliance

### Security Measures Implemented

1. **Data Encryption**
   - AES-256-GCM encryption for sensitive data
   - Secure token generation
   - Password hashing with PBKDF2

2. **Input Validation**
   - Zod schema validation
   - XSS prevention
   - SQL injection protection

3. **Audit Logging**
   - Comprehensive audit trail
   - Sensitive data masking
   - Security event tracking

4. **Rate Limiting**
   - API endpoint protection
   - Login attempt limiting
   - Payment attempt restrictions

5. **Security Headers**
   - HSTS implementation
   - CSP policies
   - XSS protection headers

### PCI DSS Compliance Features

- **Secure Data Storage**: No card data stored locally
- **Encrypted Transmission**: All sensitive data encrypted in transit
- **Access Control**: Role-based access restrictions
- **Audit Logging**: Comprehensive activity logging
- **Regular Security Testing**: Validation and monitoring

## 🎯 Core Features

### 1. Stripe Integration

#### Payment Processing
- Support for credit cards and PIX (Brazil)
- 3D Secure authentication
- Payment method saving for future use
- Automatic receipt generation

#### Customer Management
- Automatic Stripe customer creation
- Payment method management
- Billing history tracking

### 2. Subscription System

#### Plans Available
- **Basic**: R$ 29/month - Up to 50 clients, basic features
- **Pro**: R$ 59/month - Up to 200 clients, advanced features  
- **Premium**: R$ 99/month - Unlimited clients, all features

#### Features
- 7-day free trial for all plans
- Plan upgrades/downgrades
- Automatic billing
- Cancellation with grace period

### 3. Session Payment System

#### Individual Sessions
- Direct appointment payments
- Trainer split payments (80/20)
- Refund management
- Receipt generation

#### Session Packages
- 5, 10, 20 session packages
- Volume discounts (10-20% off)
- Package expiration tracking
- Session usage monitoring

### 4. Wallet System

#### Features
- Pre-paid credits
- Referral bonuses
- Cashback rewards
- Transaction history
- Minimum balance requirements

#### Operations
- Credit/debit transactions
- Balance inquiries
- Usage tracking
- Security validations

### 5. Voucher/Coupon System

#### Voucher Types
- Percentage discounts
- Fixed amount discounts
- Usage limits per user
- Expiration dates

#### Examples
- `WELCOME10` - 10% off first purchase
- `FIRST50` - R$ 50 off first package
- `SUMMER20` - 20% off session packages

### 6. Referral Program

#### Features
- R$ 50 referral bonus
- 30-day completion window
- Automatic reward distribution
- Referral link generation
- Tracking and analytics

## 🔌 API Endpoints

### Payment APIs

#### Checkout
```
POST /api/payments/checkout
```
Create payment intents for appointments, packages, or subscriptions.

#### Webhook
```
POST /api/payments/webhook
```
Handle Stripe webhook events securely.

#### Refunds
```
POST /api/payments/refund
```
Process refunds for payments.

#### Subscriptions
```
GET/POST /api/payments/subscription
```
Manage user subscriptions.

### Wallet APIs

#### Balance & Transactions
```
GET/POST /api/wallet
```
Manage wallet balance and transactions.

### Voucher APIs

#### Validation & Usage
```
GET/POST /api/vouchers
```
Validate and apply voucher codes.

### Referral APIs

#### Program Management
```
GET/POST/PATCH /api/referrals
```
Manage referral program participation.

## 🎨 Frontend Components

### Checkout Page (`/checkout`)
- Stripe Elements integration
- Voucher code application
- Payment summary display
- Secure payment processing

### Billing Dashboard (`/billing`)
- Payment history
- Subscription management
- Wallet overview
- Invoice downloads

### Earnings Dashboard (`/earnings`)
- Trainer revenue tracking
- Payout requests
- Transaction history
- Performance metrics

## 📱 Usage Examples

### Creating a Payment Intent

```typescript
const response = await fetch('/api/payments/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'appointment',
    appointmentId: 'appt_123',
    amount: 100,
    description: 'Personal Training Session'
  })
})

const { paymentIntent } = await response.json()
```

### Applying a Voucher

```typescript
const response = await fetch('/api/vouchers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'WELCOME10',
    amount: 100
  })
})

const { voucher } = await response.json()
console.log(`Discount: ${voucher.discountAmount}`)
```

### Processing Refunds

```typescript
const response = await fetch('/api/payments/refund', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentId: 'pay_123',
    reason: 'requested_by_customer',
    amount: 50 // Partial refund
  })
})
```

## 🚀 Deployment

### Environment Setup

1. Set up Stripe webhook endpoint
2. Configure environment variables
3. Run database migrations
4. Seed subscription plans

### Production Checklist

- [ ] SSL certificate configured
- [ ] Webhook endpoint secured
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Error monitoring set up
- [ ] PCI compliance verified

## 🧪 Testing

### Test Scenarios

1. **Payment Processing**
   - Successful payments
   - Failed payments
   - 3D Secure flows

2. **Subscription Management**
   - Plan subscriptions
   - Cancellations
   - Upgrades/downgrades

3. **Wallet Operations**
   - Credits and debits
   - Balance validations
   - Transaction history

4. **Voucher System**
   - Code validation
   - Usage limits
   - Expiration handling

5. **Referral Program**
   - Referral creation
   - Completion tracking
   - Reward distribution

### Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

## 🔧 Maintenance

### Regular Tasks

1. **Webhook Monitoring**
   - Verify webhook delivery
   - Handle failed webhooks
   - Monitor processing times

2. **Payment Reconciliation**
   - Match Stripe transactions
   - Verify split payments
   - Update payment statuses

3. **Security Updates**
   - Monitor for vulnerabilities
   - Update dependencies
   - Review audit logs

### Monitoring & Alerts

- Payment success/failure rates
- Webhook processing status
- API response times
- Security incidents
- Subscription churn rates

## 📞 Support

### Common Issues

1. **Payment Failures**
   - Check card validity
   - Verify webhook processing
   - Review error logs

2. **Subscription Issues**
   - Verify Stripe plan IDs
   - Check trial periods
   - Monitor webhook events

3. **Voucher Problems**
   - Validate code format
   - Check usage limits
   - Verify expiration dates

### Error Handling

All payment operations include comprehensive error handling with:
- User-friendly error messages
- Detailed logging for debugging
- Automatic retry mechanisms
- Fallback procedures

## 🎯 Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Revenue forecasting
   - Churn analysis
   - Performance dashboards

2. **Payment Methods**
   - Bank transfers
   - Digital wallets
   - Cryptocurrency support

3. **International Support**
   - Multi-currency support
   - Localized payment methods
   - Tax calculations

4. **Business Features**
   - Invoicing system
   - Expense tracking
   - Financial reporting

---

*This payment system provides a comprehensive, secure, and scalable solution for the Fitness Scheduler application with full PCI compliance and modern payment processing capabilities.*