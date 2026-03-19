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
    
    console.log(`📥 GET /api/users - tipo: ${tipo || 'todos'}`);
    
    // Buscar todos os usuários
    const usuarios = await dbHelpers.getAllAdmins(); // Retorna todos os usuários do tipo admin
    
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
 * Retorna clientes de um admin específico
 * 
 * Query params:
 * - adminId: string (obrigatório - ID do admin)
 * - ativo: 'true' | 'false' (opcional - filtrar por status)
 */
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const { adminId, ativo } = req.query;
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'adminId é obrigatório',
      });
    }
    
    console.log(`📥 GET /api/clients - adminId: ${adminId}, ativo: ${ativo || 'todos'}`);
    
    // Buscar clientes do admin
    const clientes = await dbHelpers.getClientsByAdminId(adminId as string);
    
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
      adminId,
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
 * Retorna transações de um admin específico
 * 
 * Query params:
 * - adminId: string (obrigatório - ID do admin)
 * - clienteId: string (opcional - filtrar por cliente)
 * - tipo: 'debito' | 'pagamento' (opcional - filtrar por tipo)
 * - dataInicio: number (opcional - timestamp em ms)
 * - dataFim: number (opcional - timestamp em ms)
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { adminId, clienteId, tipo, dataInicio, dataFim } = req.query;
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'adminId é obrigatório',
      });
    }
    
    console.log(`📥 GET /api/transactions - adminId: ${adminId}, clienteId: ${clienteId || 'todos'}`);
    
    // Buscar transações do admin
    const transacoes = await dbHelpers.getTransactionsByAdminId(adminId as string);
    
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
      adminId,
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
});

export default router;
