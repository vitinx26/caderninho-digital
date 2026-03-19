/**
 * migrationRouter.ts - Endpoints para migração de dados de localStorage para servidor
 * 
 * POST /api/sync/migrate - Receber dados migrados do cliente
 */

import { Router, Request, Response } from 'express';
import * as dbHelpers from './db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/sync/migrate
 * Receber dados migrados de localStorage e salvar no banco centralizado
 */
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    const { usuario, clientes, lancamentos } = req.body;
    
    console.log(`📥 POST /api/sync/migrate - Recebendo migração de dados`);
    console.log(`   Usuario: ${usuario.email}`);
    console.log(`   Clientes: ${clientes?.length || 0}`);
    console.log(`   Lançamentos: ${lancamentos?.length || 0}`);
    
    if (!usuario || !usuario.email) {
      return res.status(400).json({
        success: false,
        error: 'Dados de usuário inválidos',
      });
    }
    
    // 1. Garantir que usuário existe no banco
    let usuarioExistente = await dbHelpers.getUserByEmail(usuario.email);
    
    if (!usuarioExistente) {
      console.log(`➕ Criando novo usuário: ${usuario.email}`);
      await dbHelpers.createUser({
        id: usuario.id || uuidv4(),
        email: usuario.email,
        nome: usuario.nome,
        tipo: usuario.tipo || 'admin',
        telefone: usuario.telefone,
        nomeEstabelecimento: usuario.nomeEstabelecimento,
        senha: 'migrated', // Placeholder - será atualizado pelo usuário
        dataCriacao: Date.now(),
        dataAtualizacao: Date.now(),
      });
      
      usuarioExistente = await dbHelpers.getUserByEmail(usuario.email);
    }
    
    const usuarioId = usuarioExistente?.id;
    
    // 2. Migrar clientes
    let clientesMigrados = 0;
    if (clientes && clientes.length > 0) {
      console.log(`📦 Migrando ${clientes.length} clientes...`);
      
      for (const cliente of clientes) {
        const clienteExistente = await dbHelpers.getClientById(cliente.id);
        
        if (!clienteExistente) {
          await dbHelpers.createClient({
            id: cliente.id,
            adminId: usuarioId!,
            nome: cliente.nome,
            telefone: cliente.telefone,
            email: cliente.email,
            ativo: cliente.ativo !== false,
            dataCriacao: cliente.dataCriacao || Date.now(),
            dataAtualizacao: cliente.dataAtualizacao || Date.now(),
          });
          clientesMigrados++;
        }
      }
    }
    
    // 3. Migrar lançamentos
    let lancamentosMigrados = 0;
    if (lancamentos && lancamentos.length > 0) {
      console.log(`📦 Migrando ${lancamentos.length} lançamentos...`);
      
      for (const lancamento of lancamentos) {
        // Verificar se lançamento já existe
        const lancamentoExistente = await dbHelpers.getTransactionsByAdminAndClient(
          usuarioId!,
          lancamento.clienteId
        );
        
        const jaExiste = lancamentoExistente.some((l: any) => l.id === lancamento.id);
        
        if (!jaExiste) {
          await dbHelpers.createTransaction({
            id: lancamento.id,
            adminId: usuarioId!,
            clienteId: lancamento.clienteId,
            tipo: lancamento.tipo,
            valor: lancamento.valor,
            descricao: lancamento.descricao,
            data: lancamento.data || Date.now(),
            dataCriacao: lancamento.dataCriacao || Date.now(),
            dataAtualizacao: lancamento.dataAtualizacao || Date.now(),
          });
          lancamentosMigrados++;
        }
      }
    }
    
    console.log(`✅ Migração concluída: ${clientesMigrados} clientes, ${lancamentosMigrados} lançamentos`);
    
    res.json({
      success: true,
      message: 'Migração concluída com sucesso',
      data: {
        usuarioId,
        clientesMigrados,
        lancamentosMigrados,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Erro ao migrar dados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao migrar dados',
      message: String(error),
    });
  }
});

export default router;
