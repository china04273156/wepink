import { Request, Response } from 'express';
import { getDatabase } from './db';
import { orders, transactions, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createTransaction } from './fastsoftbrasil';

export async function handleCheckout(req: Request, res: Response) {
  try {
    const { items, address, paymentMethod, installments } = req.body;
    const userId = (req as any).userId;

    // Validações
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    if (!address || !address.street || !address.number || !address.city || !address.state || !address.zipCode) {
      return res.status(400).json({ error: 'Endereço incompleto' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Método de pagamento não fornecido' });
    }

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Erro ao conectar ao banco de dados' });
    }

    // Calcular total
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const totalAmountCents = Math.round(totalAmount * 100);

    // Gerar número do pedido
    const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;

    console.log('Order details:', {
      orderNumber,
      totalAmount,
      totalAmountCents,
      paymentMethod,
    });

    // Criar pedido no banco de dados
    const orderResult = await (db as any).insert(orders).values({
      userId: userId,
      orderNumber,
      status: 'pending',
      totalAmount: totalAmount.toString(),
      shippingAddress: address,
      items: items,
      paymentMethod,
      paymentStatus: 'pending',
    });

    const orderId = (orderResult as any).insertId;

    console.log('Order created:', orderId, orderNumber);

    // Criar transação na FastSoft Brasil
    const transactionData = {
      amount: totalAmountCents,
      paymentMethod,
      installments: installments || 1,
      orderId,
      orderNumber,
      userId,
    };

    const transactionResult = await createTransaction(transactionData);

    if (!transactionResult.success) {
      return res.status(400).json({
        success: false,
        error: transactionResult.error || 'Erro ao processar pagamento',
      });
    }

    // Salvar transação no banco de dados
    await (db as any).insert(transactions).values({
      orderId: orderId,
      userId: userId,
      transactionId: transactionResult.data?.id || 'unknown',
      amount: totalAmount.toString(),
      status: transactionResult.data?.status || 'pending',
      paymentMethod,
      installments: installments || 1,
      responseData: transactionResult.data,
    });

    // Atualizar pedido com ID da transação
    await (db as any).update(orders)
      .set({ transactionId: transactionResult.data?.id })
      .where(eq(orders.id, orderId));

    return res.json({
      success: true,
      orderId,
      orderNumber,
      status: 'pending',
      message: 'Aguardando confirmação de pagamento',
      ...transactionResult.data,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar checkout',
      details: (error as any).message,
    });
  }
}
