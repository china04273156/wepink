import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDatabase } from './db';
import { orders, transactions } from '../shared/schema';
import { eq } from 'drizzle-orm';
import {
  sendEmail,
  getPaymentConfirmationEmail,
  getPixPendingEmail,
  getBoletoPendingEmail,
} from './email';

const WEBHOOK_SECRET = process.env.FASTSOFTBRASIL_WEBHOOK_SECRET || 'webhook_secret_key';

interface WebhookPayload {
  event: string;
  data: {
    id: string;
    status: 'approved' | 'declined' | 'pending' | 'processing' | 'refunded';
    amount: number;
    payment_method: string;
    order_id: string;
    customer_id: string;
    customer_email?: string;
    transaction_id: string;
    authorization_code?: string;
    pix_qr_code?: string;
    pix_copy_paste?: string;
    boleto_barcode?: string;
    boleto_url?: string;
    message?: string;
    created_at: string;
    [key: string]: any;
  };
}

// Verificar assinatura do webhook
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

// Processar webhook de transação
export async function handleTransactionWebhook(req: Request, res: Response, next: any) {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verificar assinatura
    if (!verifyWebhookSignature(payload, signature)) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const webhook: WebhookPayload = req.body;

    console.log('Webhook received:', {
      event: webhook.event,
      status: webhook.data.status,
      orderId: webhook.data.order_id,
    });

    const db = await getDatabase();

    // Encontrar o pedido
    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, webhook.data.order_id));

    if (orderResult.length === 0) {
      console.warn('Order not found:', webhook.data.order_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult[0];

    // Atualizar transação
    const transactionResult = await db
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, webhook.data.transaction_id));

    if (transactionResult.length > 0) {
      await db
        .update(transactions)
        .set({
          status: webhook.data.status,
          responseData: JSON.stringify(webhook.data),
        })
        .where(eq(transactions.id, transactionResult[0].id));
    }

    // Processar baseado no status
    if (webhook.data.status === 'approved') {
      await handlePaymentApproved(db, order, webhook.data);
    } else if (webhook.data.status === 'declined') {
      await handlePaymentDeclined(db, order, webhook.data);
    } else if (webhook.data.status === 'pending') {
      await handlePaymentPending(db, order, webhook.data);
    } else if (webhook.data.status === 'refunded') {
      await handlePaymentRefunded(db, order, webhook.data);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    next(error);
  }
}

// Pagamento aprovado
async function handlePaymentApproved(
  db: any,
  order: any,
  data: WebhookPayload['data']
): Promise<void> {
  console.log('Processing approved payment:', order.orderNumber);

  // Atualizar status do pedido
  await db
    .update(orders)
    .set({
      paymentStatus: 'approved',
      status: 'processing',
    })
    .where(eq(orders.id, order.id));

  // Enviar email de confirmação
  if (order.userId) {
    const user = await db.select().from('users').where(eq('id', order.userId));

    if (user.length > 0) {
      const email = getPaymentConfirmationEmail({
        orderNumber: order.orderNumber,
        customerName: user[0].name,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        transactionId: data.transaction_id,
      });

      await sendEmail({
        to: user[0].email,
        subject: `Pagamento Confirmado - Pedido ${order.orderNumber}`,
        html: email,
      });
    }
  }
}

// Pagamento recusado
async function handlePaymentDeclined(
  db: any,
  order: any,
  data: WebhookPayload['data']
): Promise<void> {
  console.log('Processing declined payment:', order.orderNumber);

  // Atualizar status do pedido
  await db
    .update(orders)
    .set({
      paymentStatus: 'declined',
      status: 'cancelled',
    })
    .where(eq(orders.id, order.id));

  // Enviar email de falha
  if (order.userId) {
    const user = await db.select().from('users').where(eq('id', order.userId));

    if (user.length > 0) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px; }
              .content { padding: 20px; background-color: #f9fafb; margin-top: 20px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Pagamento Recusado ❌</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${user[0].name}</strong>,</p>
                <p>Infelizmente seu pagamento foi recusado.</p>
                <p><strong>Motivo:</strong> ${data.message || 'Não especificado'}</p>
                <p>Por favor, tente novamente com outro método de pagamento.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail({
        to: user[0].email,
        subject: `Pagamento Recusado - Pedido ${order.orderNumber}`,
        html,
      });
    }
  }
}

// Pagamento pendente (PIX ou Boleto)
async function handlePaymentPending(
  db: any,
  order: any,
  data: WebhookPayload['data']
): Promise<void> {
  console.log('Processing pending payment:', order.orderNumber);

  // Atualizar status do pedido
  await db
    .update(orders)
    .set({
      paymentStatus: 'pending',
      status: 'awaiting_payment',
    })
    .where(eq(orders.id, order.id));

  // Enviar email com instruções de pagamento
  if (order.userId) {
    const user = await db.select().from('users').where(eq('id', order.userId));

    if (user.length > 0) {
      let email: string;

      if (order.paymentMethod === 'pix') {
        email = getPixPendingEmail({
          orderNumber: order.orderNumber,
          customerName: user[0].name,
          totalAmount: order.totalAmount,
          qrCode: data.pix_qr_code || '',
          copyPaste: data.pix_copy_paste || '',
        });
      } else if (order.paymentMethod === 'boleto') {
        email = getBoletoPendingEmail({
          orderNumber: order.orderNumber,
          customerName: user[0].name,
          totalAmount: order.totalAmount,
          barcode: data.boleto_barcode || '',
          boletoUrl: data.boleto_url,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        });
      } else {
        return;
      }

      await sendEmail({
        to: user[0].email,
        subject: `Instruções de Pagamento - Pedido ${order.orderNumber}`,
        html: email,
      });
    }
  }
}

// Pagamento reembolsado
async function handlePaymentRefunded(
  db: any,
  order: any,
  data: WebhookPayload['data']
): Promise<void> {
  console.log('Processing refunded payment:', order.orderNumber);

  // Atualizar status do pedido
  await db
    .update(orders)
    .set({
      paymentStatus: 'refunded',
      status: 'refunded',
    })
    .where(eq(orders.id, order.id));

  // Enviar email de reembolso
  if (order.userId) {
    const user = await db.select().from('users').where(eq('id', order.userId));

    if (user.length > 0) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 5px; }
              .content { padding: 20px; background-color: #f9fafb; margin-top: 20px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Reembolso Processado 💰</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${user[0].name}</strong>,</p>
                <p>Seu reembolso foi processado com sucesso!</p>
                <p><strong>Valor:</strong> R$ ${(data.amount / 100).toFixed(2)}</p>
                <p><strong>Pedido:</strong> ${order.orderNumber}</p>
                <p>O valor será creditado em sua conta em até 5 dias úteis.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail({
        to: user[0].email,
        subject: `Reembolso Processado - Pedido ${order.orderNumber}`,
        html,
      });
    }
  }
}

// Registrar webhook (para debug)
export async function registerWebhook(req: Request, res: Response, next: any) {
  try {
    const { url, events } = req.body;

    if (!url || !events) {
      return res.status(400).json({ error: 'URL and events are required' });
    }

    console.log('Registering webhook:', { url, events });

    // Aqui você registraria o webhook na FastSoft Brasil
    // Por enquanto, apenas retornamos sucesso

    res.json({
      success: true,
      message: 'Webhook registered',
      webhook: {
        url,
        events,
        id: `webhook_${Date.now()}`,
      },
    });
  } catch (error: any) {
    next(error);
  }
}

// Testar webhook
export async function testWebhook(req: Request, res: Response, next: any) {
  try {
    const testPayload: WebhookPayload = {
      event: 'transaction.completed',
      data: {
        id: 'test_transaction_123',
        status: 'approved',
        amount: 9990,
        payment_method: 'credit_card',
        order_id: 'ORD-TEST-123',
        customer_id: 'user_123',
        transaction_id: 'txn_test_123',
        authorization_code: 'AUTH123',
        created_at: new Date().toISOString(),
      },
    };

    const payload = JSON.stringify(testPayload);
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    console.log('Test webhook payload:', testPayload);
    console.log('Test webhook signature:', signature);

    res.json({
      success: true,
      message: 'Test webhook created',
      payload: testPayload,
      signature,
    });
  } catch (error: any) {
    next(error);
  }
}
