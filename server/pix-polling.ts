import { getDatabase } from './db';
import { orders, transactions } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { getTransactionStatus } from './fastsoftbrasil';
import { sendEmail, getPaymentConfirmationEmail } from './email';
import { users } from '../shared/schema';

// Intervalo de polling em milissegundos (30 segundos)
const POLLING_INTERVAL = 30 * 1000;

// Máximo de tentativas de polling (30 minutos / 30 segundos = 60 tentativas)
const MAX_POLLING_ATTEMPTS = 60;

interface PixPollingTask {
  orderId: number;
  transactionId: string;
  attempts: number;
}

const activePollingTasks = new Map<number, PixPollingTask>();

export async function startPixPolling() {
  console.log('Starting PIX polling service...');

  // Buscar todas as transações pendentes
  const db = await getDatabase();

  const pendingTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.status, 'pending'));

  console.log(`Found ${pendingTransactions.length} pending transactions`);

  // Iniciar polling para cada transação
  for (const transaction of pendingTransactions) {
    startPollingForTransaction(transaction.orderId, transaction.transactionId);
  }

  // Verificar periodicamente se há novas transações pendentes
  setInterval(async () => {
    const db = await getDatabase();
    const pending = await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, 'pending'));

    for (const transaction of pending) {
      if (!activePollingTasks.has(transaction.orderId)) {
        console.log(`Starting polling for new transaction: ${transaction.transactionId}`);
        startPollingForTransaction(transaction.orderId, transaction.transactionId);
      }
    }
  }, POLLING_INTERVAL);
}

function startPollingForTransaction(orderId: number, transactionId: string) {
  if (activePollingTasks.has(orderId)) {
    console.log(`Polling already active for order ${orderId}`);
    return;
  }

  const task: PixPollingTask = {
    orderId,
    transactionId,
    attempts: 0,
  };

  activePollingTasks.set(orderId, task);

  console.log(`Starting polling for transaction: ${transactionId}`);

  const pollInterval = setInterval(async () => {
    try {
      task.attempts++;

      console.log(`Polling attempt ${task.attempts} for transaction ${transactionId}`);

      // Buscar status da transação
      const transactionStatus = await getTransactionStatus(transactionId);

      console.log(`Transaction status: ${transactionStatus.status}`);

      if (transactionStatus.status === 'approved') {
        console.log(`Transaction approved: ${transactionId}`);

        // Atualizar banco de dados
        const db = await getDatabase();

        // Atualizar transação
        await db
          .update(transactions)
          .set({
            status: 'approved',
            responseData: JSON.stringify(transactionStatus),
          })
          .where(eq(transactions.transactionId, transactionId));

        // Atualizar pedido
        await db
          .update(orders)
          .set({
            paymentStatus: 'approved',
            status: 'processing',
          })
          .where(eq(orders.id, orderId));

        // Enviar email de confirmação
        const orderResult = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId));

        if (orderResult.length > 0) {
          const order = orderResult[0];
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, order.userId));

          if (userResult.length > 0) {
            const user = userResult[0];
            const email = getPaymentConfirmationEmail({
              orderNumber: order.orderNumber,
              customerName: user.name,
              totalAmount: order.totalAmount,
              paymentMethod: order.paymentMethod,
              transactionId: transactionStatus.id,
            });

            await sendEmail({
              to: user.email,
              subject: `Pagamento Confirmado - Pedido ${order.orderNumber}`,
              html: email,
            });
          }
        }

        // Parar polling
        clearInterval(pollInterval);
        activePollingTasks.delete(orderId);
      } else if (transactionStatus.status === 'declined') {
        console.log(`Transaction declined: ${transactionId}`);

        // Atualizar banco de dados
        const db = await getDatabase();

        await db
          .update(transactions)
          .set({
            status: 'declined',
            responseData: JSON.stringify(transactionStatus),
          })
          .where(eq(transactions.transactionId, transactionId));

        await db
          .update(orders)
          .set({
            paymentStatus: 'declined',
            status: 'cancelled',
          })
          .where(eq(orders.id, orderId));

        // Parar polling
        clearInterval(pollInterval);
        activePollingTasks.delete(orderId);
      } else if (task.attempts >= MAX_POLLING_ATTEMPTS) {
        console.log(`Max polling attempts reached for transaction: ${transactionId}`);

        // Parar polling
        clearInterval(pollInterval);
        activePollingTasks.delete(orderId);
      }
    } catch (error: any) {
      console.error(`Error polling transaction ${transactionId}:`, error.message);

      if (task.attempts >= MAX_POLLING_ATTEMPTS) {
        console.log(`Max polling attempts reached for transaction: ${transactionId}`);
        clearInterval(pollInterval);
        activePollingTasks.delete(orderId);
      }
    }
  }, POLLING_INTERVAL);
}

export function stopPixPolling(orderId: number) {
  if (activePollingTasks.has(orderId)) {
    console.log(`Stopping polling for order ${orderId}`);
    activePollingTasks.delete(orderId);
  }
}

export function getPollingStatus() {
  return {
    activePollingTasks: Array.from(activePollingTasks.entries()).map(([orderId, task]) => ({
      orderId,
      transactionId: task.transactionId,
      attempts: task.attempts,
      maxAttempts: MAX_POLLING_ATTEMPTS,
    })),
  };
}
