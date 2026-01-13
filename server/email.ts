import nodemailer from 'nodemailer';

// Configurar transporter de email
// Para produção, use um serviço real como Gmail, SendGrid, etc.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_PORT || '1025'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: process.env.EMAIL_USER
    ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      }
    : undefined,
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log(`Sending email to ${options.to}: ${options.subject}`);

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@wepink.com.br',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error: any) {
    console.error('Failed to send email:', error.message);
    return false;
  }
}

// Templates de email

export function getOrderConfirmationEmail(data: {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
  };
}): string {
  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.price.toFixed(2)}</td>
    </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ec4899; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin-top: 20px; border-radius: 5px; }
          .order-info { background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #ec4899; color: white; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: #ec4899; text-align: right; padding-top: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pedido Confirmado! 🎉</h1>
          </div>

          <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            <p>Seu pedido foi confirmado com sucesso!</p>

            <div class="order-info">
              <p><strong>Número do Pedido:</strong> ${data.orderNumber}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <h3>Itens do Pedido:</h3>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Preço</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total">
              Total: R$ ${data.totalAmount.toFixed(2)}
            </div>

            <h3 style="margin-top: 30px;">Endereço de Entrega:</h3>
            <div class="order-info">
              <p>${data.shippingAddress.street}, ${data.shippingAddress.number}</p>
              ${data.shippingAddress.complement ? `<p>${data.shippingAddress.complement}</p>` : ''}
              <p>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}</p>
            </div>

            <p style="margin-top: 30px;">Você receberá um email de confirmação de pagamento em breve.</p>
            <p>Obrigado por comprar na WePink! 💕</p>
          </div>

          <div class="footer">
            <p>WePink Store - Todos os direitos reservados © 2026</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPaymentConfirmationEmail(data: {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId: string;
}): string {
  const methodLabel = {
    credit_card: 'Cartão de Crédito',
    pix: 'PIX',
    boleto: 'Boleto Bancário',
    debit_card: 'Débito',
  }[data.paymentMethod] || data.paymentMethod;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin-top: 20px; border-radius: 5px; }
          .payment-info { background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #10b981; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pagamento Aprovado! ✅</h1>
          </div>

          <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            <p>Seu pagamento foi processado com sucesso!</p>

            <div class="payment-info">
              <p><strong>Número do Pedido:</strong> ${data.orderNumber}</p>
              <p><strong>ID da Transação:</strong> ${data.transactionId}</p>
              <p><strong>Valor:</strong> R$ ${data.totalAmount.toFixed(2)}</p>
              <p><strong>Método de Pagamento:</strong> ${methodLabel}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>

            <h3>Próximos Passos:</h3>
            <ol>
              <li>Seu pedido será processado em breve</li>
              <li>Você receberá um email com o código de rastreamento</li>
              <li>Acompanhe seu pedido em tempo real</li>
            </ol>

            <p style="margin-top: 30px;">Obrigado por comprar na WePink! 💕</p>
          </div>

          <div class="footer">
            <p>WePink Store - Todos os direitos reservados © 2026</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPixPendingEmail(data: {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  qrCode: string;
  copyPaste: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ec4899; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin-top: 20px; border-radius: 5px; }
          .pix-info { background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ec4899; }
          .qr-code { text-align: center; margin: 20px 0; }
          .qr-code img { max-width: 300px; }
          .copy-paste { background-color: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Aguardando Pagamento PIX 📱</h1>
          </div>

          <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            <p>Seu pedido está aguardando confirmação de pagamento via PIX.</p>

            <div class="pix-info">
              <p><strong>Número do Pedido:</strong> ${data.orderNumber}</p>
              <p><strong>Valor:</strong> R$ ${data.totalAmount.toFixed(2)}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <h3>Como Pagar:</h3>
            <p><strong>Opção 1: Escanear o QR Code</strong></p>
            <div class="qr-code">
              <img src="cid:qrcode" alt="QR Code PIX">
            </div>

            <p><strong>Opção 2: Copiar e Colar</strong></p>
            <div class="copy-paste">
              ${data.copyPaste}
            </div>

            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              ⏱️ O pagamento será confirmado automaticamente em até alguns minutos após a transferência.
            </p>

            <p style="margin-top: 30px;">Obrigado por comprar na WePink! 💕</p>
          </div>

          <div class="footer">
            <p>WePink Store - Todos os direitos reservados © 2026</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getBoletoPendingEmail(data: {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  barcode: string;
  boletoUrl?: string;
  dueDate: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ec4899; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin-top: 20px; border-radius: 5px; }
          .boleto-info { background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ec4899; }
          .barcode { background-color: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Boleto Gerado 📋</h1>
          </div>

          <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            <p>Seu boleto foi gerado com sucesso!</p>

            <div class="boleto-info">
              <p><strong>Número do Pedido:</strong> ${data.orderNumber}</p>
              <p><strong>Valor:</strong> R$ ${data.totalAmount.toFixed(2)}</p>
              <p><strong>Vencimento:</strong> ${data.dueDate}</p>
            </div>

            <h3>Código de Barras:</h3>
            <div class="barcode">
              ${data.barcode}
            </div>

            <h3>Como Pagar:</h3>
            <ol>
              <li>Copie o código de barras acima</li>
              <li>Acesse seu banco (internet banking ou caixa eletrônico)</li>
              <li>Selecione "Pagar Boleto"</li>
              <li>Cole o código de barras</li>
              <li>Confirme o pagamento</li>
            </ol>

            ${
              data.boletoUrl
                ? `<p><a href="${data.boletoUrl}" style="display: inline-block; background-color: #ec4899; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Visualizar Boleto</a></p>`
                : ''
            }

            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              ⏱️ Prazo de pagamento: 3 dias úteis. O pagamento será confirmado automaticamente após compensação.
            </p>

            <p style="margin-top: 30px;">Obrigado por comprar na WePink! 💕</p>
          </div>

          <div class="footer">
            <p>WePink Store - Todos os direitos reservados © 2026</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getShippingNotificationEmail(data: {
  orderNumber: string;
  customerName: string;
  trackingCode: string;
  carrier: string;
  estimatedDelivery: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin-top: 20px; border-radius: 5px; }
          .shipping-info { background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3b82f6; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Seu Pedido Foi Enviado! 📦</h1>
          </div>

          <div class="content">
            <p>Olá <strong>${data.customerName}</strong>,</p>
            <p>Seu pedido foi enviado e está a caminho!</p>

            <div class="shipping-info">
              <p><strong>Número do Pedido:</strong> ${data.orderNumber}</p>
              <p><strong>Código de Rastreamento:</strong> ${data.trackingCode}</p>
              <p><strong>Transportadora:</strong> ${data.carrier}</p>
              <p><strong>Entrega Estimada:</strong> ${data.estimatedDelivery}</p>
            </div>

            <h3>Rastrear Seu Pedido:</h3>
            <p>Você pode acompanhar seu pedido em tempo real usando o código de rastreamento acima no site da transportadora.</p>

            <p style="margin-top: 30px;">Obrigado por comprar na WePink! 💕</p>
          </div>

          <div class="footer">
            <p>WePink Store - Todos os direitos reservados © 2026</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
