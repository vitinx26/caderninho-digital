/**
 * syncRouter.ts - Endpoints REST para sincronização de dados
 * 
 * Fornece endpoints GET para sincronizar dados do servidor:
 * - GET /api/users - Retorna todos os usuários
 * - GET /api/clients - Retorna clientes de um admin
 * - GET /api/transactions - Retorna transações de um admin
 */

import { Router, Request, Response } from 'express';
import * as dbHelpers from './db';

const router = Router();

/**
 * GET /api/users
 * Retorna todos os usuários do sistema
 * 
 * Query params:
 * - tipo: 'admin' | 'cliente' (opcional - filtrar por tipo)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { tipo } = req.query;
    
    console.log(`📫 GET /api/users - tipo: ${tipo || 'todos'}`);
    
    // Buscar TODOS os usuários (não apenas admins)
    const usuarios = await dbHelpers.getAllUsers();
    
    // Filtrar apenas usuários ativos
    let usuariosFiltrados = usuarios.filter((u: any) => u.ativo !== false);
    
    // Filtrar por tipo se especificado (mapear cliente -> user, admin -> admin)
    if (tipo && typeof tipo === 'string') {
      const roleMap: any = { 'cliente': 'user', 'admin': 'admin' };
      const roleFilter = roleMap[tipo];
      if (roleFilter) {
        usuariosFiltrados = usuariosFiltrados.filter((u: any) => u.role === roleFilter);
      }
    }
    
    console.log(`✅ Retornando ${usuariosFiltrados.length} usuários`);
    
    // Remover senhas da resposta por segurança
    const usuariosSeguro = usuariosFiltrados.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      ativo: u.ativo,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    
    res.json({
      success: true,
      data: usuariosSeguro,
      count: usuariosSeguro.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuários',
      message: String(error),
    });
  }
});

/**
 * GET /api/all-clients
 * Retorna TODOS os clientes (de todos os admins)
 * Usado pela Conta Geral para sincronizar
 */
router.get('/all-clients', async (req: Request, res: Response) => {
  try {
    console.log(`📫 GET /api/all-clients`);
    
    // Buscar TODOS os clientes
    const clientes = await dbHelpers.getAllClients();
    
    // Filtrar apenas ativos
    const clientesAtivos = clientes.filter((c: any) => c.ativo !== false);
    
    console.log(`✅ Retornando ${clientesAtivos.length} clientes`);
    
    res.json({
      success: true,
      data: clientesAtivos,
      count: clientesAtivos.length,
      timestamp: Date.now(),
      source: 'backend',
    });
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar clientes',
      message: String(error),
    });
  }
});

/**
 * GET /api/clients
 * Retorna clientes de um admin específico (ou TODOS se não especificar)
 * 
 * Query params:
 * - adminId: string (opcional - ID do admin para filtrar)
 * - ativo: 'true' | 'false' (opcional - filtrar por status)
 */
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const { adminId, ativo } = req.query;
    
    console.log(`📫 GET /api/clients - adminId: ${adminId || 'TODOS'}, ativo: ${ativo || 'todos'}`);
    
    // Buscar TODOS os clientes (não apenas de um admin)
    let clientes = await dbHelpers.getAllClients();
    
    // Filtrar por admin se especificado
    if (adminId) {
      clientes = clientes.filter((c: any) => c.adminId === adminId);
    }
    
    // Filtrar por status se especificado
    let clientesFiltrados = clientes;
    if (ativo !== undefined) {
      const ativoBoolean = ativo === 'true';
      clientesFiltrados = clientes.filter((c: any) => c.ativo === ativoBoolean);
    }
    
    console.log(`✅ Retornando ${clientesFiltrados.length} clientes`);
    
    res.json({
      success: true,
      data: clientesFiltrados,
      count: clientesFiltrados.length,
      adminId: adminId || 'TODOS',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar clientes',
      message: String(error),
    });
  }
});

/**
 * GET /api/transactions
 * Retorna transações de um admin específico (ou TODAS se não especificar)
 * 
 * Query params:
 * - adminId: string (opcional - ID do admin para filtrar)
 * - clienteId: string (opcional - filtrar por cliente)
 * - tipo: 'debito' | 'pagamento' (opcional - filtrar por tipo)
 * - dataInicio: number (opcional - timestamp em ms)
 * - dataFim: number (opcional - timestamp em ms)
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { adminId, clienteId, tipo, dataInicio, dataFim } = req.query;
    
    console.log(`📫 GET /api/transactions - adminId: ${adminId || 'TODOS'}, clienteId: ${clienteId || 'todos'}`);
    
    // Buscar TODAS as transações (não apenas de um admin)
    let transacoes = await dbHelpers.getAllTransactions();
    
    // Filtrar por admin se especificado
    if (adminId) {
      transacoes = transacoes.filter((t: any) => t.adminId === adminId);
    }
    
    // Aplicar filtros
    let transacoesFiltradas = transacoes;
    
    // Filtrar por cliente
    if (clienteId) {
      transacoesFiltradas = transacoesFiltradas.filter((t: any) => t.clienteId === clienteId);
    }
    
    // Filtrar por tipo
    if (tipo && (tipo === 'debito' || tipo === 'pagamento')) {
      transacoesFiltradas = transacoesFiltradas.filter((t: any) => t.tipo === tipo);
    }
    
    // Filtrar por data
    if (dataInicio) {
      const inicio = parseInt(dataInicio as string);
      transacoesFiltradas = transacoesFiltradas.filter((t: any) => t.data >= inicio);
    }
    
    if (dataFim) {
      const fim = parseInt(dataFim as string);
      transacoesFiltradas = transacoesFiltradas.filter((t: any) => t.data <= fim);
    }
    
    console.log(`✅ Retornando ${transacoesFiltradas.length} transações`);
    
    res.json({
      success: true,
      data: transacoesFiltradas,
      count: transacoesFiltradas.length,
      adminId: adminId || 'TODOS',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar transações',
      message: String(error),
    });
  }
})

/**
 * GET /api/all-clients
 * Retorna TODOS os clientes de TODOS os admins
 * Útel para Conta Geral sincronizar com todos os clientes
 */
router.get('/all-clients', async (req: Request, res: Response) => {
  try {
    console.log(`📫 GET /api/all-clients - Retornando TODOS os clientes`);
    
    // Buscar TODOS os clientes
    const clientes = await dbHelpers.getAllClients();
    
    console.log(`✅ Retornando ${clientes.length} clientes (TODOS os admins)`);
    
    res.json({
      success: true,
      data: clientes,
      count: clientes.length,
      source: 'all-admins',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar todos os clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar clientes',
      message: String(error),
    });
  }
});

/**
 * POST /api/users
 * Criar novo usuário
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, nome, tipo, telefone, senha } = req.body;
    
    if (!email || !nome || !tipo || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Email, nome, tipo e senha são obrigatórios',
      });
    }
    
    // Verificar se email já existe
    const usuarioExistente = await dbHelpers.getUserByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado',
      });
    }
    
    const novoUsuario = await dbHelpers.createUser({
      email,
      name: nome || 'Usuário',
      role: tipo === 'admin' ? 'admin' : 'user',
      ativo: true,
    });
    
    console.log(`✅ Usuário criado: ${email}`);
    
    res.status(201).json({
      success: true,
      data: {
        id: novoUsuario.id,
        email: novoUsuario.email,
        name: novoUsuario.name,
        role: novoUsuario.role,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar usuário',
      message: String(error),
    });
  }
});

/**
 * PUT /api/users/:id
 * Atualizar usuário
 */
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📝 PUT /users/${id} - Body recebido:`, JSON.stringify(req.body, null, 2));
    const { name, role, ativo } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (ativo !== undefined) updateData.ativo = ativo;
    console.log(`📝 updateData:`, JSON.stringify(updateData, null, 2));
    if (Object.keys(updateData).length === 0) { console.warn(`⚠️ Nenhum campo para atualizar`); return res.status(400).json({ success: false, error: 'Nenhum campo para atualizar' }); }
    
    const usuarioAtualizado = await dbHelpers.updateUser(id, updateData as any);
    
    console.log(`✅ Usuário atualizado: ${id}`);
    
    res.json({
      success: true,
      data: usuarioAtualizado,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar usuário',
      message: String(error),
    });
  }
});

/**
 * DELETE /api/users/:id
 * Deletar usuário (soft delete - marca como ativo: false)
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Soft delete - marcar como inativo
    await dbHelpers.updateUser(id, {
      ativo: false,
      dataAtualizacao: Date.now(),
    } as any);
    
    console.log(`✅ Usuário deletado (soft delete): ${id}`);
    
    res.json({
      success: true,
      message: 'Usuário deletado com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar usuário',
      message: String(error),
    });
  }
});

export default router;
