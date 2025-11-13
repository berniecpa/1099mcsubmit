import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Get business profile
router.get('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    res.json(business);
  } catch (error) {
    next(error);
  }
});

// Update business profile
router.put('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { businessName, tradeName, contactName, phone, address, city, state, zipCode } = req.body;

    const business = await prisma.business.update({
      where: { userId: req.userId },
      data: {
        businessName,
        tradeName,
        contactName,
        phone,
        address,
        city,
        state: state?.toUpperCase(),
        zipCode
      }
    });

    res.json(business);
  } catch (error) {
    next(error);
  }
});

export default router;
