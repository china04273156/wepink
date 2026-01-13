import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Smartphone, Banknote } from "lucide-react";

export default function CheckoutPageNew() {
  const { items, total } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");

  // Dados do endereço
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Dados do cartão
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });

  const [installments, setInstallments] = useState(1);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setError("Você precisa estar autenticado para fazer o checkout");
      return;
    }

    if (items.length === 0) {
      setError("Seu carrinho está vazio");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          shippingAddress,
          paymentMethod,
          cardData: paymentMethod === "credit_card" ? cardData : undefined,
          installments: paymentMethod === "credit_card" ? installments : 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Checkout failed");
      }

      const result = await response.json();

      if (result.status === "approved") {
        // Redirecionar para página de sucesso
        window.location.href = `/order-success/${result.orderNumber}`;
      } else if (result.status === "declined") {
        setError("Pagamento recusado. Verifique seus dados e tente novamente.");
      } else {
        setError("Pagamento pendente. Você receberá um email com mais informações.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Faça login para continuar</h1>
          <p className="text-muted-foreground mb-8">
            Você precisa estar autenticado para fazer o checkout.
          </p>
          <Button className="w-full">Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-4xl font-bold mb-12">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-8">
          {/* Endereço de Entrega */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Endereço de Entrega</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="00000-000"
                    value={shippingAddress.zipCode}
                    onChange={handleAddressChange}
                  />
                </div>
                <div>
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    name="street"
                    placeholder="Rua exemplo"
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    name="number"
                    placeholder="123"
                    value={shippingAddress.number}
                    onChange={handleAddressChange}
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    name="complement"
                    placeholder="Apto 101"
                    value={shippingAddress.complement}
                    onChange={handleAddressChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="São Paulo"
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="SP"
                    maxLength={2}
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Método de Pagamento */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Método de Pagamento</h2>

            <div className="space-y-4 mb-6">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted">
                <input
                  type="radio"
                  name="payment"
                  value="credit_card"
                  checked={paymentMethod === "credit_card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <CreditCard className="h-5 w-5 mr-3" />
                <span className="font-semibold">Cartão de Crédito</span>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={paymentMethod === "pix"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <Smartphone className="h-5 w-5 mr-3" />
                <span className="font-semibold">PIX</span>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-muted">
                <input
                  type="radio"
                  name="payment"
                  value="boleto"
                  checked={paymentMethod === "boleto"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <Banknote className="h-5 w-5 mr-3" />
                <span className="font-semibold">Boleto Bancário</span>
              </label>
            </div>

            {/* Dados do Cartão */}
            {paymentMethod === "credit_card" && (
              <div className="space-y-4 pt-6 border-t">
                <div>
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={cardData.cardNumber}
                    onChange={handleCardChange}
                  />
                </div>

                <div>
                  <Label htmlFor="cardHolder">Nome do Titular</Label>
                  <Input
                    id="cardHolder"
                    name="cardHolder"
                    placeholder="NOME COMPLETO"
                    value={cardData.cardHolder}
                    onChange={handleCardChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Validade</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      placeholder="MM/AA"
                      value={cardData.expiryDate}
                      onChange={handleCardChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      placeholder="000"
                      type="password"
                      value={cardData.cvv}
                      onChange={handleCardChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="installments">Parcelamento</Label>
                  <Select value={installments.toString()} onValueChange={(v) => setInstallments(parseInt(v))}>
                    <SelectTrigger id="installments">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 6, 12].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x de R$ {(total / num).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </Card>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Resumo do Pedido */}
        <div>
          <Card className="p-6 sticky top-4">
            <h2 className="text-2xl font-bold mb-6">Resumo do Pedido</h2>

            <div className="space-y-4 mb-6 pb-6 border-b">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.productData?.name || "Produto"} x {item.quantity}
                  </span>
                  <span className="font-semibold">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>Grátis</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
              className="w-full h-12 text-lg font-bold"
              size="lg"
            >
              {loading ? "Processando..." : "Finalizar Compra"}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Seus dados estão seguros e criptografados
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
