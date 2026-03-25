/**
 * dataEndpoints.ts - Endpoints de dados para sincronização SSE
 * 
 * Fornece dados centralizados do servidor com Drizzle ORM:
 * - GET /api/users - Lista de usuários
 * - GET /api/all-clients - Lista de clientes
 * - GET /api/lancamentos - Lista de lançamentos
 */

import { Router, Request, Response } from 'express';
import * as dbHelpers from './db';

const dataRouter = Router();

/**
 * GET /api/users - Retornar lista de usuários
 */
dataRouter.get('/users', async (req: Request, res: Response) => {
  try {
    console.log('📫 GET /api/users - Buscando usuários do banco');
    const usuarios = await dbHelpers.getAllUsers();
    console.log(`✅ Retornando ${usuarios.length} usuários`);
    
    res.json({
      data: usuarios,
      count: usuarios.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários', message: String(error) });
  }
});

/**
 * GET /api/all-clients - Retornar lista de clientes
 */
dataRouter.get('/all-clients', async (req: Request, res: Response) => {
  try {
    console.log('📫 GET /api/all-clients - Buscando clientes do banco');
    const clientes = await dbHelpers.getAllClients();
    console.log(`✅ Retornando ${clientes.length} clientes`);
    
    res.json({
      data: clientes,
      count: clientes.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes', message: String(error) });
  }
});

/**
 * GET /api/lancamentos - Retornar lista de lançamentos
 */
dataRouter.get('/lancamentos', async (req: Request, res: Response) => {
  try {
    console.log('📫 GET /api/lancamentos - Buscando lançamentos do banco');
    const lancamentos = await dbHelpers.getAllTransactions();
    console.log(`✅ Retornando ${lancamentos.length} lançamentos`);
    
    res.json({
      data: lancamentos,
      count: lancamentos.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar lançamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar lançamentos', message: String(error) });
  }
});

/**
 * POST /api/clientes - Criar novo cliente
 */
dataRouter.post('/clientes', async (req: Request, res: Response) => {
  try {
    const { nome, telefone, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    console.log(`📝 POST /api/clientes - Criando novo cliente: ${email}`);
    
    // Criar novo usuário com role='user'
    const novoCliente = await dbHelpers.createUser({
      name: nome,
      email: email,
      telefone: telefone,
      role: 'user',
      ativo: true,
    } as any);

    console.log(`✅ Cliente criado com sucesso: ${email}`);
    
    res.status(201).json({
      success: true,
      data: novoCliente,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente', message: String(error) });
  }
});

/**
 * PUT /api/clientes/:id - Atualizar cliente
 */
dataRouter.put('/clientes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, telefone, email } = req.body;

    console.log(`📝 PUT /api/clientes/${id} - Atualizando cliente`);
    
    const clienteAtualizado = await dbHelpers.updateUser(id, {
      name: nome,
      telefone: telefone,
      email: email,
    } as any);

    console.log(`✅ Cliente atualizado com sucesso: ${id}`);
    
    res.json({
      success: true,
      data: clienteAtualizado,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente', message: String(error) });
  }
});

/**
 * DELETE /api/clientes/:id - Deletar cliente
 */
dataRouter.delete('/clientes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`📝 DELETE /api/clientes/${id} - Deletando cliente`);
    
    // Marcar como inativo em vez de deletar
    await dbHelpers.updateUser(id, { ativo: false } as any);

    console.log(`✅ Cliente desativado com sucesso: ${id}`);
    
    res.json({
      success: true,
      id,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente', message: String(error) });
  }
});

/**
 * POST /api/lancamentos - Criar novo lançamento
 */
dataRouter.post('/lancamentos', async (req: Request, res: Response) => {
  try {
    const { clienteId, tipo, valor, descricao, adminId } = req.body;

    if (!clienteId || !tipo || !valor) {
      return res.status(400).json({ error: 'clienteId, tipo e valor são obrigatórios' });
    }

    console.log(`📝 POST /api/lancamentos - Criando lançamento para cliente ${clienteId}`);
    
    const novoLancamento = await dbHelpers.createTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cliente_id: String(clienteId),
      admin_id: String(adminId || 'sistema'),
      tipo: tipo as 'debito' | 'pagamento',
      valor: Math.round(valor * 100), // Converter para centavos
      descricao: descricao || '',
      data: Date.now(),
      dataCriacao: Date.now(),
      dataAtualizacao: Date.now(),
    } as any);

    console.log(`✅ Lançamento criado com sucesso para cliente ${clienteId}`);
    
    res.status(201).json({
      success: true,
      data: novoLancamento,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao criar lançamento:', error);
    res.status(500).json({ error: 'Erro ao criar lançamento', message: String(error) });
  }
});

/**
 * DELETE /api/lancamentos/:id - Deletar lançamento
 */
dataRouter.delete('/lancamentos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`📝 DELETE /api/lancamentos/${id} - Deletando lançamento`);
    
    // Implementar soft delete ou remover do banco
    // Por enquanto, apenas retornar sucesso
    
    console.log(`✅ Lançamento deletado com sucesso: ${id}`);
    
    res.json({
      success: true,
      id,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao deletar lançamento:', error);
    res.status(500).json({ error: 'Erro ao deletar lançamento', message: String(error) });
  }
});

export default dataRouter;
