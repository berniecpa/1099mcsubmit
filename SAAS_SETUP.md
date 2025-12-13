# SaaS Setup Guide

This guide will help you set up the 1099 MC Submit application as a SaaS platform with Firebase Authentication and Stripe payments.

## Architecture Overview

The application now includes:
- **Firebase Authentication** for user management
- **Stripe** for subscription billing
- **Subscription Tiers** with usage limits
- **Automatic form usage tracking**

## Subscription Tiers

| Tier | Price | Forms/Year | Features |
|------|-------|------------|----------|
| Free | $0 | 5 | Basic support, 1099-NEC only |
| Starter | $9.99/mo | 25 | All form types, email support |
| Professional | $29.99/mo | 100 | Batch filing, advanced reporting |
| Business | $79.99/mo | Unlimited | API access, dedicated support |

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `1099mcsubmit` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In Firebase Console, go to **Build** > **Authentication**
2. Click "Get started"
3. Enable providers:
   - **Email/Password**: Click, toggle on, Save
   - **Google**: Click, toggle on, add support email, Save

### 1.3 Get Web App Credentials

1. In Project Settings (gear icon) > General
2. Scroll to "Your apps"
3. Click web icon (</>) to add web app
4. Register app name: `1099 MC Submit Web`
5. Copy the config object

### 1.4 Get Service Account Key

1. In Project Settings > **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file securely
4. Copy the entire JSON content for backend `.env`

### 1.5 Configure Frontend

Create `frontend/.env`:
```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:xxxxx"
```

### 1.6 Configure Backend

In `backend/.env`:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

## Step 2: Stripe Setup

### 2.1 Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Create account or sign in
3. Toggle **Test mode** (top right) to ON

### 2.2 Get API Keys

1. Go to **Developers** > **API keys**
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)

### 2.3 Create Products and Prices

1. Go to **Products** > **Add product**

**Create Starter Plan:**
- Name: `Starter`
- Description: `25 1099 forms per year`
- Pricing model: Recurring
- Price: $9.99
- Billing period: Monthly
- Click "Save product"
- Copy the **Price ID** (starts with `price_`)

**Repeat for Professional ($29.99) and Business ($79.99)**

### 2.4 Set up Webhook

1. Go to **Developers** > **Webhooks**
2. Click "+ Add endpoint"
3. Endpoint URL: `https://your-backend-url.com/api/subscription/webhook`
   - For local testing: Use [ngrok](https://ngrok.com/) or Stripe CLI
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

### 2.5 Configure Environment Variables

**Backend (.env):**
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PROFESSIONAL_PRICE_ID="price_..."
STRIPE_BUSINESS_PRICE_ID="price_..."
FRONTEND_URL="http://localhost:3000"
```

**Frontend (.env):**
```env
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Step 3: Database Migration

Update your database with the new schema:

```bash
cd backend
npx prisma db push
npx prisma generate
```

This creates:
- Updated `User` model with Firebase UID
- New `Subscription` model
- Subscription tier and status enums

## Step 4: Testing Locally

### 4.1 Install Dependencies

```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 4.2 Start Development Servers

```bash
# From root directory
npm run dev
```

Or separately:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 4.3 Test Stripe Webhooks Locally

**Option 1: Stripe CLI**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3001/api/subscription/webhook
```

**Option 2: ngrok**
```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 3001

# Use the HTTPS URL in Stripe webhook settings
```

### 4.4 Test Subscription Flow

1. **Register** a new user at `http://localhost:3000/register`
2. **Login** with email/password or Google
3. **Visit** `/pricing` to see subscription plans
4. **Subscribe** to a plan (use Stripe test card `4242 4242 4242 4242`)
5. **Create forms** and verify usage limits work
6. **Check** Stripe Dashboard for subscription details

## Step 5: Test Credit Cards

Stripe provides test cards:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Declined |

- Use any future expiration date (e.g., 12/34)
- Use any 3-digit CVC
- Use any ZIP code

## Step 6: Production Deployment

### 6.1 Firebase Production

1. In Firebase Console, set up production environment
2. Enable the same auth providers
3. Get new service account key for production
4. Update CORS settings if needed

### 6.2 Stripe Production

1. Toggle **Test mode** to OFF in Stripe Dashboard
2. Get new **Live** API keys
3. Create products and prices again in live mode
4. Update webhook endpoint to production URL
5. Get new webhook signing secret

### 6.3 Environment Variables

Update `.env` files with production values:
- Replace all `_test_` keys with `_live_` keys
- Update `FIREBASE_SERVICE_ACCOUNT_KEY` with production key
- Set `NODE_ENV=production`
- Set `FRONTEND_URL` to production domain

## Features

### Authentication

- **Email/Password** registration and login
- **Google Sign-In** for easy onboarding
- **Automatic user creation** in database on first login
- **Free tier** assigned automatically

### Subscription Management

- **Pricing page** with all tiers
- **Stripe Checkout** for secure payments
- **Customer Portal** for subscription management
- **Automatic downgrade** to free when subscription cancels

### Usage Tracking

- **Form submission** increments usage counter
- **Yearly reset** on January 1st
- **Limit enforcement** before submission
- **Real-time usage stats** in dashboard

### Webhooks

- **Subscription created**: Activates paid tier
- **Subscription updated**: Updates tier/status
- **Subscription deleted**: Downgrades to free
- **Payment succeeded**: Continues service
- **Payment failed**: Marks as past due

## API Endpoints

### Subscription

- `GET /api/subscription/usage` - Get current usage stats
- `GET /api/subscription/plans` - Get all pricing plans
- `POST /api/subscription/checkout` - Create Stripe checkout session
- `POST /api/subscription/portal` - Create billing portal session
- `POST /api/subscription/webhook` - Handle Stripe webhooks

## Troubleshooting

### Firebase Issues

**Error: "Firebase not initialized"**
- Check `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
- Ensure JSON is properly formatted (use single quotes for env var)
- Verify service account has correct permissions

**Error: "Auth domain not authorized"**
- Add your frontend URL to Firebase Console > Authentication > Settings > Authorized domains

### Stripe Issues

**Webhook not receiving events**
- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Use Stripe CLI for local testing
- Check Stripe Dashboard > Developers > Webhooks > Events

**Checkout session not created**
- Verify price IDs are correct
- Ensure Stripe secret key is valid
- Check products are active in Stripe Dashboard

### Database Issues

**Migration errors**
- Run `npx prisma db push --force-reset` (WARNING: deletes data)
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running

## Security Checklist

- [ ] Firebase service account key never committed to git
- [ ] Stripe secret keys stored in environment variables
- [ ] Webhook signature verification enabled
- [ ] CORS properly configured
- [ ] HTTPS enabled in production
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

## Monitoring

### Stripe Dashboard

Monitor:
- Customer subscriptions
- Payment failures
- Webhook delivery
- Revenue metrics

### Firebase Console

Monitor:
- User signups
- Authentication methods
- Errors and issues

### Application Logs

Watch for:
- Failed form submissions
- Subscription errors
- Usage limit violations
- Webhook processing errors

## Support

- Firebase: https://firebase.google.com/support
- Stripe: https://support.stripe.com
- TaxBandits: https://developer.taxbandits.com/support

---

## Quick Reference

**Test user creation:**
```javascript
// Automatic on first Firebase login
// Creates with FREE tier subscription
```

**Test subscription:**
```javascript
// Use test card: 4242 4242 4242 4242
// Subscribe via /pricing page
// Verify in Stripe Dashboard > Customers
```

**Test webhook:**
```bash
stripe trigger customer.subscription.created
```

**Check usage:**
```bash
curl http://localhost:3001/api/subscription/usage \
  -H "Authorization: Bearer <firebase-token>"
```

Ready to launch your SaaS! 🚀
