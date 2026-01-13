import React, { useState, useEffect } from 'react';

interface ShippingOption {
  method: string;
  cost: number;
  estimatedDays: string;
  isFree: boolean;
  available?: boolean;
}

interface ShippingCalculatorProps {
  cartTotal: number;
  onShippingSelected: (cost: number, method: string) => void;
}

export default function ShippingCalculator({ cartTotal, onShippingSelected }: ShippingCalculatorProps) {
  const [zipCode, setZipCode] = useState('');
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [shippingConfig, setShippingConfig] = useState<any>(null);

  useEffect(() => {
    fetchShippingConfig();
  }, []);

  const fetchShippingConfig = async () => {
    try {
      const response = await fetch('/api/shipping/config');
      const data = await response.json();
      if (data.success) {
        setShippingConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching shipping config:', error);
    }
  };

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipCode,
          cartTotal,
          weight: 1,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const shippingOptions: ShippingOption[] = [
          {
            method: data.shipping.method || 'Standard',
            cost: data.shipping.cost,
            estimatedDays: `${data.shipping.estimatedDays}`,
            isFree: data.shipping.isFree,
          },
        ];

        setOptions(shippingOptions);
        setSelectedMethod(data.shipping.method || 'Standard');
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMethod = (method: string, cost: number) => {
    setSelectedMethod(method);
    onShippingSelected(cost, method);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h3 className="font-semibold mb-3">Cálculo de Frete</h3>

      {shippingConfig && cartTotal >= parseFloat(shippingConfig.freeShippingMinAmount) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <p className="text-green-700 text-sm">
            ✓ Você tem frete grátis! (Compras acima de R$ {shippingConfig.freeShippingMinAmount})
          </p>
        </div>
      )}

      <form onSubmit={handleCalculateShipping} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Digite seu CEP"
            maxLength="8"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || zipCode.length < 8}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? 'Calculando...' : 'Calcular'}
          </button>
        </div>
      </form>

      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((option) => (
            <div
              key={option.method}
              onClick={() => handleSelectMethod(option.method, option.cost)}
              className={`p-3 border rounded-lg cursor-pointer transition ${
                selectedMethod === option.method
                  ? 'border-pink-600 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{option.method}</p>
                  <p className="text-sm text-gray-600">Entrega em {option.estimatedDays} dias</p>
                </div>
                <div className="text-right">
                  {option.isFree ? (
                    <p className="text-lg font-bold text-green-600">Grátis</p>
                  ) : (
                    <p className="text-lg font-bold text-gray-800">R$ {option.cost.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
