import { Router, Request, Response } from 'express';
import { authMiddleware } from './middleware';
import { handleCheckout, getOrderStatus } from './checkout';
import { handleTransactionWebhook, registerWebhook, testWebhook } from './webhooks';
import { sendEmail, getOrderConfirmationEmail } from './email';
import { getDatabase } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// ==================== CHECKOUT ====================
router.post('/checkout', authMiddleware, handleCheckout);
router.get('/orders/:id', authMiddleware, getOrderStatus);

// ==================== WEBHOOKS ====================

// Webhook para transações (POST)
router.post('/webhooks/transactions', handleTransactionWebhook);

// Registrar webhook (POST)
router.post('/webhooks/register', registerWebhook);

// Testar webhook (GET)
router.get('/webhooks/test', testWebhook);

// ==================== EMAIL ====================

// Enviar email de teste
router.post('/email/test', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const { to, subject } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const html = `
      <h1>Email de Teste</h1>
      <p>Este é um email de teste do WePink Store.</p>
      <p>Se você recebeu este email, o sistema de notificações está funcionando corretamente!</p>
    `;

    const success = await sendEmail({
      to,
      subject: subject || 'Email de Teste - WePink Store',
      html,
    });

    if (success) {
      res.json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error: any) {
    next(error);
  }
});

// Reenviar email de confirmação de pedido
router.post('/email/resend-order-confirmation/:orderId', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const db = await getDatabase();
    const userId = (req as any).user?.id;

    // Buscar pedido
    const orderResult = await db
      .select()
      .from('orders')
      .where(eq('userId', userId));

    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult[0];

    // Buscar usuário
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Preparar dados do email
    const items = JSON.parse(order.items);
    const address = JSON.parse(order.shippingAddress);

    const email = getOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName: user.name,
      items,
      totalAmount: order.totalAmount,
      shippingAddress: address,
    });

    const success = await sendEmail({
      to: user.email,
      subject: `Confirmação de Pedido - ${order.orderNumber}`,
      html: email,
    });

    if (success) {
      res.json({ success: true, message: 'Email resent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to resend email' });
    }
  } catch (error: any) {
    next(error);
  }
});

export default router;
