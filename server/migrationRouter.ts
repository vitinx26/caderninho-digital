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
 * GET /api/sync/test
 * Testar conexao com banco de dados
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    console.log('Testando conexao com banco...');
    const usuarios = await dbHelpers.getAllUsers();
    console.log(`Conexao OK! ${usuarios?.length || 0} usuarios encontrados`);
    res.json({
      success: true,
      message: 'Conexao com banco funcionando',
      usuariosCount: usuarios?.length || 0,
    });
  } catch (error) {
    console.error('Erro ao testar conexao:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao testar conexao',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/sync/migrate
 * Receber dados migrados de localStorage e salvar no banco centralizado
 */
router.post('/sync/migrate', async (req: Request, res: Response) => {
  try {
    const { usuario, clientes, lancamentos } = req.body;
    
    console.log(`📥 POST /api/sync/migrate - Recebendo migração de dados`);
    console.log(`   Usuario: ${usuario?.email || 'indefinido'}`);
    console.log(`   Clientes: ${clientes?.length || 0}`);
    console.log(`   Lançamentos: ${lancamentos?.length || 0}`);
    
    if (!usuario || !usuario.email) {
      console.error('❌ Erro: Dados de usuário inválidos');
      return res.status(400).json({
        success: false,
        error: 'Dados de usuário inválidos',
      });
    }
    
    try {
      // 1. Usar ID do usuário fornecido ou gerar novo
      const usuarioId = usuario.id || uuidv4();
      console.log(`➕ Preparando usuário: ${usuario.email} (ID: ${usuarioId})`);
      
      // Inserir usuário diretamente sem tentar buscar
      try {
        await dbHelpers.createUser({
          id: usuarioId,
          email: usuario.email,
          nome: usuario.nome || 'Usuário Migrado',
          tipo: usuario.tipo || 'admin',
          telefone: usuario.telefone || '',
          nomeEstabelecimento: usuario.nomeEstabelecimento || '',
          senha: usuario.senha || 'migrated',
          ativo: true,
          dataCriacao: usuario.dataCriacao || Date.now(),
          dataAtualizacao: usuario.dataAtualizacao || Date.now(),
        });
        console.log(`✅ Usuário processado: ${usuario.email}`);
      } catch (createErr) {
        console.error(`❌ Erro ao processar usuário:`, createErr);
        throw createErr;
      }
      
      // 2. Migrar clientes
      let clientesMigrados = 0;
      if (clientes && Array.isArray(clientes) && clientes.length > 0) {
        console.log(`📦 Migrando ${clientes.length} clientes...`);
        
        for (const cliente of clientes) {
          try {
            if (!cliente.nome) {
              console.warn(`⚠️ Cliente sem nome, pulando...`);
              continue;
            }
            
            const clienteId = cliente.id || uuidv4();
            
            await dbHelpers.createClient({
              id: clienteId,
              adminId: usuarioId,
              nome: cliente.nome,
              telefone: cliente.telefone || '',
              email: cliente.email || '',
              ativo: cliente.ativo !== false,
              dataCriacao: cliente.dataCriacao || Date.now(),
              dataAtualizacao: cliente.dataAtualizacao || Date.now(),
            });
            clientesMigrados++;
            console.log(`✅ Cliente migrado: ${cliente.nome}`);
          } catch (err) {
            console.error(`❌ Erro ao migrar cliente ${cliente.nome}:`, err);
          }
        }
      }
      
      // 3. Migrar lançamentos
      let lancamentosMigrados = 0;
      if (lancamentos && Array.isArray(lancamentos) && lancamentos.length > 0) {
        console.log(`📦 Migrando ${lancamentos.length} lançamentos...`);
        
        for (const lancamento of lancamentos) {
          try {
            if (!lancamento.clienteId || !lancamento.tipo || lancamento.valor === undefined) {
              console.warn(`⚠️ Lançamento inválido, pulando...`);
              continue;
            }
            
            const lancamentoId = lancamento.id || uuidv4();
            
            await dbHelpers.createTransaction({
              id: lancamentoId,
              adminId: usuarioId,
              clienteId: lancamento.clienteId,
              tipo: lancamento.tipo,
              valor: lancamento.valor,
              descricao: lancamento.descricao || '',
              data: lancamento.data || Date.now(),
              dataCriacao: lancamento.dataCriacao || Date.now(),
              dataAtualizacao: lancamento.dataAtualizacao || Date.now(),
            });
            lancamentosMigrados++;
            console.log(`✅ Lançamento migrado: ${lancamento.id}`);
          } catch (err) {
            console.error(`❌ Erro ao migrar lançamento ${lancamento.id}:`, err);
          }
        }
      }
      
      console.log(`✅ Migração concluída: ${clientesMigrados} clientes, ${lancamentosMigrados} lançamentos`);
      
      res.json({
        success: true,
        message: 'Migração concluída com sucesso',
        data: {
          usuarioId,
          usuarioEmail: usuario.email,
          clientesMigrados,
          lancamentosMigrados,
          total: clientesMigrados + lancamentosMigrados,
        },
        timestamp: Date.now(),
      });
    } catch (innerError) {
      console.error('❌ Erro interno na migração:', innerError);
      if (innerError instanceof Error) {
        console.error('Stack:', innerError.stack);
        console.error('Message:', innerError.message);
      }
      throw innerError;
    }
  } catch (error) {
    console.error('❌ Erro ao migrar dados:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Erro ao migrar dados',
      message: errorMessage,
      timestamp: Date.now(),
    });
  }
});

export default router;
