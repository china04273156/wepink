import { Request, Response } from 'express';
import { getDatabase } from './db';

export async function validateCoupon(req: Request, res: Response) {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Buscar cupom
    const couponResult = await (db as any).query.coupons.findFirst({
      where: (coupons: any, { eq, and }: any) => 
        and(
          eq(coupons.code, code.toUpperCase()),
          eq(coupons.active, true)
        ),
    });

    if (!couponResult) {
      return res.status(404).json({ error: 'Coupon not found or inactive' });
    }

    // Verificar se expirou
    if (couponResult.expiresAt && new Date(couponResult.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    // Verificar limite de uso
    if (couponResult.maxUses && couponResult.usedCount >= couponResult.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    // Verificar valor mínimo
    if (cartTotal < parseFloat(couponResult.minAmount || '0')) {
      return res.status(400).json({ 
        error: `Minimum purchase amount is R$ ${couponResult.minAmount}` 
      });
    }

    // Calcular desconto
    let discount = 0;
    if (couponResult.discountType === 'percentage') {
      discount = (cartTotal * parseFloat(couponResult.discountValue as any)) / 100;
    } else {
      discount = parseFloat(couponResult.discountValue as any);
    }

    const finalTotal = Math.max(0, cartTotal - discount);

    return res.json({
      success: true,
      coupon: {
        code: couponResult.code,
        description: couponResult.description,
        discountType: couponResult.discountType,
        discountValue: couponResult.discountValue,
        discount,
        finalTotal,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
}

export async function applyCoupon(req: Request, res: Response) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Buscar cupom
    const couponResult = await (db as any).query.coupons.findFirst({
      where: (coupons: any, { eq }: any) => eq(coupons.code, code.toUpperCase()),
    });

    if (!couponResult) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Incrementar uso
    await (db as any).update((db as any).coupons)
      .set({ usedCount: (db as any).sql`usedCount + 1` })
      .where((db as any).eq((db as any).coupons.id, couponResult.id));

    return res.json({
      success: true,
      message: 'Coupon applied successfully',
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    return res.status(500).json({ error: 'Failed to apply coupon' });
  }
}

export async function listCoupons(req: Request, res: Response) {
  try {
    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Buscar cupons ativos
    const couponsData = await (db as any).query.coupons.findMany({
      where: (coupons: any, { eq }: any) => eq(coupons.active, true),
      orderBy: (coupons: any, { desc }: any) => desc(coupons.createdAt),
    });

    return res.json({
      success: true,
      coupons: couponsData,
    });
  } catch (error) {
    console.error('List coupons error:', error);
    return res.status(500).json({ error: 'Failed to list coupons' });
  }
}
