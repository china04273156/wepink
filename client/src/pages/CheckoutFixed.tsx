import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

export function CheckoutFixed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix" | "boleto">("credit_card");
  const [step, setStep] = useState<"address" | "payment" | "confirm">("address");

  // Dados de endereço
  const [address, setAddress] = useState({
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Dados de cartão
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });

  const [installments, setInstallments] = useState(1);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Você precisa estar logado</h1>
          <button
            onClick={() => navigate("/auth")}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg"
          >
            Voltar para Produtos
          </button>
        </div>
      </div>
    );
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.street || !address.number || !address.city || !address.state || !address.zipCode) {
      setError("Preencha todos os campos de endereço");
      return;
    }
    setError(null);
    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (paymentMethod === "credit_card") {
        if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
          throw new Error("Preencha todos os dados do cartão");
        }

        // Validar cartão
        if (cardData.cardNumber.replace(/\s/g, "").length < 13) {
          throw new Error("Número de cartão inválido");
        }
      }

      // Preparar dados do pedido
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          skuId: item.skuId,
          quantity: item.quantity,
          price: item.price,
          name: item.productData?.name,
        })),
        shippingAddress: address,
        paymentMethod,
        cardData: paymentMethod === "credit_card" ? cardData : undefined,
        pixData: paymentMethod === "pix" ? {} : undefined,
        boletoData: paymentMethod === "boleto" ? {} : undefined,
        installments: paymentMethod === "credit_card" ? installments : 1,
      };

      console.log("Enviando pedido:", orderData);

      // Enviar para checkout
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar pagamento");
      }

      const result = await response.json();

      console.log("Resposta do pagamento:", result);

      if (result.status === "approved") {
        // Pagamento aprovado
        clearCart();
        navigate(`/order-success/${result.orderNumber}`, {
          state: { order: result },
        });
      } else if (result.status === "pending") {
        // PIX ou Boleto - aguardando confirmação
        if (paymentMethod === "pix") {
          // Mostrar QR Code
          navigate(`/pix-confirmation/${result.orderNumber}`, {
            state: {
              qrCode: result.transaction?.pixQrCode,
              copyPaste: result.transaction?.pixCopyPaste,
              orderId: result.orderId,
            },
          });
        } else if (paymentMethod === "boleto") {
          // Mostrar boleto
          navigate(`/boleto-confirmation/${result.orderNumber}`, {
            state: {
              barcode: result.transaction?.boletoBarcode,
              url: result.transaction?.boletoUrl,
              orderId: result.orderId,
            },
          });
        }
      } else {
        throw new Error(result.transaction?.message || "Pagamento recusado");
      }
    } catch (err: any) {
      console.error("Erro no pagamento:", err);
      setError(err.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim();
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Resumo do Pedido */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.productData?.name || "Produto"}</span>
                <span>
                  {item.quantity}x R$ {item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Etapas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Endereço */}
          {(step === "address" || step !== "address") && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    step !== "address" ? "bg-green-500 text-white" : "bg-pink-500 text-white"
                  }`}
                >
                  1
                </span>
                Endereço de Entrega
              </h3>

              {step === "address" && (
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Rua"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="col-span-2 border rounded-lg px-4 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Número"
                      value={address.number}
                      onChange={(e) => setAddress({ ...address, number: e.target.value })}
                      className="border rounded-lg px-4 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Complemento"
                      value={address.complement}
                      onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                      className="border rounded-lg px-4 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="border rounded-lg px-4 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Estado"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="border rounded-lg px-4 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="CEP"
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      className="border rounded-lg px-4 py-2"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-pink-500 text-white py-2 rounded-lg font-bold hover:bg-pink-600"
                  >
                    Continuar para Pagamento
                  </button>
                </form>
              )}

              {step !== "address" && (
                <div className="text-sm text-gray-600">
                  <p>{address.street}, {address.number}</p>
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                </div>
              )}
            </div>
          )}

          {/* Pagamento */}
          {step === "payment" && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-pink-500 text-white">
                  2
                </span>
                Forma de Pagamento
              </h3>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Seleção de método */}
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>Cartão de Crédito</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pix"
                      checked={paymentMethod === "pix"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>PIX</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="boleto"
                      checked={paymentMethod === "boleto"}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>Boleto Bancário</span>
                  </label>
                </div>

                {/* Dados do Cartão */}
                {paymentMethod === "credit_card" && (
                  <div className="space-y-4 border-t pt-4">
                    <input
                      type="text"
                      placeholder="Número do Cartão"
                      value={cardData.cardNumber}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          cardNumber: formatCardNumber(e.target.value),
                        })
                      }
                      maxLength={19}
                      className="w-full border rounded-lg px-4 py-2"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nome do Titular"
                      value={cardData.cardHolder}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          cardHolder: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={cardData.expiryDate}
                        onChange={(e) =>
                          setCardData({
                            ...cardData,
                            expiryDate: formatExpiryDate(e.target.value),
                          })
                        }
                        maxLength={5}
                        className="border rounded-lg px-4 py-2"
                        required
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        value={cardData.cvv}
                        onChange={(e) =>
                          setCardData({
                            ...cardData,
                            cvv: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        maxLength={4}
                        className="border rounded-lg px-4 py-2"
                        required
                      />
                    </div>

                    {/* Parcelamento */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Parcelamento</label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(parseInt(e.target.value))}
                        className="w-full border rounded-lg px-4 py-2"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                          <option key={i} value={i}>
                            {i}x de R$ {(total / i).toFixed(2)}
                            {i === 1 ? " (sem juros)" : " (sem juros)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* PIX */}
                {paymentMethod === "pix" && (
                  <div className="border-t pt-4 text-center">
                    <p className="text-gray-600 mb-2">
                      Você receberá um QR Code para escanear com seu celular
                    </p>
                    <p className="text-sm text-gray-500">
                      O pagamento será confirmado automaticamente
                    </p>
                  </div>
                )}

                {/* Boleto */}
                {paymentMethod === "boleto" && (
                  <div className="border-t pt-4 text-center">
                    <p className="text-gray-600 mb-2">
                      Você receberá o código de barras para pagar em qualquer banco
                    </p>
                    <p className="text-sm text-gray-500">
                      Prazo: 3 dias úteis
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep("address")}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-pink-500 text-white py-2 rounded-lg font-bold hover:bg-pink-600 disabled:bg-gray-400"
                  >
                    {loading ? "Processando..." : "Finalizar Compra"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
