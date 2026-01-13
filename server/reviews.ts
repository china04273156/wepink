import { Request, Response } from 'express';
import { getDatabase } from './db';

export async function getProductReviews(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Buscar avaliações do produto
    const reviewsData = await (db as any).query.reviews.findMany({
      where: (reviews: any, { eq }: any) => eq(reviews.productId, productId),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      orderBy: (reviews: any, { desc }: any) => desc(reviews.createdAt),
    });

    // Calcular estatísticas
    const allReviews = await (db as any).query.reviews.findMany({
      where: (reviews: any, { eq }: any) => eq(reviews.productId, productId),
    });

    const stats = {
      totalReviews: allReviews.length,
      averageRating: allReviews.length > 0 
        ? (allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : 0,
      ratingDistribution: {
        5: allReviews.filter((r: any) => r.rating === 5).length,
        4: allReviews.filter((r: any) => r.rating === 4).length,
        3: allReviews.filter((r: any) => r.rating === 3).length,
        2: allReviews.filter((r: any) => r.rating === 2).length,
        1: allReviews.filter((r: any) => r.rating === 1).length,
      },
    };

    return res.json({
      success: true,
      reviews: reviewsData,
      stats,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ error: 'Failed to get reviews' });
  }
}

export async function createReview(req: Request, res: Response) {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = (req as any).userId;

    if (!productId || !rating || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Criar avaliação
    const result = await (db as any).insert((db as any).reviews).values({
      productId,
      userId,
      rating,
      title,
      comment: comment || '',
      verified: true, // Você pode verificar se o usuário comprou o produto
    });

    return res.json({
      success: true,
      message: 'Review created successfully',
      reviewId: (result as any).insertId,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ error: 'Failed to create review' });
  }
}

export async function updateReviewHelpful(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Incrementar contador de útil
    await (db as any).update((db as any).reviews)
      .set({ helpful: (db as any).sql`helpful + 1` })
      .where((db as any).eq((db as any).reviews.id, parseInt(reviewId)));

    return res.json({
      success: true,
      message: 'Review marked as helpful',
    });
  } catch (error) {
    console.error('Update review error:', error);
    return res.status(500).json({ error: 'Failed to update review' });
  }
}
