import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle2, Loader2, Copy, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  product: {
    productId: number;
    productName: string;
    productPrice: number;
    productReference: string;
  };
  quantity: number;
}

export default function CheckoutPageSimple() {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [orderData, setOrderData] = useState<any>(null);
  const [copiedQR, setCopiedQR] = useState(false);
  
  const [formData, setFormData] = useState({
    street: "",
    number: "",
    complement: "",
    cep: "",
    city: "",
    state: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVV: "",
    installments: "1",
  });

  useEffect(() => {
    // Carregar carrinho do localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      } catch (err) {
        console.error("Erro ao carregar carrinho", err);
      }
    }
  }, []);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.productPrice * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar dados
      if (!formData.street || !formData.number || !formData.cep || !formData.city || !formData.state) {
        throw new Error("Preencha todos os dados de endereço");
      }

      if (paymentMethod === "card") {
        if (!formData.cardNumber || !formData.cardName || !formData.cardExpiry || !formData.cardCVV) {
          throw new Error("Preencha todos os dados do cartão");
        }
      }

      const total = calculateTotal();

      // Enviar para checkout
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.productId,
            productName: item.product.productName,
            price: item.product.productPrice,
            quantity: item.quantity,
          })),
          address: {
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            cep: formData.cep,
            city: formData.city,
            state: formData.state,
          },
          paymentMethod,
          cardData: paymentMethod === "card" ? {
            number: formData.cardNumber.replace(/\s/g, ""),
            name: formData.cardName,
            expiry: formData.cardExpiry,
            cvv: formData.cardCVV,
            installments: parseInt(formData.installments),
          } : null,
          total: Math.round(total * 100),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao processar pedido");
      }

      const data = await response.json();
      setOrderData(data);
      setSuccess(true);
      localStorage.removeItem("cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !success) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <Alert className="mb-6 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Seu carrinho está vazio. Adicione produtos antes de fazer checkout.
          </AlertDescription>
        </Alert>
        <Link href="/">
          <Button size="lg" className="rounded-full px-8 font-bold btn-glow">
            Voltar para Loja
          </Button>
        </Link>
      </div>
    );
  }

  if (success && orderData) {
    return (
      <div className="container py-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">Pedido Realizado com Sucesso!</CardTitle>
              <CardDescription className="text-green-700">
                Número do pedido: {orderData.orderNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentMethod === "pix" && orderData.pix && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-primary">
                    <h3 className="font-bold mb-4 text-center">Código PIX (Cópia e Cola)</h3>
                    <div className="bg-gray-100 p-4 rounded font-mono text-xs break-all mb-4">
                      {orderData.pix.copyPaste}
                    </div>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(orderData.pix.copyPaste);
                        setCopiedQR(true);
                        setTimeout(() => setCopiedQR(false), 2000);
                      }}
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedQR ? "Copiado!" : "Copiar Código"}
                    </Button>
                  </div>
                  {orderData.pix.qrCode && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Ou escaneie o QR Code:</p>
                      <img src={orderData.pix.qrCode} alt="QR Code PIX" className="mx-auto" />
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "boleto" && orderData.boleto && (
                <div className="bg-white p-6 rounded-lg border-2 border-primary">
                  <h3 className="font-bold mb-4">Código de Barras</h3>
                  <div className="bg-gray-100 p-4 rounded font-mono text-sm break-all mb-4">
                    {orderData.boleto.barcode}
                  </div>
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(orderData.boleto.barcode);
                      setCopiedQR(true);
                      setTimeout(() => setCopiedQR(false), 2000);
                    }}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedQR ? "Copiado!" : "Copiar Código"}
                  </Button>
                </div>
              )}

              {paymentMethod === "card" && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seu pagamento foi processado com sucesso! Você receberá um email de confirmação em breve.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Um email de confirmação foi enviado para você com os detalhes do pedido.
                </p>
                <Link href="/">
                  <Button className="w-full rounded-full font-bold btn-glow">
                    Continuar Comprando
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="container py-10">
      <button 
        onClick={() => setLocation('/cart')}
        className="flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Carrinho
      </button>

      <h1 className="font-display text-3xl font-black mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">Rua</Label>
                    <Input 
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="Rua A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input 
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
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
                    value={formData.complement}
                    onChange={handleInputChange}
                    placeholder="Apto 101 (opcional)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input 
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleInputChange}
                      placeholder="01234-567"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input 
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="São Paulo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input 
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="SP"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Método de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer">PIX (Instantâneo)</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="cursor-pointer">Cartão de Crédito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boleto" id="boleto" />
                    <Label htmlFor="boleto" className="cursor-pointer">Boleto Bancário</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Dados do Cartão */}
            {paymentMethod === "card" && (
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
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="4111 1111 1111 1111"
                      required={paymentMethod === "card"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardName">Nome do Titular</Label>
                    <Input 
                      id="cardName"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      placeholder="João Silva"
                      required={paymentMethod === "card"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardExpiry">Validade</Label>
                      <Input 
                        id="cardExpiry"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        placeholder="12/25"
                        required={paymentMethod === "card"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCVV">CVV</Label>
                      <Input 
                        id="cardCVV"
                        name="cardCVV"
                        value={formData.cardCVV}
                        onChange={handleInputChange}
                        placeholder="123"
                        required={paymentMethod === "card"}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="installments">Parcelamento</Label>
                    <Select value={formData.installments} onValueChange={(value) => setFormData(prev => ({ ...prev, installments: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                          <SelectItem key={i} value={i.toString()}>
                            {i}x sem juros
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
              className="w-full h-12 rounded-full font-bold text-lg btn-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                `Confirmar Compra - ${formatPrice(total)}`
              )}
            </Button>
          </form>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map(item => (
                <div key={item.product.productId} className="flex justify-between text-sm">
                  <span>{item.product.productName} x{item.quantity}</span>
                  <span className="font-bold">{formatPrice(item.product.productPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-green-600 font-bold">Grátis</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-black text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
