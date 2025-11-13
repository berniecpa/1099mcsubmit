import { Router } from 'express';
import { PrismaClient, FilingStatus } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { taxbanditsService } from '../services/taxbandits.js';

const router = Router();
const prisma = new PrismaClient();

// Get all forms for a business
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const { taxYear, status } = req.query;

    const forms = await prisma.form1099.findMany({
      where: {
        businessId: business.id,
        ...(taxYear && { taxYear: parseInt(taxYear as string) }),
        ...(status && { status: status as FilingStatus })
      },
      include: {
        recipient: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(forms);
  } catch (error) {
    next(error);
  }
});

// Get single form
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const form = await prisma.form1099.findFirst({
      where: {
        id: req.params.id,
        businessId: business.id
      },
      include: {
        recipient: true,
        business: true
      }
    });

    if (!form) {
      throw new AppError('Form not found', 404);
    }

    res.json(form);
  } catch (error) {
    next(error);
  }
});

// Create form (draft)
router.post(
  '/',
  authenticate,
  [
    body('recipientId').isUUID(),
    body('formType').isIn(['NEC', 'MISC', 'K']),
    body('taxYear').isInt({ min: 2020, max: 2030 })
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

      const {
        recipientId,
        formType,
        taxYear,
        // 1099-NEC
        nonemployeeCompensation,
        // 1099-MISC
        rents,
        royalties,
        otherIncome,
        federalIncomeTaxWithheld,
        medicalHealthcare,
        // 1099-K
        grossAmount,
        numberOfTransactions
      } = req.body;

      // Verify recipient belongs to business
      const recipient = await prisma.recipient.findFirst({
        where: {
          id: recipientId,
          businessId: business.id
        }
      });

      if (!recipient) {
        throw new AppError('Recipient not found', 404);
      }

      // Convert dollar amounts to cents
      const toCents = (amount: number | undefined) =>
        amount ? Math.round(amount * 100) : null;

      const form = await prisma.form1099.create({
        data: {
          businessId: business.id,
          recipientId,
          formType,
          taxYear,
          status: 'DRAFT',
          // 1099-NEC
          nonemployeeCompensation: toCents(nonemployeeCompensation),
          // 1099-MISC
          rents: toCents(rents),
          royalties: toCents(royalties),
          otherIncome: toCents(otherIncome),
          federalIncomeTaxWithheld: toCents(federalIncomeTaxWithheld),
          medicalHealthcare: toCents(medicalHealthcare),
          // 1099-K
          grossAmount: toCents(grossAmount),
          numberOfTransactions
        },
        include: {
          recipient: true
        }
      });

      res.status(201).json(form);
    } catch (error) {
      next(error);
    }
  }
);

// Update form (only if in DRAFT status)
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const existingForm = await prisma.form1099.findFirst({
      where: {
        id: req.params.id,
        businessId: business.id
      }
    });

    if (!existingForm) {
      throw new AppError('Form not found', 404);
    }

    if (existingForm.status !== 'DRAFT') {
      throw new AppError('Can only update forms in DRAFT status', 400);
    }

    const {
      nonemployeeCompensation,
      rents,
      royalties,
      otherIncome,
      federalIncomeTaxWithheld,
      medicalHealthcare,
      grossAmount,
      numberOfTransactions
    } = req.body;

    const toCents = (amount: number | undefined) =>
      amount ? Math.round(amount * 100) : null;

    const form = await prisma.form1099.update({
      where: { id: req.params.id },
      data: {
        nonemployeeCompensation: toCents(nonemployeeCompensation),
        rents: toCents(rents),
        royalties: toCents(royalties),
        otherIncome: toCents(otherIncome),
        federalIncomeTaxWithheld: toCents(federalIncomeTaxWithheld),
        medicalHealthcare: toCents(medicalHealthcare),
        grossAmount: toCents(grossAmount),
        numberOfTransactions
      },
      include: {
        recipient: true
      }
    });

    res.json(form);
  } catch (error) {
    next(error);
  }
});

// Submit form to IRS via TaxBandits
router.post('/:id/submit', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const form = await prisma.form1099.findFirst({
      where: {
        id: req.params.id,
        businessId: business.id
      },
      include: {
        recipient: true,
        business: true
      }
    });

    if (!form) {
      throw new AppError('Form not found', 404);
    }

    if (form.status !== 'DRAFT') {
      throw new AppError('Form has already been submitted', 400);
    }

    // Validate form data
    if (form.formType === 'NEC' && !form.nonemployeeCompensation) {
      throw new AppError('Non-employee compensation is required for 1099-NEC', 400);
    }

    try {
      // Update status to pending
      await prisma.form1099.update({
        where: { id: form.id },
        data: { status: 'PENDING' }
      });

      // Submit to TaxBandits
      let submissionResult;

      if (form.formType === 'NEC') {
        submissionResult = await taxbanditsService.submitForm1099NEC(
          form,
          form.business,
          form.recipient
        );
      } else {
        throw new AppError('Only 1099-NEC is currently supported', 400);
      }

      // Update form with submission details
      const updatedForm = await prisma.form1099.update({
        where: { id: form.id },
        data: {
          status: 'SUBMITTED',
          taxbanditsSubmissionId: submissionResult.submissionId,
          taxbanditsRecordId: submissionResult.recordId,
          submittedAt: new Date()
        },
        include: {
          recipient: true
        }
      });

      res.json(updatedForm);
    } catch (error) {
      // Update form with error
      await prisma.form1099.update({
        where: { id: form.id },
        data: {
          status: 'DRAFT',
          errorMessage: error instanceof Error ? error.message : 'Submission failed'
        }
      });

      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Check submission status
router.get('/:id/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const form = await prisma.form1099.findFirst({
      where: {
        id: req.params.id,
        businessId: business.id
      }
    });

    if (!form) {
      throw new AppError('Form not found', 404);
    }

    if (!form.taxbanditsSubmissionId) {
      return res.json({ status: form.status });
    }

    // Get status from TaxBandits
    const status = await taxbanditsService.getSubmissionStatus(form.taxbanditsSubmissionId);

    // Update local status if changed
    if (status.Status === 'Accepted' && form.status !== 'ACCEPTED') {
      await prisma.form1099.update({
        where: { id: form.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      });
    } else if (status.Status === 'Rejected' && form.status !== 'REJECTED') {
      await prisma.form1099.update({
        where: { id: form.id },
        data: {
          status: 'REJECTED',
          errorMessage: status.ErrorMessage || 'Form was rejected'
        }
      });
    }

    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Delete form (only if in DRAFT status)
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { userId: req.userId }
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const form = await prisma.form1099.findFirst({
      where: {
        id: req.params.id,
        businessId: business.id
      }
    });

    if (!form) {
      throw new AppError('Form not found', 404);
    }

    if (form.status !== 'DRAFT') {
      throw new AppError('Can only delete forms in DRAFT status', 400);
    }

    await prisma.form1099.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
