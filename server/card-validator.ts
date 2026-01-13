/**
 * Serviço de Validação e Processamento de Cartão de Crédito
 * Implementa validações de segurança, cálculo de parcelamento e tokenização
 */

// Algoritmo de Luhn para validar número de cartão
export function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Detectar bandeira do cartão
export function detectCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');

  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(digits)) {
    return 'VISA';
  }

  if (/^5[1-5][0-9]{14}$/.test(digits)) {
    return 'MASTERCARD';
  }

  if (/^3[47][0-9]{13}$/.test(digits)) {
    return 'AMEX';
  }

  if (/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/.test(digits)) {
    return 'DINERS';
  }

  if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(digits)) {
    return 'DISCOVER';
  }

  if (/^(?:2131|1800|35\d{3})\d{11}$/.test(digits)) {
    return 'JCB';
  }

  if (/^63[0-9]{14}$/.test(digits)) {
    return 'ELO';
  }

  if (/^606282[0-9]{10}$/.test(digits)) {
    return 'HIPERCARD';
  }

  return 'UNKNOWN';
}

// Validar data de expiração
export function validateExpiryDate(expiryDate: string): boolean {
  const [month, year] = expiryDate.split('/');

  if (!month || !year || month.length !== 2 || year.length !== 2) {
    return false;
  }

  const monthNum = parseInt(month, 10);
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  const cardYear = parseInt(year, 10);

  if (cardYear < currentYear) {
    return false;
  }

  if (cardYear === currentYear && monthNum < currentMonth) {
    return false;
  }

  return true;
}

// Validar CVV
export function validateCVV(cvv: string, brand: string): boolean {
  const digits = cvv.replace(/\D/g, '');

  if (brand === 'AMEX') {
    return digits.length === 4;
  }

  return digits.length === 3;
}

// Validar dados completos do cartão
export interface CardData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

export interface CardValidationResult {
  valid: boolean;
  errors: string[];
  brand?: string;
  lastDigits?: string;
}

export function validateCard(cardData: CardData): CardValidationResult {
  const errors: string[] = [];

  // Validar número
  if (!cardData.cardNumber) {
    errors.push('Número do cartão é obrigatório');
  } else if (!validateCardNumber(cardData.cardNumber)) {
    errors.push('Número do cartão é inválido');
  }

  // Validar titular
  if (!cardData.cardHolder) {
    errors.push('Nome do titular é obrigatório');
  } else if (cardData.cardHolder.length < 3) {
    errors.push('Nome do titular deve ter pelo menos 3 caracteres');
  }

  // Validar data de expiração
  if (!cardData.expiryDate) {
    errors.push('Data de expiração é obrigatória');
  } else if (!validateExpiryDate(cardData.expiryDate)) {
    errors.push('Data de expiração é inválida ou cartão expirado');
  }

  // Validar CVV
  if (!cardData.cvv) {
    errors.push('CVV é obrigatório');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  const brand = detectCardBrand(cardData.cardNumber);

  if (!validateCVV(cardData.cvv, brand)) {
    return {
      valid: false,
      errors: ['CVV inválido para esta bandeira'],
      brand,
    };
  }

  const lastDigits = cardData.cardNumber.slice(-4);

  return {
    valid: true,
    errors: [],
    brand,
    lastDigits,
  };
}

// Mascarar número do cartão para logging
export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  return `****-****-****-${digits.slice(-4)}`;
}

// Calcular parcelamento
export interface InstallmentOption {
  installments: number;
  amount: number;
  totalAmount: number;
  interest: number;
  monthlyFee: number;
}

export function calculateInstallments(
  totalAmount: number,
  maxInstallments: number = 12,
  interestRate: number = 0 // 0% de juros por padrão
): InstallmentOption[] {
  const options: InstallmentOption[] = [];

  for (let installments = 1; installments <= maxInstallments; installments++) {
    const monthlyRate = interestRate / 100 / 12;
    const monthlyAmount = totalAmount * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1);
    const totalWithInterest = monthlyAmount * installments;
    const interest = totalWithInterest - totalAmount;

    options.push({
      installments,
      amount: Math.round(monthlyAmount * 100) / 100,
      totalAmount: Math.round(totalWithInterest * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      monthlyFee: Math.round(monthlyAmount * 100),
    });
  }

  return options;
}

// Gerar token do cartão (simulado)
// Em produção, usar serviço como Stripe, PagSeguro, etc.
export function generateCardToken(cardData: CardData): string {
  const validation = validateCard(cardData);

  if (!validation.valid) {
    throw new Error('Cartão inválido');
  }

  // Simular token (em produção, seria gerado por serviço seguro)
  const tokenData = {
    brand: validation.brand,
    lastDigits: validation.lastDigits,
    expiryDate: cardData.expiryDate,
    timestamp: Date.now(),
  };

  // Criar hash do token
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  return `card_${token}`;
}

// Validar token do cartão
export function validateCardToken(token: string): boolean {
  if (!token.startsWith('card_')) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(token.slice(5), 'base64').toString());
    return data.brand && data.lastDigits && data.expiryDate;
  } catch {
    return false;
  }
}

// Extrair informações do token
export function extractTokenInfo(token: string): any {
  if (!validateCardToken(token)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(token.slice(5), 'base64').toString());
  } catch {
    return null;
  }
}

// Formatar número de cartão para exibição
export function formatCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  return digits.replace(/(\d{4})/g, '$1 ').trim();
}

// Formatar data de expiração
export function formatExpiryDate(expiryDate: string): string {
  const digits = expiryDate.replace(/\D/g, '');

  if (digits.length === 0) {
    return '';
  }

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

// Tipos de cartão suportados
export const SUPPORTED_CARD_BRANDS = ['VISA', 'MASTERCARD', 'AMEX', 'DINERS', 'ELO', 'HIPERCARD'];

// Limites de parcelamento por bandeira
export const INSTALLMENT_LIMITS: Record<string, number> = {
  VISA: 12,
  MASTERCARD: 12,
  AMEX: 12,
  DINERS: 12,
  ELO: 12,
  HIPERCARD: 12,
};

// Taxas de juros por bandeira (0% por padrão)
export const INTEREST_RATES: Record<string, number> = {
  VISA: 0,
  MASTERCARD: 0,
  AMEX: 0,
  DINERS: 0,
  ELO: 0,
  HIPERCARD: 0,
};
