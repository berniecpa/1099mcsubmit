import { stripe, SUBSCRIPTION_TIERS, SubscriptionTierKey } from '../config/stripe.js';
import { PrismaClient, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

export class StripeService {
  /**
   * Create or retrieve a Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if customer already exists
    if (user.subscription?.stripeCustomerId) {
      return user.subscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId
      }
    });

    // Update subscription with customer ID
    await prisma.subscription.update({
      where: { userId },
      data: { stripeCustomerId: customer.id }
    });

    return customer.id;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    tier: SubscriptionTierKey,
    successUrl: string,
    cancelUrl: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const priceId = SUBSCRIPTION_TIERS[tier].priceId;
    if (!priceId) {
      throw new Error('Invalid subscription tier');
    }

    const customerId = await this.getOrCreateCustomer(userId, user.email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        tier
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId,
          tier
        }
      }
    });

    return session;
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(userId: string, returnUrl: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription?.stripeCustomerId) {
      throw new Error('No subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: returnUrl
    });

    return session;
  }

  /**
   * Handle subscription created webhook
   */
  async handleSubscriptionCreated(subscription: any) {
    const userId = subscription.metadata.userId;
    const tier = subscription.metadata.tier as SubscriptionTier;

    await prisma.subscription.update({
      where: { userId },
      data: {
        tier,
        status: subscription.status === 'trialing' ? 'TRIALING' : 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null
      }
    });
  }

  /**
   * Handle subscription updated webhook
   */
  async handleSubscriptionUpdated(subscription: any) {
    const stripeSubscriptionId = subscription.id;

    const existingSub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId }
    });

    if (!existingSub) {
      console.error('Subscription not found for update:', stripeSubscriptionId);
      return;
    }

    const statusMap: Record<string, any> = {
      active: 'ACTIVE',
      trialing: 'TRIALING',
      canceled: 'CANCELED',
      past_due: 'PAST_DUE',
      incomplete: 'INCOMPLETE'
    };

    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        status: statusMap[subscription.status] || 'ACTIVE',
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        stripePriceId: subscription.items.data[0].price.id
      }
    });
  }

  /**
   * Handle subscription deleted/canceled webhook
   */
  async handleSubscriptionDeleted(subscription: any) {
    const stripeSubscriptionId = subscription.id;

    const existingSub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId }
    });

    if (!existingSub) {
      return;
    }

    // Downgrade to free tier
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        tier: 'FREE',
        status: 'CANCELED',
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null
      }
    });
  }

  /**
   * Increment form usage for a user
   */
  async incrementFormUsage(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Check if we need to reset the yearly counter
    const now = new Date();
    if (subscription.yearlyResetDate && now >= subscription.yearlyResetDate) {
      await prisma.subscription.update({
        where: { userId },
        data: {
          formsUsedThisYear: 1,
          yearlyResetDate: new Date(now.getFullYear() + 1, 0, 1)
        }
      });
    } else {
      await prisma.subscription.update({
        where: { userId },
        data: {
          formsUsedThisYear: subscription.formsUsedThisYear + 1
        }
      });
    }
  }

  /**
   * Get subscription usage stats
   */
  async getUsageStats(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const tierLimits = SUBSCRIPTION_TIERS[subscription.tier as SubscriptionTierKey];

    return {
      tier: subscription.tier,
      status: subscription.status,
      formsUsed: subscription.formsUsedThisYear,
      formsLimit: tierLimits.formsPerYear,
      formsRemaining:
        tierLimits.formsPerYear === Infinity
          ? Infinity
          : tierLimits.formsPerYear - subscription.formsUsedThisYear,
      resetDate: subscription.yearlyResetDate,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd
    };
  }
}

export const stripeService = new StripeService();
