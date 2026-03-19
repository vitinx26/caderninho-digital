/**
 * Serviço de Envio de E-mails
 * Envia notificações por email para usuários
 */

import nodemailer from 'nodemailer';

// Configurar transportador de email
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  para: string;
  assunto: string;
  html: string;
}

/**
 * Envia email
 */
export async function enviarEmail(opcoes: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email não configurado. Pulando envio.');
      return false;
    }

    const resultado = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: opcoes.para,
      subject: opcoes.assunto,
      html: opcoes.html,
    });

    console.log(`✓ Email enviado para ${opcoes.para}`);
    return true;
  } catch (error) {
    console.error('✗ Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Notifica novo lançamento registrado
 */
export async function notificarNovoLancamento(
  emailUsuario: string,
  nomeUsuario: string,
  descricao: string,
  valor: number,
  data: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Novo Lançamento Registrado</h2>
      
      <p>Olá <strong>${nomeUsuario}</strong>,</p>
      
      <p>Um novo lançamento foi registrado em sua conta:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Descrição:</strong> ${descricao}</p>
        <p><strong>Valor:</strong> R$ ${valor.toFixed(2)}</p>
        <p><strong>Data:</strong> ${data}</p>
      </div>
      
      <p>Acesse sua conta para visualizar mais detalhes e gerenciar seus lançamentos.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      
      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital. 
        Não responda este email.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailUsuario,
    assunto: `Novo Lançamento: ${descricao}`,
    html,
  });
}

/**
 * Notifica cobrança registrada
 */
export async function notificarCobranca(
  emailCliente: string,
  nomeCliente: string,
  valor: number,
  dataVencimento: string,
  descricao?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Cobrança Registrada</h2>
      
      <p>Olá <strong>${nomeCliente}</strong>,</p>
      
      <p>Uma cobrança foi registrada em sua conta:</p>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
        <p><strong>Descrição:</strong> ${descricao || 'Cobrança'}</p>
        <p><strong>Valor:</strong> <span style="font-size: 24px; color: #d32f2f;">R$ ${valor.toFixed(2)}</span></p>
        <p><strong>Data de Vencimento:</strong> ${dataVencimento}</p>
      </div>
      
      <p style="color: #d32f2f; font-weight: bold;">Favor regularizar o pagamento conforme indicado.</p>
      
      <p>Acesse sua conta para visualizar mais detalhes e registrar o pagamento.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      
      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital. 
        Não responda este email.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailCliente,
    assunto: `Cobrança: ${descricao || 'Pagamento Pendente'}`,
    html,
  });
}

/**
 * Notifica pagamento recebido
 */
export async function notificarPagamentoRecebido(
  emailCliente: string,
  nomeCliente: string,
  valor: number,
  data: string,
  referencia?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4caf50;">Pagamento Recebido</h2>
      
      <p>Olá <strong>${nomeCliente}</strong>,</p>
      
      <p>Seu pagamento foi recebido com sucesso!</p>
      
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
        <p><strong>Valor Recebido:</strong> <span style="font-size: 24px; color: #4caf50;">R$ ${valor.toFixed(2)}</span></p>
        <p><strong>Data:</strong> ${data}</p>
        ${referencia ? `<p><strong>Referência:</strong> ${referencia}</p>` : ''}
      </div>
      
      <p>Obrigado pelo pagamento!</p>
      
      <p>Acesse sua conta para visualizar o comprovante.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      
      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital. 
        Não responda este email.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailCliente,
    assunto: `Pagamento Recebido - R$ ${valor.toFixed(2)}`,
    html,
  });
}

/**
 * Notifica novo usuário registrado
 */
export async function notificarNovoUsuario(
  emailUsuario: string,
  nomeUsuario: string,
  loginUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Bem-vindo ao Caderninho Digital!</h2>
      
      <p>Olá <strong>${nomeUsuario}</strong>,</p>
      
      <p>Sua conta foi criada com sucesso no Caderninho Digital!</p>
      
      <p>Você agora pode:</p>
      <ul>
        <li>Registrar suas despesas e ganhos</li>
        <li>Acompanhar seu consumo em tempo real</li>
        <li>Receber notificações de cobranças e pagamentos</li>
        <li>Visualizar seu histórico completo</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Acessar Minha Conta
        </a>
      </div>
      
      <p>Se você não criou esta conta, ignore este email.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      
      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital. 
        Não responda este email.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailUsuario,
    assunto: 'Bem-vindo ao Caderninho Digital!',
    html,
  });
}

/**
 * Obtém emails de todos os administradores
 */
export function obterEmailsAdministradores(usuarios: any[]): string[] {
  return usuarios
    .filter((u) => u.tipo === 'admin' && u.email)
    .map((u) => u.email);
}

/**
 * Notifica resumo de consumo
 */
export async function notificarResumoConsumo(
  emailUsuario: string,
  nomeUsuario: string,
  totalConsumo: number,
  periodo: string,
  detalhes: Array<{ descricao: string; valor: number }>
): Promise<boolean> {
  const detalhesHtml = detalhes
    .map(
      (d) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${d.descricao}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${d.valor.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Resumo de Consumo - ${periodo}</h2>
      
      <p>Olá <strong>${nomeUsuario}</strong>,</p>
      
      <p>Aqui está o resumo de seu consumo no período de ${periodo}:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Descrição</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${detalhesHtml}
          <tr style="background-color: #f5f5f5; font-weight: bold;">
            <td style="padding: 10px; border-bottom: 2px solid #ddd;">TOTAL</td>
            <td style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">R$ ${totalConsumo.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <p>Acesse sua conta para visualizar mais detalhes e gerenciar seus lançamentos.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      
      <p style="color: #666; font-size: 12px;">
        Esta é uma notificação automática do Caderninho Digital. 
        Não responda este email.
      </p>
    </div>
  `;

  return enviarEmail({
    para: emailUsuario,
    assunto: `Resumo de Consumo - ${periodo}`,
    html,
  });
}
