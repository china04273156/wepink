import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, total, clearCart } = useCart();
  const cartItems = items; // Usar items do CartContext

  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO'>('PIX');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const [installments, setInstallments] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  // Permitir checkout sem autenticação

  // Redirecionar se carrinho está vazio
  React.useEffect(() => {
    if (items.length === 0 && !success) {
      setLocation('/');
    }
  }, [items, success, setLocation]);

  if (items.length === 0) {
    return null;
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar dados
      if (!shippingAddress.street || !shippingAddress.number || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
        throw new Error('Por favor, preencha todos os campos de endereço');
      }

      if (paymentMethod === 'CREDIT_CARD') {
        if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
          throw new Error('Por favor, preencha todos os dados do cartão');
        }
      }

      // Preparar dados do pedido
      const orderPayload = {
        userId: 1, // Usuário fictício
        items: items.map(item => ({
          productId: item.product.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount: total,
        shippingAddress,
        paymentMethod,
        cardData: paymentMethod === 'CREDIT_CARD' ? cardData : undefined,
        installments: paymentMethod === 'CREDIT_CARD' ? installments : 1,
      };

      // Enviar para servidor
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar pedido');
      }

      const data = await response.json();
      setOrderData(data);
      setSuccess(true);
      clearCart();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pedido');
    } finally {
      setLoading(false);
    }
  };

  if (success && orderData) {
    return (
      <div className="container py-10 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-900">Pedido Confirmado!</CardTitle>
                <CardDescription className="text-green-700">Número do pedido: {orderData.orderNumber}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentMethod === 'PIX' && orderData.pix && (
              <div className="bg-white p-6 rounded-lg border border-green-200">
                <h3 className="font-bold mb-4">Escaneie o QR Code para pagar com PIX</h3>
                <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg mb-4">
                  <img src={orderData.pix.qrCode} alt="QR Code PIX" className="w-full max-w-xs mx-auto" />
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Ou copie e cole este código:</p>
                  <code className="text-xs break-all">{orderData.pix.copyPaste}</code>
                </div>
              </div>
            )}

            {paymentMethod === 'BOLETO' && orderData.boleto && (
              <div className="bg-white p-6 rounded-lg border border-green-200">
                <h3 className="font-bold mb-4">Código de Barras do Boleto</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm break-all">{orderData.boleto.barcode}</code>
                </div>
                <p className="text-sm text-gray-600 mt-4">Vencimento: {orderData.boleto.dueDate}</p>
              </div>
            )}

            {paymentMethod === 'CREDIT_CARD' && (
              <div className="bg-white p-6 rounded-lg border border-green-200">
                <h3 className="font-bold mb-2">Pagamento Aprovado</h3>
                <p className="text-sm text-gray-600">Cartão final em: ****{cardData.cardNumber.slice(-4)}</p>
                <p className="text-sm text-gray-600">Parcelamento: {installments}x</p>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg border border-green-200">
              <h3 className="font-bold mb-4">Resumo do Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {(total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>Grátis</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>R$ {(total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setLocation('/')}
              className="w-full"
            >
              Continuar Comprando
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      name="street"
                      value={shippingAddress.street}
                      onChange={handleAddressChange}
                      placeholder="Rua A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      name="number"
                      value={shippingAddress.number}
                      onChange={handleAddressChange}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    name="complement"
                    value={shippingAddress.complement}
                    onChange={handleAddressChange}
                    placeholder="Apto 101"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      placeholder="São Paulo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      placeholder="SP"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleAddressChange}
                    placeholder="01234-567"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Método de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value="PIX" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer">PIX (Instantâneo)</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value="CREDIT_CARD" id="card" />
                    <Label htmlFor="card" className="cursor-pointer">Cartão de Crédito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BOLETO" id="boleto" />
                    <Label htmlFor="boleto" className="cursor-pointer">Boleto Bancário</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Dados do Cartão */}
            {paymentMethod === 'CREDIT_CARD' && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Cartão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      value={cardData.cardNumber}
                      onChange={handleCardChange}
                      placeholder="4111 1111 1111 1111"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardHolder">Titular do Cartão</Label>
                    <Input
                      id="cardHolder"
                      name="cardHolder"
                      value={cardData.cardHolder}
                      onChange={handleCardChange}
                      placeholder="João Silva"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Validade</Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        value={cardData.expiryDate}
                        onChange={handleCardChange}
                        placeholder="12/25"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        name="cvv"
                        value={cardData.cvv}
                        onChange={handleCardChange}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="installments">Parcelamento</Label>
                    <Select value={installments.toString()} onValueChange={(value) => setInstallments(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}x sem juros
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 text-lg font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Compra'
              )}
            </Button>
          </form>
        </div>

        {/* Resumo */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map(item => {
                  const price = item.product.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || item.product.price || 0;
                  return (
                    <div key={item.product.productId} className="text-sm flex justify-between">
                      <span>{item.product.productName} x{item.quantity}</span>
                      <span>R$ {((price * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {(total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frete:</span>
                  <span className="text-green-600">Grátis</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>R$ {(total / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
