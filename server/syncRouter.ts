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
    
    // Filtrar por tipo se especificado
    let usuariosFiltrados = usuarios;
    if (tipo && (tipo === 'admin' || tipo === 'cliente')) {
      usuariosFiltrados = usuarios.filter((u: any) => u.tipo === tipo);
    }
    
    console.log(`✅ Retornando ${usuariosFiltrados.length} usuários`);
    
    // Remover senhas da resposta por segurança
    const usuariosSeguro = usuariosFiltrados.map((u: any) => ({
      id: u.id,
      email: u.email,
      nome: u.nome,
      tipo: u.tipo,
      telefone: u.telefone,
      nomeEstabelecimento: u.nomeEstabelecimento,
      emailNotificacao: u.emailNotificacao,
      dataCriacao: u.dataCriacao,
      dataAtualizacao: u.dataAtualizacao,
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

export default router;
