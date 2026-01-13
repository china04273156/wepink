import React, { useState, useEffect } from 'react';

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

interface ReviewsStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewsSectionProps {
  productId: string;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/${productId}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          ...newReview,
        }),
      });

      if (response.ok) {
        setNewReview({ rating: 5, title: '', comment: '' });
        fetchReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });
      fetchReviews();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando avaliações...</div>;
  }

  return (
    <div className="bg-white rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Avaliações dos Clientes</h2>

      {/* Estatísticas */}
      {stats && (
        <div className="mb-8 pb-8 border-b">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-4xl font-bold text-pink-600">{stats.averageRating}</div>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(stats.averageRating) ? '⭐' : '☆'}>
                    ★
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-2">{stats.totalReviews} avaliações</div>
            </div>

            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2 mb-2">
                  <span className="text-sm w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-600 h-2 rounded-full"
                      style={{
                        width: `${(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Formulário de nova avaliação */}
      <div className="mb-8 pb-8 border-b">
        <h3 className="text-lg font-semibold mb-4">Deixe sua avaliação</h3>
        <form onSubmit={handleSubmitReview}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Classificação</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating })}
                  className={`text-3xl ${newReview.rating >= rating ? 'text-pink-600' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              placeholder="Resumo da sua avaliação"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Comentário</label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Compartilhe sua experiência com este produto"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </form>
      </div>

      {/* Lista de avaliações */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Avaliações</h3>
        {reviews.length === 0 ? (
          <p className="text-gray-600">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-pink-600' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <h4 className="font-semibold mt-2">{review.title}</h4>
                  </div>
                  {review.verified && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Compra Verificada</span>}
                </div>
                <p className="text-gray-700 mb-2">{review.comment}</p>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
                  <button
                    onClick={() => handleMarkHelpful(review.id)}
                    className="text-pink-600 hover:underline"
                  >
                    Útil ({review.helpful})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
