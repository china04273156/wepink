import express, { Request, Response } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { getDatabase, initializeDatabase } from './db';
import { authMiddleware, errorHandler } from './middleware';
import { registerUser, loginUser, generateToken, getUserById } from './auth';
import { getProductsOptimized, getProductByIdOptimized, getCategoriesOptimized, searchProductsOptimized, getCacheStats, clearCache } from './products-optimized';
import { createTransaction, getTransactionStatus } from './fastsoftbrasil';
import { cartItems, orders, transactions, addresses } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(compression({ level: 9 })); // Máxima compressão
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Inicializar banco de dados
  try {
    await initializeDatabase();
    await getDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }

  // ==================== ROTAS DE AUTENTICAÇÃO ====================

  app.post('/api/auth/register', async (req: Request, res: Response, next) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await registerUser(email, password, name);
      const token = generateToken(user);

      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await loginUser(email, password);
      const token = generateToken(user);

      res.json({ user, token });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  // ==================== ROTAS DE PRODUTOS (OTIMIZADAS) ====================

  // Listar produtos com cache agressivo
  app.get('/api/products', async (req: Request, res: Response, next) => {
    try {
      const from = parseInt(req.query.from as string) || 0;
      const to = parseInt(req.query.to as string) || 49;
      const category = req.query.category as string;

      // Cache de 10 minutos
      res.set('Cache-Control', 'public, max-age=600');

      const products = await getProductsOptimized(from, to, category);
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  // Buscar um produto específico
  app.get('/api/products/:id', async (req: Request, res: Response, next) => {
    try {
      // Cache de 10 minutos
      res.set('Cache-Control', 'public, max-age=600');

      const product = await getProductByIdOptimized(req.params.id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  // Buscar produtos
  app.get('/api/products/search/:term', async (req: Request, res: Response, next) => {
    try {
      // Cache de 5 minutos para buscas
      res.set('Cache-Control', 'public, max-age=300');

      const products = await searchProductsOptimized(req.params.term);
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  // Listar categorias
  app.get('/api/categories', async (req: Request, res: Response, next) => {
    try {
      // Cache de 1 hora para categorias
      res.set('Cache-Control', 'public, max-age=3600');

      const categories = await getCategoriesOptimized();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  // Status do cache (apenas admin)
  app.get('/api/cache/stats', async (req: Request, res: Response) => {
    const stats = getCacheStats();
    res.json(stats);
  });

  // Limpar cache (apenas admin)
  app.post('/api/cache/clear', async (req: Request, res: Response) => {
    clearCache();
    res.json({ message: 'Cache cleared' });
  });

  // ==================== ROTAS DE CARRINHO ====================

  app.post('/api/cart', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      const { productId, skuId, quantity, price, productData } = req.body;

      const result = await db.insert(cartItems).values({
        userId: req.user!.id,
        productId,
        skuId,
        quantity,
        price,
        productData,
      });

      res.json({ id: result[0].insertId, ...req.body });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/cart', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      const items = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.userId, req.user!.id));

      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/cart/:id', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, parseInt(req.params.id)), eq(cartItems.userId, req.user!.id)));

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/cart/clear', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      await db.delete(cartItems).where(eq(cartItems.userId, req.user!.id));

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ==================== ROTAS DE ENDEREÇO ====================

  app.post('/api/addresses', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      const { street, number, complement, city, state, zipCode, isDefault } = req.body;

      const result = await db.insert(addresses).values({
        userId: req.user!.id,
        street,
        number,
        complement,
        city,
        state,
        zipCode,
        isDefault,
      });

      res.json({ id: result[0].insertId, ...req.body });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/addresses', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      const userAddresses = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, req.user!.id));

      res.json(userAddresses);
    } catch (error) {
      next(error);
    }
  });

  // ==================== ROTAS DE PAGAMENTO ====================

  app.post('/api/checkout', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      const {
        items,
        shippingAddress,
        paymentMethod,
        cardData,
        pixData,
        installments = 1,
      } = req.body;

      const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

      const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;
      const orderResult = await db.insert(orders).values({
        userId: req.user!.id,
        orderNumber,
        status: 'pending',
        totalAmount,
        shippingAddress,
        items,
        paymentMethod,
        paymentStatus: 'pending',
      });

      const orderId = orderResult[0].insertId;

      try {
        const transactionResponse = await createTransaction({
          amount: totalAmount,
          installments,
          paymentMethod: paymentMethod as any,
          description: `Pedido ${orderNumber}`,
          customerId: `user_${req.user!.id}`,
          orderId: orderNumber,
          cardData,
          pixData,
        });

        await db.insert(transactions).values({
          orderId,
          userId: req.user!.id,
          transactionId: transactionResponse.id,
          amount: totalAmount,
          status: transactionResponse.status,
          paymentMethod,
          installments,
          responseData: transactionResponse,
        });

        if (transactionResponse.status === 'approved') {
          await db
            .update(orders)
            .set({ paymentStatus: 'approved', status: 'processing' })
            .where(eq(orders.id, orderId));

          await db.delete(cartItems).where(eq(cartItems.userId, req.user!.id));
        } else if (transactionResponse.status === 'declined') {
          await db
            .update(orders)
            .set({ paymentStatus: 'declined', status: 'cancelled' })
            .where(eq(orders.id, orderId));
        }

        res.json({
          orderId,
          orderNumber,
          status: transactionResponse.status,
          transaction: transactionResponse,
        });
      } catch (paymentError: any) {
        await db
          .update(orders)
          .set({ paymentStatus: 'declined', status: 'cancelled' })
          .where(eq(orders.id, orderId));

        throw paymentError;
      }
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/orders', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, req.user!.id));

      res.json(userOrders);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/orders/:id', authMiddleware, async (req: Request, res: Response, next) => {
    try {
      const db = await getDatabase();
      const order = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, parseInt(req.params.id)), eq(orders.userId, req.user!.id)));

      if (order.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order[0]);
    } catch (error) {
      next(error);
    }
  });

  // ==================== SERVE STATIC FILES ====================

  const staticPath =
    process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, 'public')
      : path.resolve(__dirname, '..', 'dist', 'public');

  app.use(express.static(staticPath, {
    maxAge: '1d', // Cache de 1 dia para assets
    etag: false,
  }));

  // Handle client-side routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // Error handler
  app.use(errorHandler);

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`✅ Optimized server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
