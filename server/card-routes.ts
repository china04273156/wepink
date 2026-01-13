import { Router, Request, Response } from 'express';
import {
  validateCard,
  calculateInstallments,
  generateCardToken,
  detectCardBrand,
  maskCardNumber,
  INSTALLMENT_LIMITS,
  INTEREST_RATES,
} from './card-validator';
import { authMiddleware } from './middleware';

const router = Router();

/**
 * POST /api/card/validate
 * Validar dados do cartão
 */
router.post('/validate', authMiddleware, (req: Request, res: Response) => {
  try {
    const { cardNumber, cardHolder, expiryDate, cvv } = req.body;

    const result = validateCard({
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
    });

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        errors: result.errors,
      });
    }

    res.json({
      valid: true,
      brand: result.brand,
      lastDigits: result.lastDigits,
      masked: maskCardNumber(cardNumber),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/card/installments
 * Calcular opções de parcelamento
 */
router.post('/installments', authMiddleware, (req: Request, res: Response) => {
  try {
    const { totalAmount, cardBrand } = req.body;

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const maxInstallments = INSTALLMENT_LIMITS[cardBrand] || 12;
    const interestRate = INTEREST_RATES[cardBrand] || 0;

    const installments = calculateInstallments(totalAmount, maxInstallments, interestRate);

    res.json({
      totalAmount,
      cardBrand,
      maxInstallments,
      interestRate,
      options: installments,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/card/token
 * Gerar token do cartão
 */
router.post('/token', authMiddleware, (req: Request, res: Response) => {
  try {
    const { cardNumber, cardHolder, expiryDate, cvv } = req.body;

    const validation = validateCard({
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
    });

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Cartão inválido',
        errors: validation.errors,
      });
    }

    const token = generateCardToken({
      cardNumber,
      cardHolder,
      expiryDate,
      cvv,
    });

    res.json({
      success: true,
      token,
      brand: validation.brand,
      lastDigits: validation.lastDigits,
      masked: maskCardNumber(cardNumber),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/card/detect-brand
 * Detectar bandeira do cartão
 */
router.post('/detect-brand', (req: Request, res: Response) => {
  try {
    const { cardNumber } = req.body;

    if (!cardNumber) {
      return res.status(400).json({ error: 'Número do cartão é obrigatório' });
    }

    const brand = detectCardBrand(cardNumber);

    res.json({
      brand,
      maxInstallments: INSTALLMENT_LIMITS[brand] || 12,
      interestRate: INTEREST_RATES[brand] || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
