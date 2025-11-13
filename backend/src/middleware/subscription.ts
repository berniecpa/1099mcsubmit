import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from './errorHandler.js';
import { AuthRequest } from './firebaseAuth.js';
import { SUBSCRIPTION_TIERS, SubscriptionTierKey } from '../config/stripe.js';

const prisma = new PrismaClient();

export const checkSubscriptionLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user's subscription
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { subscription: true }
    });

    if (!user || !user.subscription) {
      throw new AppError('Subscription not found', 404);
    }

    const subscription = user.subscription;
    const tierLimits = SUBSCRIPTION_TIERS[subscription.tier as SubscriptionTierKey];

    // Check if user has reached their limit
    if (subscription.formsUsedThisYear >= tierLimits.formsPerYear) {
      throw new AppError(
        `You have reached your plan limit of ${tierLimits.formsPerYear} forms per year. Please upgrade your subscription.`,
        403
      );
    }

    // Check if subscription is active
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') {
      throw new AppError(
        'Your subscription is not active. Please update your payment information.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkFeatureAccess = (feature: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { subscription: true }
      });

      if (!user || !user.subscription) {
        throw new AppError('Subscription not found', 404);
      }

      const tier = user.subscription.tier;

      // Feature access rules
      const accessRules: Record<string, SubscriptionTierKey[]> = {
        'batch-filing': ['PROFESSIONAL', 'BUSINESS'],
        'advanced-reporting': ['PROFESSIONAL', 'BUSINESS'],
        'api-access': ['BUSINESS'],
        'form-misc': ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
        'form-k': ['STARTER', 'PROFESSIONAL', 'BUSINESS']
      };

      const allowedTiers = accessRules[feature];
      if (!allowedTiers || !allowedTiers.includes(tier as SubscriptionTierKey)) {
        throw new AppError(
          `This feature requires ${allowedTiers?.join(' or ')} subscription.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
