/**
 * Rotas de API para Notificações
 * Gerencia envio de notificações por email
 */

import { Router, Request, Response } from 'express';
import * as emailService from './emailService';

const router = Router();

/**
 * POST /api/notificacoes/novo-lancamento
 * Envia notificação de novo lançamento
 */
router.post('/novo-lancamento', async (req: Request, res: Response) => {
  try {
    const { emailUsuario, nomeUsuario, descricao, valor, data } = req.body;

    if (!emailUsuario || !nomeUsuario || !descricao || !valor) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const sucesso = await emailService.notificarNovoLancamento(
      emailUsuario,
      nomeUsuario,
      descricao,
      valor,
      data || new Date().toLocaleDateString('pt-BR')
    );

    res.json({ sucesso, mensagem: 'Notificação enviada' });
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
 * Envia notificação de cobrança
 */
router.post('/cobranca', async (req: Request, res: Response) => {
  try {
    const { emailCliente, nomeCliente, valor, dataVencimento, descricao } = req.body;

    if (!emailCliente || !nomeCliente || !valor || !dataVencimento) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const sucesso = await emailService.notificarCobranca(
      emailCliente,
      nomeCliente,
      valor,
      dataVencimento,
      descricao
    );

    res.json({ sucesso, mensagem: 'Notificação de cobrança enviada' });
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
