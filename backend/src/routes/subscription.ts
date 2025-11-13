import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/firebaseAuth.js';
import { AppError } from '../middleware/errorHandler.js';
import { stripeService } from '../services/stripe.js';
import { stripe, SUBSCRIPTION_TIERS } from '../config/stripe.js';

const router = Router();

// Get current subscription and usage
router.get('/usage', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const usage = await stripeService.getUsageStats(req.userId);
    res.json(usage);
  } catch (error) {
    next(error);
  }
});

// Get pricing plans
router.get('/plans', (req, res) => {
  const plans = Object.entries(SUBSCRIPTION_TIERS).map(([key, value]) => ({
    id: key,
    name: value.name,
    price: value.price,
    formsPerYear: value.formsPerYear,
    features: value.features
  }));

  res.json(plans);
});

// Create checkout session
router.post(
  '/checkout',
  authenticate,
  [body('tier').isIn(['STARTER', 'PROFESSIONAL', 'BUSINESS'])],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { tier } = req.body;
      const successUrl = `${process.env.FRONTEND_URL}/dashboard?subscription=success`;
      const cancelUrl = `${process.env.FRONTEND_URL}/pricing?subscription=canceled`;

      const session = await stripeService.createCheckoutSession(
        req.userId,
        tier,
        successUrl,
        cancelUrl
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      next(error);
    }
  }
);

// Create billing portal session
router.post('/portal', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard`;

    const session = await stripeService.createBillingPortalSession(req.userId, returnUrl);

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook handler
router.post('/webhook', async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send('Missing stripe signature');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await stripeService.handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await stripeService.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await stripeService.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object.id);
        const subscription = await stripe.subscriptions.retrieve(
          event.data.object.subscription as string
        );
        await stripeService.handleSubscriptionUpdated(subscription);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    next(error);
  }
});

export default router;
