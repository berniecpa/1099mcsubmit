import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/firebaseAuth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

// Get all recipients for a business
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const recipients = await prisma.recipient.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(recipients);
  } catch (error) {
    next(error);
  }
});

// Get single recipient
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const recipient = await prisma.recipient.findFirst({
      where: {
        id: req.params.id,
        businessId: business.id
      }
    });

    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    res.json(recipient);
  } catch (error) {
    next(error);
  }
});

// Create recipient
router.post(
  '/',
  authenticate,
  [
    body('name').notEmpty().trim(),
    body('tin').matches(/^\d{9}$/),
    body('tinType').isIn(['SSN', 'EIN']),
    body('address').notEmpty().trim(),
    body('city').notEmpty().trim(),
    body('state').isLength({ min: 2, max: 2 }),
    body('zipCode').matches(/^\d{5}(-\d{4})?$/),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim()
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const business = await prisma.business.findUnique({
        where: { userId: req.userId }
      });

      if (!business) {
        throw new AppError('Business not found', 404);
      }

      const { name, businessName, tin, tinType, address, city, state, zipCode, email, phone } = req.body;

      const recipient = await prisma.recipient.create({
        data: {
          businessId: business.id,
          name,
          businessName,
          tin,
          tinType,
          address,
          city,
          state: state.toUpperCase(),
          zipCode,
          email,
          phone
        }
      });

      res.status(201).json(recipient);
    } catch (error) {
      next(error);
    }
  }
);

// Update recipient
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    // Verify recipient belongs to business
    const existingRecipient = await prisma.recipient.findFirst({
      where: {
        id: req.params.id,
        businessId: business.id
      }
    });

    if (!existingRecipient) {
      throw new AppError('Recipient not found', 404);
    }

    const { name, businessName, tin, tinType, address, city, state, zipCode, email, phone } = req.body;

    const recipient = await prisma.recipient.update({
      where: { id: req.params.id },
      data: {
        name,
        businessName,
        tin,
        tinType,
        address,
        city,
        state: state?.toUpperCase(),
        zipCode,
        email,
        phone
      }
    });

    res.json(recipient);
  } catch (error) {
    next(error);
  }
});

// Delete recipient
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    // Verify recipient belongs to business
    const existingRecipient = await prisma.recipient.findFirst({
      where: {
        id: req.params.id,
        businessId: business.id
      }
    });

    if (!existingRecipient) {
      throw new AppError('Recipient not found', 404);
    }

    await prisma.recipient.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
