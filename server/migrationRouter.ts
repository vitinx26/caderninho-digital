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
      // 1. Garantir que usuário existe no banco (ou atualizar se já existe)
      let usuarioExistente = await dbHelpers.getUserByEmail(usuario.email);
      
      if (!usuarioExistente) {
        console.log(`➕ Criando novo usuário: ${usuario.email}`);
        const novoUsuarioId = usuario.id || uuidv4();
        
        try {
          await dbHelpers.createUser({
            id: novoUsuarioId,
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
          
          usuarioExistente = await dbHelpers.getUserByEmail(usuario.email);
          console.log(`✅ Usuário criado: ${usuario.email}`);
        } catch (createErr) {
          console.error(`❌ Erro ao criar usuário:`, createErr);
          // Se falhar ao criar, tenta buscar novamente (pode ter sido criado por outro request)
          usuarioExistente = await dbHelpers.getUserByEmail(usuario.email);
          if (!usuarioExistente) {
            throw createErr;
          }
        }
      } else {
        console.log(`✓ Usuário já existe: ${usuario.email}`);
      }
      
      const usuarioId = usuarioExistente?.id;
      
      if (!usuarioId) {
        throw new Error('Não foi possível obter ID do usuário após criação');
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
            
            const clienteExistente = await dbHelpers.getClientById(cliente.id);
            
            if (!clienteExistente) {
              await dbHelpers.createClient({
                id: cliente.id || uuidv4(),
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
            } else {
              console.log(`⏭️ Cliente já existe: ${cliente.nome}`);
            }
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
            
            // Verificar se lançamento já existe
            const lancamentoExistente = await dbHelpers.getTransactionsByClientId(lancamento.clienteId);
            const jaExiste = lancamentoExistente?.some((l: any) => l.id === lancamento.id);
            
            if (!jaExiste) {
              await dbHelpers.createTransaction({
                id: lancamento.id || uuidv4(),
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
            } else {
              console.log(`⏭️ Lançamento já existe: ${lancamento.id}`);
            }
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
