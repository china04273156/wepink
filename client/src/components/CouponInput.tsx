import React, { useState } from 'react';

interface CouponInputProps {
  cartTotal: number;
  onCouponApplied: (discount: number, finalTotal: number) => void;
}

export default function CouponInput({ cartTotal, onCouponApplied }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          cartTotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Cupom inválido');
        return;
      }

      setAppliedCoupon(data.coupon);
      setSuccess(`Cupom aplicado! Desconto de R$ ${data.coupon.discount.toFixed(2)}`);
      onCouponApplied(data.coupon.discount, data.coupon.finalTotal);

      // Aplicar cupom no servidor
      await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      setCode('');
    } catch (err) {
      setError('Erro ao validar cupom');
      console.error('Error applying coupon:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h3 className="font-semibold mb-3">Cupom de Desconto</h3>

      {appliedCoupon ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
              <p className="text-sm text-green-700">{appliedCoupon.description}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">-R$ {appliedCoupon.discount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite o código do cupom"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !code}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Aplicar'}
          </button>
        </form>
      )}

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
    </div>
  );
}
