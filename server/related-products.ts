import { Request, Response } from 'express';
import { getDatabase } from './db';

export async function getRelatedProducts(req: Request, res: Response) {
  try {
    const { productId, limit = 4 } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Buscar produtos relacionados
    const relatedData = await (db as any).query.relatedProducts.findMany({
      where: (related: any, { eq }: any) => eq(related.productId, productId),
      limit: parseInt(limit as string),
    });

    if (relatedData.length === 0) {
      // Se não houver produtos relacionados, retornar produtos similares por categoria
      return res.json({
        success: true,
        products: [],
        message: 'No related products found',
      });
    }

    return res.json({
      success: true,
      products: relatedData,
    });
  } catch (error) {
    console.error('Get related products error:', error);
    return res.status(500).json({ error: 'Failed to get related products' });
  }
}

export async function addRelatedProduct(req: Request, res: Response) {
  try {
    const { productId, relatedProductId, relationshipType } = req.body;

    if (!productId || !relatedProductId || !relationshipType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Criar relação
    const result = await (db as any).insert((db as any).relatedProducts).values({
      productId,
      relatedProductId,
      relationshipType,
    });

    return res.json({
      success: true,
      message: 'Related product added successfully',
      relationId: (result as any).insertId,
    });
  } catch (error) {
    console.error('Add related product error:', error);
    return res.status(500).json({ error: 'Failed to add related product' });
  }
}

export async function removeRelatedProduct(req: Request, res: Response) {
  try {
    const { relationId } = req.params;

    const db = await getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Remover relação
    await (db as any).delete((db as any).relatedProducts)
      .where((db as any).eq((db as any).relatedProducts.id, parseInt(relationId)));

    return res.json({
      success: true,
      message: 'Related product removed successfully',
    });
  } catch (error) {
    console.error('Remove related product error:', error);
    return res.status(500).json({ error: 'Failed to remove related product' });
  }
}
