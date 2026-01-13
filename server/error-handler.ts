import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class CustomError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: (err as ApiError).statusCode,
    code: (err as ApiError).code,
  });

  const statusCode = (err as ApiError).statusCode || 500;
  const code = (err as ApiError).code || 'INTERNAL_ERROR';
  const details = (err as ApiError).details;

  res.status(statusCode).json({
    success: false,
    error: err.message,
    code,
    ...(process.env.NODE_ENV === 'development' && { details, stack: err.stack }),
  });
}

// Tratamento de erros específicos da FastSoft Brasil
export function handleFastSoftError(error: any): CustomError {
  console.error('FastSoft Brasil Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
  });

  if (error.response?.status === 401 || error.response?.status === 403) {
    return new CustomError(
      'Credenciais inválidas na FastSoft Brasil',
      401,
      'INVALID_CREDENTIALS',
      error.response?.data
    );
  }

  if (error.response?.status === 400) {
    return new CustomError(
      error.response?.data?.message || 'Dados inválidos',
      400,
      'INVALID_DATA',
      error.response?.data
    );
  }

  if (error.code === 'ECONNREFUSED') {
    return new CustomError(
      'Não foi possível conectar à FastSoft Brasil. Tente novamente em alguns momentos.',
      503,
      'SERVICE_UNAVAILABLE'
    );
  }

  if (error.code === 'ENOTFOUND') {
    return new CustomError(
      'Servidor da FastSoft Brasil não encontrado',
      503,
      'SERVICE_UNAVAILABLE'
    );
  }

  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return new CustomError(
      'Timeout ao conectar com FastSoft Brasil',
      504,
      'GATEWAY_TIMEOUT'
    );
  }

  return new CustomError(
    error.response?.data?.message || error.message || 'Erro ao processar transação',
    error.response?.status || 500,
    'TRANSACTION_ERROR',
    error.response?.data
  );
}

// Validação de dados de checkout
export function validateCheckoutData(data: any): void {
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new CustomError('Carrinho vazio', 400, 'EMPTY_CART');
  }

  if (!data.shippingAddress) {
    throw new CustomError('Endereço de entrega não fornecido', 400, 'MISSING_ADDRESS');
  }

  const { street, number, city, state, zipCode } = data.shippingAddress;
  if (!street || !number || !city || !state || !zipCode) {
    throw new CustomError('Endereço incompleto', 400, 'INVALID_ADDRESS');
  }

  if (!data.paymentMethod) {
    throw new CustomError('Método de pagamento não fornecido', 400, 'MISSING_PAYMENT_METHOD');
  }

  if (!['PIX', 'BOLETO', 'CREDIT_CARD'].includes(data.paymentMethod)) {
    throw new CustomError('Método de pagamento inválido', 400, 'INVALID_PAYMENT_METHOD');
  }

  if (data.paymentMethod === 'CREDIT_CARD' && !data.cardData) {
    throw new CustomError('Dados do cartão não fornecidos', 400, 'MISSING_CARD_DATA');
  }

  if (data.paymentMethod === 'CREDIT_CARD' && data.cardData) {
    validateCardData(data.cardData);
  }
}

// Validação de dados do cartão
export function validateCardData(cardData: any): void {
  if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 13) {
    throw new CustomError('Número de cartão inválido', 400, 'INVALID_CARD_NUMBER');
  }

  if (!cardData.cardHolder) {
    throw new CustomError('Nome do titular não fornecido', 400, 'MISSING_CARD_HOLDER');
  }

  if (!cardData.expiryDate || !cardData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
    throw new CustomError('Data de validade inválida (use MM/AA)', 400, 'INVALID_EXPIRY_DATE');
  }

  if (!cardData.cvv || cardData.cvv.length < 3) {
    throw new CustomError('CVV inválido', 400, 'INVALID_CVV');
  }
}

// Retry com backoff exponencial
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Não fazer retry para erros de validação
      if (error.statusCode === 400 || error.statusCode === 401 || error.statusCode === 403) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retry in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max attempts reached');
}

// Sanitizar dados sensíveis para logging
export function sanitizeForLogging(data: any): any {
  const sensitiveFields = ['cardNumber', 'cvv', 'password', 'token', 'SECRET_KEY', 'PUBLIC_KEY'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}
