/**
 * dataEndpoints.ts - Endpoints de dados para sincronização SSE
 * 
 * Fornece dados centralizados do servidor:
 * - GET /api/users - Lista de usuários
 * - GET /api/all-clients - Lista de clientes
 * - GET /api/lancamentos - Lista de lançamentos
 */

import { Router, Request, Response } from 'express';

const dataRouter = Router();

/**
 * GET /api/users - Retornar lista de usuários
 */
dataRouter.get('/users', async (req: Request, res: Response) => {
  try {
    // TODO: Implementar busca real do banco de dados
    // Por enquanto, retornar array vazio
    const usuarios: any[] = [];
    
    res.json(usuarios);
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

/**
 * GET /api/all-clients - Retornar lista de clientes
 */
dataRouter.get('/all-clients', async (req: Request, res: Response) => {
  try {
    // TODO: Implementar busca real do banco de dados
    // Por enquanto, retornar array vazio
    const clientes: any[] = [];
    
    res.json(clientes);
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

/**
 * GET /api/lancamentos - Retornar lista de lançamentos
 */
dataRouter.get('/lancamentos', async (req: Request, res: Response) => {
  try {
    // TODO: Implementar busca real do banco de dados
    // Por enquanto, retornar array vazio
    const lancamentos: any[] = [];
    
    res.json(lancamentos);
  } catch (error) {
    console.error('❌ Erro ao buscar lançamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar lançamentos' });
  }
});

/**
 * POST /api/clientes - Criar novo cliente
 */
dataRouter.post('/clientes', async (req: Request, res: Response) => {
  try {
    const { nome, telefone, email } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // TODO: Implementar criação real no banco de dados
    const novoCliente = {
      id: `cliente_${Date.now()}`,
      nome,
      telefone,
      email,
      dataCriacao: new Date(),
    };

    res.status(201).json(novoCliente);
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

/**
 * PUT /api/clientes/:id - Atualizar cliente
 */
dataRouter.put('/clientes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, telefone, email } = req.body;

    // TODO: Implementar atualização real no banco de dados
    const clienteAtualizado = {
      id,
      nome,
      telefone,
      email,
      dataAtualizacao: new Date(),
    };

    res.json(clienteAtualizado);
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

/**
 * DELETE /api/clientes/:id - Deletar cliente
 */
dataRouter.delete('/clientes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implementar deleção real no banco de dados
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

/**
 * POST /api/lancamentos - Criar novo lançamento
 */
dataRouter.post('/lancamentos', async (req: Request, res: Response) => {
  try {
    const { clienteId, tipo, valor, descricao } = req.body;

    if (!clienteId || !tipo || !valor) {
      return res.status(400).json({ error: 'clienteId, tipo e valor são obrigatórios' });
    }

    // TODO: Implementar criação real no banco de dados
    const novoLancamento = {
      id: `lancamento_${Date.now()}`,
      clienteId,
      tipo,
      valor,
      descricao,
      dataCriacao: new Date(),
    };

    res.status(201).json(novoLancamento);
  } catch (error) {
    console.error('❌ Erro ao criar lançamento:', error);
    res.status(500).json({ error: 'Erro ao criar lançamento' });
  }
});

/**
 * DELETE /api/lancamentos/:id - Deletar lançamento
 */
dataRouter.delete('/lancamentos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implementar deleção real no banco de dados
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Erro ao deletar lançamento:', error);
    res.status(500).json({ error: 'Erro ao deletar lançamento' });
  }
});

export default dataRouter;
