import { Request, Response } from 'express';
import { getDatabase } from './db';

export async function calculateShipping(req: Request, res: Response) {
  try {
    const { zipCode, cartTotal, weight = 1 } = req.body;

    if (!zipCode) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Verificar frete grátis
    const shippingConfigResult = await (db as any).query.shippingConfig.findFirst({
      where: (config: any, { eq }: any) => eq(config.active, true),
    });

    if (shippingConfigResult && cartTotal >= parseFloat(shippingConfigResult.freeShippingMinAmount as any)) {
      return res.json({
        success: true,
        shipping: {
          cost: 0,
          estimatedDays: 5,
          isFree: true,
          reason: `Free shipping on purchases over R$ ${shippingConfigResult.freeShippingMinAmount}`,
        },
      });
    }

    // Buscar taxa de frete baseado no CEP
    const zipCodeNum = zipCode.replace(/\D/g, '');
    const shippingRate = await (db as any).query.shippingRates.findFirst({
      where: (rates: any, { lte, gte, and }: any) => {
        // Simplificado: buscar por estado (últimos 2 dígitos do CEP)
        const state = zipCodeNum.substring(0, 2);
        return eq(rates.state, state);
      },
    });

    if (!shippingRate) {
      // Frete padrão
      const defaultCost = 15 + (weight * 2);
      return res.json({
        success: true,
        shipping: {
          cost: defaultCost,
          estimatedDays: 7,
          isFree: false,
          method: 'Standard',
        },
      });
    }

    // Calcular frete
    const shippingCost = parseFloat(shippingRate.baseCost as any) + (weight * parseFloat(shippingRate.costPerKg as any));

    return res.json({
      success: true,
      shipping: {
        cost: shippingCost,
        estimatedDays: shippingRate.estimatedDays,
        isFree: false,
        region: shippingRate.region,
      },
    });
  } catch (error) {
    console.error('Calculate shipping error:', error);
    return res.status(500).json({ error: 'Failed to calculate shipping' });
  }
}

export async function getShippingOptions(req: Request, res: Response) {
  try {
    const { zipCode, cartTotal } = req.body;

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Opções de frete
    const options = [
      {
        method: 'Standard',
        cost: 15,
        estimatedDays: '7-10',
        isFree: cartTotal >= 100,
      },
      {
        method: 'Express',
        cost: 25,
        estimatedDays: '3-5',
        isFree: false,
      },
      {
        method: 'Same Day',
        cost: 50,
        estimatedDays: '1',
        isFree: false,
        available: false, // Apenas em São Paulo
      },
    ];

    return res.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error('Get shipping options error:', error);
    return res.status(500).json({ error: 'Failed to get shipping options' });
  }
}

export async function getShippingConfig(req: Request, res: Response) {
  try {
    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const config = await (db as any).query.shippingConfig.findFirst({
      where: (config: any, { eq }: any) => eq(config.active, true),
    });

    return res.json({
      success: true,
      config: config || {
        freeShippingMinAmount: 100,
        message: 'Free shipping on purchases over R$ 100',
      },
    });
  } catch (error) {
    console.error('Get shipping config error:', error);
    return res.status(500).json({ error: 'Failed to get shipping config' });
  }
}
