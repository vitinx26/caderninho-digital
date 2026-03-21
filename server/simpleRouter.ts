/**
 * simpleRouter.ts - Endpoint simples para migração direta
 * Testa inserção direta no banco sem usar db.ts
 */

import { Router, Request, Response } from 'express';
import { db } from './db-client';
import { users, clients, transactions } from '../drizzle/schema';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/simple/migrate
 * Migração simples e direta
 */
router.post('/simple/migrate', async (req: Request, res: Response) => {
  try {
    const { usuario, clientes, lancamentos } = req.body;
    
    console.log(`📥 POST /api/simple/migrate - Recebendo migração`);
    console.log(`   Usuario: ${usuario?.email || 'indefinido'}`);
    console.log(`   Clientes: ${clientes?.length || 0}`);
    console.log(`   Lançamentos: ${lancamentos?.length || 0}`);
    
    if (!usuario || !usuario.email) {
      return res.status(400).json({
        success: false,
        error: 'Dados de usuário inválidos',
      });
    }
    
    const now = Date.now();
    let usuariosMigrados = 0;
    let clientesMigrados = 0;
    let lancamentosMigrados = 0;
    let erros: string[] = [];
    
    try {
      // 1. Inserir usuário
      console.log(`➕ Inserindo usuário: ${usuario.email}`);
      const usuarioId = usuario.id || uuidv4();
      
      await db.insert(users).values({
        id: usuarioId,
        email: usuario.email,
        nome: usuario.nome || 'Usuário Migrado',
        tipo: usuario.tipo || 'admin',
        telefone: usuario.telefone || '',
        nomeEstabelecimento: usuario.nomeEstabelecimento || '',
        senha: usuario.senha || 'migrated',
        ativo: true,
        dataCriacao: usuario.dataCriacao || now,
        dataAtualizacao: now,
      }).onDuplicateKeyUpdate({
        nome: usuario.nome || 'Usuário Migrado',
        tipo: usuario.tipo || 'admin',
        dataAtualizacao: now,
      });
      
      usuariosMigrados = 1;
      console.log(`✅ Usuário inserido: ${usuario.email}`);
      
      // 2. Inserir clientes
      if (clientes && Array.isArray(clientes) && clientes.length > 0) {
        console.log(`📦 Inserindo ${clientes.length} clientes...`);
        
        for (const cliente of clientes) {
          try {
            if (!cliente.nome) {
              console.warn(`⚠️ Cliente sem nome, pulando...`);
              continue;
            }
            
            const clienteId = cliente.id || uuidv4();
            
            await db.insert(clients).values({
              id: clienteId,
              adminId: usuarioId,
              nome: cliente.nome,
              telefone: cliente.telefone || '',
              email: cliente.email || '',
              ativo: cliente.ativo !== false,
              dataCriacao: cliente.dataCriacao || now,
              dataAtualizacao: now,
            }).onDuplicateKeyUpdate({
              nome: cliente.nome,
              dataAtualizacao: now,
            });
            
            clientesMigrados++;
            console.log(`✅ Cliente inserido: ${cliente.nome}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Erro ao inserir cliente: ${msg}`);
            erros.push(`Cliente ${cliente.nome}: ${msg}`);
          }
        }
      }
      
      // 3. Inserir lançamentos
      if (lancamentos && Array.isArray(lancamentos) && lancamentos.length > 0) {
        console.log(`📦 Inserindo ${lancamentos.length} lançamentos...`);
        
        for (const lancamento of lancamentos) {
          try {
            if (!lancamento.clienteId || !lancamento.tipo || lancamento.valor === undefined) {
              console.warn(`⚠️ Lançamento inválido, pulando...`);
              continue;
            }
            
            const lancamentoId = lancamento.id || uuidv4();
            
            await db.insert(transactions).values({
              id: lancamentoId,
              adminId: usuarioId,
              clienteId: lancamento.clienteId,
              tipo: lancamento.tipo,
              valor: lancamento.valor,
              descricao: lancamento.descricao || '',
              data: lancamento.data || now,
              dataCriacao: lancamento.dataCriacao || now,
              dataAtualizacao: now,
            }).onDuplicateKeyUpdate({
              descricao: lancamento.descricao || '',
              dataAtualizacao: now,
            });
            
            lancamentosMigrados++;
            console.log(`✅ Lançamento inserido: ${lancamento.id}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Erro ao inserir lançamento: ${msg}`);
            erros.push(`Lançamento ${lancamento.id}: ${msg}`);
          }
        }
      }
      
      console.log(`✅ Migração simples concluída: ${usuariosMigrados} usuários, ${clientesMigrados} clientes, ${lancamentosMigrados} lançamentos`);
      
      res.json({
        success: true,
        message: 'Migração concluída',
        data: {
          usuariosMigrados,
          clientesMigrados,
          lancamentosMigrados,
          total: usuariosMigrados + clientesMigrados + lancamentosMigrados,
          erros: erros.length > 0 ? erros : undefined,
        },
        timestamp: now,
      });
    } catch (innerError) {
      console.error('❌ Erro interno:', innerError);
      if (innerError instanceof Error) {
        console.error('Stack:', innerError.stack);
        console.error('Message:', innerError.message);
      }
      throw innerError;
    }
  } catch (error) {
    console.error('❌ Erro ao migrar:', error);
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
