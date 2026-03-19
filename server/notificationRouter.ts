import { Router, Request, Response } from 'express';
import {
  notificarNovoLancamento,
  notificarCobranca,
  notificarPagamentoRecebido,
  notificarNovoUsuario,
  notificarResumoConsumo,
} from './emailService';
import * as dbHelpers from './db';

const router = Router();

/**
 * POST /api/notificacoes/novo-lancamento
 * Notificar novo lançamento registrado
 */
router.post('/novo-lancamento', async (req: Request, res: Response) => {
  try {
    const { clienteId, adminId, tipo, valor, descricao } = req.body;

    // Validação
    if (!clienteId || !tipo || !valor || !descricao) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
      });
    }

    // Buscar dados do cliente
    const cliente = await dbHelpers.getClientById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado',
      });
    }

    // Buscar emails dos administradores com emailNotificacao configurado
    console.log('\ud83d\udd0d Buscando administradores com email de notifica\u00e7\u00e3o...');
    const admins = await dbHelpers.getAllAdmins();
    console.log(`   Total de admins encontrados: ${admins.length}`);
    
    // Priorizar emailNotificacao, se n\u00e3o tiver, usar email principal
    const emailsAdmins = admins
      .filter((admin: any) => {
        const emailParaNotificar = admin.emailNotificacao || admin.email;
        return emailParaNotificar && emailParaNotificar.trim() !== '';
      })
      .map((admin: any) => admin.emailNotificacao || admin.email);

    console.log(`   Admins com email de notifica\u00e7\u00e3o: ${emailsAdmins.length}`);
    console.log(`   Emails: ${emailsAdmins.join(', ')}`);

    if (emailsAdmins.length === 0) {
      console.warn('\u26a0\ufe0f Nenhum administrador com email de notifica\u00e7\u00e3o configurado');
      return res.status(400).json({
        success: false,
        message: 'Nenhum administrador com email de notifica\u00e7\u00e3o configurado',
      });
    }

    // Enviar notificação para TODOS os admins
    console.log(`\ud83d\udce7 Enviando notificação para ${emailsAdmins.length} administrador(es)...`);
    const sucesso = await notificarNovoLancamento(
      emailsAdmins,
      cliente.nome,
      tipo,
      valor,
      descricao
    );

    if (sucesso) {
      console.log(`\u2705 Notificação enviada com sucesso para: ${emailsAdmins.join(', ')}`);
    } else {
      console.error(`\u274c Erro ao enviar notificação para: ${emailsAdmins.join(', ')}`);
    }

    res.json({
      success: sucesso,
      message: sucesso
        ? `Notificação enviada para ${emailsAdmins.length} administrador(es)`
        : 'Erro ao enviar notificação',
      adminsNotificados: emailsAdmins.length,
    });
  } catch (error) {
    console.error('Erro ao notificar novo lançamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: String(error),
    });
  }
});

/**
 * POST /api/notificacoes/cobranca
 * Notificar cobrança pendente
 */
router.post('/cobranca', async (req: Request, res: Response) => {
  try {
    const { clienteId, valor, descricao } = req.body;

    // Validação
    if (!clienteId || !valor || !descricao) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
      });
    }

    // Buscar dados do cliente
    const cliente = await dbHelpers.getClientById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado',
      });
    }

    // Buscar emails dos administradores
    const admins = await dbHelpers.getAllAdmins();
    const emailsAdmins = admins
      .filter((admin: any) => admin.email && admin.email.trim() !== '')
      .map((admin: any) => admin.email);

    if (emailsAdmins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum administrador com email configurado',
      });
    }

    // Enviar notificação
    const sucesso = await notificarCobranca(
      emailsAdmins,
      cliente.nome,
      valor,
      descricao
    );

    res.json({
      success: sucesso,
      message: sucesso
        ? 'Notificação enviada com sucesso'
        : 'Erro ao enviar notificação',
    });
  } catch (error) {
    console.error('Erro ao notificar cobrança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: String(error),
    });
  }
});

/**
 * POST /api/notificacoes/pagamento-recebido
 * Notificar pagamento recebido
 */
router.post('/pagamento-recebido', async (req: Request, res: Response) => {
  try {
    const { clienteId, valor } = req.body;

    // Validação
    if (!clienteId || !valor) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
      });
    }

    // Buscar dados do cliente
    const cliente = await dbHelpers.getClientById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado',
      });
    }

    // Buscar emails dos administradores
    const admins = await dbHelpers.getAllAdmins();
    const emailsAdmins = admins
      .filter((admin: any) => admin.email && admin.email.trim() !== '')
      .map((admin: any) => admin.email);

    if (emailsAdmins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum administrador com email configurado',
      });
    }

    // Enviar notificação
    const sucesso = await notificarPagamentoRecebido(emailsAdmins, cliente.nome, valor);

    res.json({
      success: sucesso,
      message: sucesso
        ? 'Notificação enviada com sucesso'
        : 'Erro ao enviar notificação',
    });
  } catch (error) {
    console.error('Erro ao notificar pagamento recebido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: String(error),
    });
  }
});

/**
 * POST /api/notificacoes/novo-usuario
 * Notificar novo usuário criado
 */
router.post('/novo-usuario', async (req: Request, res: Response) => {
  try {
    const { nomeUsuario, emailUsuario, tipo } = req.body;

    // Validação
    if (!nomeUsuario || !emailUsuario || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
      });
    }

    // Buscar emails dos administradores
    const admins = await dbHelpers.getAllAdmins();
    const emailsAdmins = admins
      .filter((admin: any) => admin.email && admin.email.trim() !== '')
      .map((admin: any) => admin.email);

    if (emailsAdmins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum administrador com email configurado',
      });
    }

    // Enviar notificação
    const sucesso = await notificarNovoUsuario(
      emailsAdmins,
      nomeUsuario,
      emailUsuario,
      tipo
    );

    res.json({
      success: sucesso,
      message: sucesso
        ? 'Notificação enviada com sucesso'
        : 'Erro ao enviar notificação',
    });
  } catch (error) {
    console.error('Erro ao notificar novo usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: String(error),
    });
  }
});

/**
 * POST /api/notificacoes/resumo-consumo
 * Enviar resumo de consumo periódico
 */
router.post('/resumo-consumo', async (req: Request, res: Response) => {
  try {
    const { clienteId, totalDebitos, totalPagamentos, saldoDevedor } = req.body;

    // Validação
    if (clienteId === undefined || totalDebitos === undefined || totalPagamentos === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
      });
    }

    // Buscar dados do cliente
    const cliente = await dbHelpers.getClientById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado',
      });
    }

    // Buscar emails dos administradores
    const admins = await dbHelpers.getAllAdmins();
    const emailsAdmins = admins
      .filter((admin: any) => admin.email && admin.email.trim() !== '')
      .map((admin: any) => admin.email);

    if (emailsAdmins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum administrador com email configurado',
      });
    }

    // Enviar notificação
    const sucesso = await notificarResumoConsumo(
      emailsAdmins,
      cliente.nome,
      totalDebitos,
      totalPagamentos,
      saldoDevedor
    );

    res.json({
      success: sucesso,
      message: sucesso
        ? 'Notificação enviada com sucesso'
        : 'Erro ao enviar notificação',
    });
  } catch (error) {
    console.error('Erro ao notificar resumo de consumo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: String(error),
    });
  }
});

export default router;
