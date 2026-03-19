/**
 * Rotas de API para Notificações
 * Gerencia envio de notificações por email
 */

import { Router, Request, Response } from 'express';
import * as emailService from './emailService';

const router = Router();

/**
 * POST /api/notificacoes/novo-lancamento
 * Envia notificação de novo lançamento apenas para administradores
 */
router.post('/novo-lancamento', async (req: Request, res: Response) => {
  try {
    const { emailUsuario, nomeUsuario, descricao, valor, data, usuarioTipo, emailsAdmins } = req.body;

    if (!emailUsuario || !nomeUsuario || !descricao || !valor) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    // Apenas enviar notificação se o usuário é admin ou se há emails de admins
    if (usuarioTipo !== 'admin' && (!emailsAdmins || emailsAdmins.length === 0)) {
      return res.json({ sucesso: false, mensagem: 'Nenhum administrador para notificar' });
    }

    // Se for admin, notificar a si mesmo; senão, notificar todos os admins
    const emailsParaNotificar = usuarioTipo === 'admin' ? [emailUsuario] : emailsAdmins;

    let sucessoCount = 0;
    for (const email of emailsParaNotificar) {
      const sucesso = await emailService.notificarNovoLancamento(
        email,
        nomeUsuario,
        descricao,
        valor,
        data || new Date().toLocaleDateString('pt-BR')
      );
      if (sucesso) sucessoCount++;
    }

    res.json({
      sucesso: sucessoCount > 0,
      mensagem: `Notificação enviada para ${sucessoCount} administrador(es)`,
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    res.status(500).json({
      error: 'Erro ao enviar notificação',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * POST /api/notificacoes/cobranca
 * Envia notificação de cobrança apenas para administradores
 */
router.post('/cobranca', async (req: Request, res: Response) => {
  try {
    const { emailCliente, nomeCliente, valor, dataVencimento, descricao, emailsAdmins } = req.body;

    if (!emailCliente || !nomeCliente || !valor || !dataVencimento) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    // Apenas enviar notificação se há emails de admins
    if (!emailsAdmins || emailsAdmins.length === 0) {
      return res.json({ sucesso: false, mensagem: 'Nenhum administrador para notificar' });
    }

    let sucessoCount = 0;
    for (const emailAdmin of emailsAdmins) {
      const sucesso = await emailService.notificarCobranca(
        emailAdmin,
        nomeCliente,
        valor,
        dataVencimento,
        descricao
      );
      if (sucesso) sucessoCount++;
    }

    res.json({
      sucesso: sucessoCount > 0,
      mensagem: `Notificação enviada para ${sucessoCount} administrador(es)`,
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    res.status(500).json({
      error: 'Erro ao enviar notificação',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * POST /api/notificacoes/pagamento-recebido
 * Envia notificação de pagamento recebido
 */
router.post('/pagamento-recebido', async (req: Request, res: Response) => {
  try {
    const { emailCliente, nomeCliente, valor, data, referencia } = req.body;

    if (!emailCliente || !nomeCliente || !valor || !data) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const sucesso = await emailService.notificarPagamentoRecebido(
      emailCliente,
      nomeCliente,
      valor,
      data,
      referencia
    );

    res.json({ sucesso, mensagem: 'Notificação de pagamento enviada' });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    res.status(500).json({
      error: 'Erro ao enviar notificação',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * POST /api/notificacoes/novo-usuario
 * Envia notificação de novo usuário
 */
router.post('/novo-usuario', async (req: Request, res: Response) => {
  try {
    const { emailUsuario, nomeUsuario, loginUrl } = req.body;

    if (!emailUsuario || !nomeUsuario || !loginUrl) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const sucesso = await emailService.notificarNovoUsuario(
      emailUsuario,
      nomeUsuario,
      loginUrl
    );

    res.json({ sucesso, mensagem: 'Notificação de boas-vindas enviada' });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    res.status(500).json({
      error: 'Erro ao enviar notificação',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * POST /api/notificacoes/resumo-consumo
 * Envia resumo de consumo
 */
router.post('/resumo-consumo', async (req: Request, res: Response) => {
  try {
    const { emailUsuario, nomeUsuario, totalConsumo, periodo, detalhes } = req.body;

    if (!emailUsuario || !nomeUsuario || totalConsumo === undefined || !periodo) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const sucesso = await emailService.notificarResumoConsumo(
      emailUsuario,
      nomeUsuario,
      totalConsumo,
      periodo,
      detalhes || []
    );

    res.json({ sucesso, mensagem: 'Resumo de consumo enviado' });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    res.status(500).json({
      error: 'Erro ao enviar notificação',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

export default router;
