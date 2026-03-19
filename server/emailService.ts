import nodemailer from 'nodemailer';

/**
 * Serviço de envio de emails para notificações
 * Suporta múltiplos provedores SMTP (Gmail, etc)
 */

interface EmailOptions {
  para: string | string[];
  assunto: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Inicializar transporter de email
 */
export function initializeEmailService() {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn('⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD env vars.');
    return false;
  }

  try {
    transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    console.log('✅ Email service initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    return false;
  }
}

/**
 * Enviar email genérico
 */
export async function enviarEmail(options: EmailOptions): Promise<boolean> {
  if (!transporter) {
    console.warn('Email service not initialized');
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: Array.isArray(options.para) ? options.para.join(',') : options.para,
      subject: options.assunto,
      html: options.html,
    });

    console.log(`✅ Email sent to ${options.para}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

/**
 * Notificar novo lançamento registrado
 */
export async function notificarNovoLancamento(
  emailsAdmins: string[],
  clienteNome: string,
  tipo: 'debito' | 'pagamento',
  valor: number,
  descricao: string
): Promise<boolean> {
  const tipoLabel = tipo === 'debito' ? 'Débito' : 'Pagamento';
  const valorFormatado = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Novo ${tipoLabel} Registrado</h2>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Cliente:</strong> ${clienteNome}</p>
        <p><strong>Tipo:</strong> ${tipoLabel}</p>
        <p><strong>Valor:</strong> <span style="color: ${tipo === 'debito' ? '#d32f2f' : '#388e3c'}; font-size: 18px; font-weight: bold;">${valorFormatado}</span></p>
        <p><strong>Descrição:</strong> ${descricao}</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      </div>

      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailsAdmins,
    assunto: `${tipoLabel} registrado - ${clienteNome}`,
    html,
  });
}

/**
 * Notificar cobrança pendente
 */
export async function notificarCobranca(
  emailsAdmins: string[],
  clienteNome: string,
  valor: number,
  descricao: string
): Promise<boolean> {
  const valorFormatado = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Cobrança Pendente</h2>
      
      <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
        <p><strong>Cliente:</strong> ${clienteNome}</p>
        <p><strong>Valor:</strong> <span style="color: #d32f2f; font-size: 18px; font-weight: bold;">${valorFormatado}</span></p>
        <p><strong>Descrição:</strong> ${descricao}</p>
      </div>

      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailsAdmins,
    assunto: `Cobrança pendente - ${clienteNome}`,
    html,
  });
}

/**
 * Notificar pagamento recebido
 */
export async function notificarPagamentoRecebido(
  emailsAdmins: string[],
  clienteNome: string,
  valor: number
): Promise<boolean> {
  const valorFormatado = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #388e3c;">Pagamento Recebido</h2>
      
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #388e3c;">
        <p><strong>Cliente:</strong> ${clienteNome}</p>
        <p><strong>Valor Recebido:</strong> <span style="color: #388e3c; font-size: 18px; font-weight: bold;">${valorFormatado}</span></p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      </div>

      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailsAdmins,
    assunto: `Pagamento recebido - ${clienteNome}`,
    html,
  });
}

/**
 * Notificar novo usuário criado
 */
export async function notificarNovoUsuario(
  emailsAdmins: string[],
  nomeUsuario: string,
  emailUsuario: string,
  tipo: 'admin' | 'cliente'
): Promise<boolean> {
  const tipoLabel = tipo === 'admin' ? 'Administrador' : 'Cliente';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Novo ${tipoLabel} Criado</h2>
      
      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Nome:</strong> ${nomeUsuario}</p>
        <p><strong>Email:</strong> ${emailUsuario}</p>
        <p><strong>Tipo:</strong> ${tipoLabel}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
      </div>

      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailsAdmins,
    assunto: `Novo ${tipoLabel} criado - ${nomeUsuario}`,
    html,
  });
}

/**
 * Resumo de consumo periódico
 */
export async function notificarResumoConsumo(
  emailsAdmins: string[],
  clienteNome: string,
  totalDebitos: number,
  totalPagamentos: number,
  saldoDevedor: number
): Promise<boolean> {
  const totalDebitosFormatado = (totalDebitos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const totalPagamentosFormatado = (totalPagamentos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const saldoDevedorFormatado = (saldoDevedor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Resumo de Consumo</h2>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Cliente:</strong> ${clienteNome}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        <p><strong>Total de Débitos:</strong> <span style="color: #d32f2f;">${totalDebitosFormatado}</span></p>
        <p><strong>Total de Pagamentos:</strong> <span style="color: #388e3c;">${totalPagamentosFormatado}</span></p>
        <p><strong>Saldo Devedor:</strong> <span style="color: #d32f2f; font-size: 16px; font-weight: bold;">${saldoDevedorFormatado}</span></p>
      </div>

      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailsAdmins,
    assunto: `Resumo de consumo - ${clienteNome}`,
    html,
  });
}
