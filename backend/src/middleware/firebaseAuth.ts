import { Request, Response, NextFunction } from 'express';
import { firebaseAdmin } from '../config/firebase.js';
import { AppError } from './errorHandler.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  firebaseUid?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split('Bearer ')[1];

    if (!firebaseAdmin) {
      // Development mode without Firebase - allow pass-through
      // In production, this should be removed
      console.warn('⚠️  Running without Firebase authentication');
      next();
      return;
    }

    // Verify Firebase ID token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      include: { subscription: true }
    });

    if (!user) {
      // Auto-create user if they authenticated with Firebase
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
          subscription: {
            create: {
              tier: 'FREE',
              status: 'ACTIVE',
              yearlyResetDate: new Date(new Date().getFullYear() + 1, 0, 1)
            }
          }
        },
        include: { subscription: true }
      });
    }

    req.userId = user.id;

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'FirebaseAuthError') {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};
