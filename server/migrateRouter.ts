/**
 * migrateRouter.ts - Endpoint ÚNICO e ROBUSTO para migração de dados
 * 
 * POST /api/migrate - Receber dados do localStorage/IndexedDB e salvar no banco
 */

import { Router, Request, Response } from 'express';
import { db } from './db-client';
import { users, transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/migrate
 * Endpoint único para migração de todos os dados
 */
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    const { usuario, clientes = [], lancamentos = [] } = req.body;
    
    console.log('\n=== MIGRACAO DE DADOS ===');
    console.log(`Usuario: ${usuario?.email}`);
    console.log(`Clientes: ${clientes.length}`);
    console.log(`Lancamentos: ${lancamentos.length}`);
    
    // Validação básica
    if (!usuario?.email) {
      return res.status(400).json({
        success: false,
        error: 'Email do usuário é obrigatório',
      });
    }
    
    const now = Date.now();
    let resultado = {
      usuariosMigrados: 0,
      clientesMigrados: 0,
      lancamentosMigrados: 0,
      erros: [] as string[],
    };
    
    // 1. Inserir ou atualizar usuário
    try {
      console.log(`\n1. Processando usuario: ${usuario.email}`);
      
      const userData = {
        email: usuario.email,
        name: usuario.nome || usuario.name || 'Usuario Migrado',
        role: usuario.tipo === 'admin' ? 'admin' : 'user',
        openId: usuario.openId || uuidv4(),
        ativo: true,
      };
      
      console.log('   Dados a inserir:', JSON.stringify(userData, null, 2));
      
      // Tentar INSERT simples primeiro
      try {
        await db.insert(users).values(userData);
      } catch (dupErr: any) {
        // Se for erro de duplicata, atualizar
        if (dupErr?.code === 'ER_DUP_ENTRY') {
          console.log('   Usuário já existe, atualizando...');
          await db.update(users)
            .set({
              name: userData.name,
              role: userData.role,
            })
            .where(eq(users.email, userData.email));
        } else {
          throw dupErr;
        }
      }
      
      resultado.usuariosMigrados = 1;
      console.log(`   ✅ Usuario processado: ${usuario.email}`);
    } catch (err) {
      console.error(`   ❌ Erro completo:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Erro: ${msg}`);
      resultado.erros.push(`Usuario: ${msg}`);
    }
    
    // 2. Inserir clientes
    if (clientes.length > 0) {
      console.log(`\n2. Processando ${clientes.length} clientes`);
      
      for (const cliente of clientes) {
        try {
          if (!cliente.nome) {
            console.warn(`   ⚠️ Cliente sem nome, pulando`);
            continue;
          }
          
          const clienteId = cliente.id || uuidv4();
          
          // Clientes agora são users com role='user'
          await db.insert(users).values({
            id: parseInt(clienteId.substring(0, 10)) || undefined, // Converter UUID para int se possível
            name: cliente.nome,
            telefone: cliente.telefone || '',
            email: cliente.email || '',
            ativo: cliente.ativo !== false,
            role: 'user',
          }).onDuplicateKeyUpdate({
            name: cliente.nome,
          }).catch((err: any) => {
            console.warn(`   ⚠️ Erro ao migrar cliente ${cliente.nome}: ${err.message}`);
          });
          
          resultado.clientesMigrados++;
          console.log(`   ✅ Cliente: ${cliente.nome}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`   ❌ Cliente ${cliente.nome}: ${msg}`);
          resultado.erros.push(`Cliente ${cliente.nome}: ${msg}`);
        }
      }
    }
    
    // 3. Inserir lançamentos
    if (lancamentos.length > 0) {
      console.log(`\n3. Processando ${lancamentos.length} lancamentos`);
      
      for (const lancamento of lancamentos) {
        try {
          if (!lancamento.clienteId || !lancamento.tipo || lancamento.valor === undefined) {
            console.warn(`   ⚠️ Lancamento invalido, pulando`);
            continue;
          }
          
          const lancamentoId = lancamento.id || uuidv4();
          
          await db.insert(transactions).values({
            id: lancamentoId,
            admin_id: String(usuario.id || 1),
            cliente_id: lancamento.clienteId,
            tipo: lancamento.tipo,
            valor: lancamento.valor,
            descricao: lancamento.descricao || '',
            data: lancamento.data ? (typeof lancamento.data === 'number' ? lancamento.data : new Date(lancamento.data).getTime()) : Date.now(),
            dataCriacao: Date.now(),
            dataAtualizacao: Date.now(),
          }).onDuplicateKeyUpdate({
            descricao: lancamento.descricao || '',
            dataAtualizacao: Date.now(),
          }).catch((err: any) => {
            console.warn(`   ⚠️ Erro ao migrar lançamento ${lancamento.id}: ${err.message}`);
          });
          
          resultado.lancamentosMigrados++;
          console.log(`   ✅ Lancamento: ${lancamento.id}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`   ❌ Lancamento ${lancamento.id}: ${msg}`);
          resultado.erros.push(`Lancamento ${lancamento.id}: ${msg}`);
        }
      }
    }
    
    console.log(`\n✅ MIGRACAO CONCLUIDA`);
    console.log(`   Usuarios: ${resultado.usuariosMigrados}`);
    console.log(`   Clientes: ${resultado.clientesMigrados}`);
    console.log(`   Lancamentos: ${resultado.lancamentosMigrados}`);
    console.log(`   Erros: ${resultado.erros.length}`);
    if (resultado.erros.length > 0) {
      console.log(`   Detalhes dos erros:`);
      resultado.erros.forEach(err => console.log(`     - ${err}`));
    }
    console.log('=== FIM MIGRACAO ===\n');
    
    res.json({
      success: true,
      message: 'Migracao concluida',
      data: {
        usuarioEmail: usuario.email,
        ...resultado,
        total: resultado.usuariosMigrados + resultado.clientesMigrados + resultado.lancamentosMigrados,
      },
      timestamp: now,
    });
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Erro ao migrar',
      message: msg,
      timestamp: Date.now(),
    });
  }
});

export default router;
