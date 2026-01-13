import axios from 'axios';

const FASTSOFTBRASIL_API_URL = 'https://api.fastsoftbrasil.com/api/user/transactions';
const PUBLIC_KEY = process.env.FASTSOFTBRASIL_PUBLIC_KEY;
const SECRET_KEY = process.env.FASTSOFTBRASIL_SECRET_KEY;

interface TransactionRequest {
  amount: number; // em centavos
  currency?: string;
  paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  description: string;
  customerId?: string;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDocument?: string;
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  cardData?: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  };
  pixData?: {
    expiresInDays?: number;
  };
  boletoData?: {
    expiresInDays?: number;
  };
  items?: Array<{
    title: string;
    unitPrice: number;
    quantity: number;
    tangible?: boolean;
    externalRef?: string;
  }>;
  installments?: number;
  postbackUrl?: string;
  ip?: string;
}

interface TransactionResponse {
  status: number;
  message: string;
  data?: {
    id: string;
    status: 'pending' | 'approved' | 'declined' | 'processing' | 'refunded';
    amount: number;
    currency: string;
    paymentMethod: string;
    pix?: {
      qrCode: string;
      qrCodeUrl?: string;
      copyPaste: string;
    };
    boleto?: {
      barcode: string;
      barcodeUrl?: string;
    };
    card?: {
      lastDigits: string;
      brand: string;
    };
    createdAt: string;
    [key: string]: any;
  };
  error?: string;
  [key: string]: any;
}

// Criar autenticação Basic Auth
function getBasicAuth(): string {
  const credentials = `${PUBLIC_KEY}:${SECRET_KEY}`;
  return Buffer.from(credentials).toString('base64');
}

export async function createTransaction(data: TransactionRequest): Promise<TransactionResponse> {
  try {
    console.log('Creating transaction with FastSoft Brasil:', {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      orderId: data.orderId,
    });

    // Preparar itens
    const items = data.items || [
      {
        title: data.description,
        unitPrice: data.amount,
        quantity: 1,
        tangible: true,
        externalRef: data.orderId,
      },
    ];

    // Preparar dados da requisição
    const requestData: any = {
      amount: data.amount, // já em centavos
      currency: data.currency || 'BRL',
      paymentMethod: data.paymentMethod,
      items,
      postbackUrl: data.postbackUrl,
      ip: data.ip,
      metadata: JSON.stringify({
        orderId: data.orderId,
        customerId: data.customerId,
      }),
    };

    // Adicionar dados do cliente
    if (data.customerName || data.customerEmail) {
      requestData.customer = {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      };

      if (data.customerDocument) {
        requestData.customer.document = {
          number: data.customerDocument,
          type: 'CPF',
        };
      }

      if (data.shippingAddress) {
        requestData.customer.address = {
          street: data.shippingAddress.street,
          streetNumber: data.shippingAddress.number,
          complement: data.shippingAddress.complement,
          zipCode: data.shippingAddress.zipCode,
          neighborhood: 'Centro', // Pode ser customizado
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          country: 'BR',
        };
      }
    }

    // Adicionar dados de envio
    if (data.shippingAddress) {
      requestData.shipping = {
        fee: 0,
        address: {
          street: data.shippingAddress.street,
          streetNumber: data.shippingAddress.number,
          complement: data.shippingAddress.complement,
          zipCode: data.shippingAddress.zipCode,
          neighborhood: 'Centro',
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          country: 'BR',
        },
      };
    }

    // Adicionar dados específicos do método de pagamento
    if (data.paymentMethod === 'CREDIT_CARD' && data.cardData) {
      requestData.card = {
        number: data.cardData.cardNumber.replace(/\s/g, ''),
        holderName: data.cardData.cardHolder,
        expirationMonth: parseInt(data.cardData.expiryDate.split('/')[0]),
        expirationYear: parseInt(data.cardData.expiryDate.split('/')[1]),
        cvv: data.cardData.cvv,
      };
      requestData.installments = data.installments || 1;
    } else if (data.paymentMethod === 'PIX') {
      requestData.pix = {
        expiresInDays: data.pixData?.expiresInDays || 1,
      };
    } else if (data.paymentMethod === 'BOLETO') {
      requestData.boleto = {
        expiresInDays: data.boletoData?.expiresInDays || 3,
      };
    }

    console.log('Request payload:', JSON.stringify(requestData, null, 2));

    const response = await axios.post(FASTSOFTBRASIL_API_URL, requestData, {
      headers: {
        'Authorization': `Basic ${getBasicAuth()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    console.log('Transaction created successfully:', {
      id: response.data.data?.id,
      status: response.data.data?.status,
      paymentMethod: response.data.data?.paymentMethod,
    });

    return response.data;
  } catch (error: any) {
    console.error('FastSoft Brasil API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Transaction failed'
    );
  }
}

export async function getTransactionStatus(transactionId: string): Promise<TransactionResponse> {
  try {
    console.log('Getting transaction status:', transactionId);

    const response = await axios.get(
      `https://api.fastsoftbrasil.com/api/user/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Basic ${getBasicAuth()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('Transaction status retrieved:', {
      id: response.data.data?.id,
      status: response.data.data?.status,
    });

    return response.data;
  } catch (error: any) {
    console.error('FastSoft Brasil API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Failed to get transaction status'
    );
  }
}

export async function refundTransaction(
  transactionId: string,
  amount?: number
): Promise<TransactionResponse> {
  try {
    console.log('Refunding transaction:', { transactionId, amount });

    const requestData: any = {};

    if (amount) {
      requestData.amount = amount; // em centavos
    }

    const response = await axios.post(
      `https://api.fastsoftbrasil.com/api/user/transactions/${transactionId}/refund`,
      requestData,
      {
        headers: {
          'Authorization': `Basic ${getBasicAuth()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('Refund processed:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('FastSoft Brasil API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Refund failed'
    );
  }
}

// Testar conexão com API
export async function testConnection(): Promise<boolean> {
  try {
    console.log('Testing FastSoft Brasil connection...');

    const response = await axios.get(
      'https://api.fastsoftbrasil.com/api/user/transactions',
      {
        headers: {
          'Authorization': `Basic ${getBasicAuth()}`,
        },
        timeout: 10000,
      }
    );

    console.log('Connection test successful:', response.status);
    return true;
  } catch (error: any) {
    console.error('Connection test failed:', error.message);
    return false;
  }
}
