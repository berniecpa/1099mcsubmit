import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    formsPerYear: 5,
    features: [
      '5 1099 forms per year',
      'Basic support',
      'Form 1099-NEC only'
    ]
  },
  STARTER: {
    name: 'Starter',
    price: 9.99,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    formsPerYear: 25,
    features: [
      '25 1099 forms per year',
      'Email support',
      'All 1099 form types',
      'Priority processing'
    ]
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 29.99,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    formsPerYear: 100,
    features: [
      '100 1099 forms per year',
      'Priority email support',
      'All 1099 form types',
      'Batch filing',
      'Advanced reporting'
    ]
  },
  BUSINESS: {
    name: 'Business',
    price: 79.99,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    formsPerYear: Infinity,
    features: [
      'Unlimited 1099 forms',
      'Phone & email support',
      'All 1099 form types',
      'Batch filing',
      'Advanced reporting',
      'API access',
      'Dedicated account manager'
    ]
  }
} as const;

export type SubscriptionTierKey = keyof typeof SUBSCRIPTION_TIERS;
