/**
 * migrateUsersRouter.ts - Endpoint para migrar usuários do IndexedDB para o banco
 * Insere dados diretamente na tabela users sem usar funções do db.ts
 */

import { Router, Request, Response } from 'express';
import { db } from './db-client';

const router = Router();

/**
 * POST /api/migrate-users
 * Migra usuários do IndexedDB para a tabela users
 */
router.post('/migrate-users', async (req: Request, res: Response) => {
  try {
    const { usuarios = [] } = req.body;
    
    console.log(`\n=== MIGRACAO DE USUARIOS ===`);
    console.log(`Total de usuarios: ${usuarios.length}`);
    
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum usuário fornecido',
      });
    }
    
    let usuariosMigrados = 0;
    let erros: string[] = [];
    
    for (const usuario of usuarios) {
      try {
        if (!usuario.email) {
          console.warn(`⚠️ Usuario sem email, pulando`);
          continue;
        }
        
        console.log(`\n📝 Processando: ${usuario.email}`);
        
        // Inserir ou atualizar usuário diretamente no banco
        const query = `
          INSERT INTO users (openId, name, email, loginMethod, role, ativo)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            role = VALUES(role),
            ativo = VALUES(ativo)
        `;
        
        const openId = Math.random().toString(36).substr(2, 9);
        const role = usuario.tipo === 'admin' ? 'admin' : 'user';
        
        console.log(`   openId: ${openId}`);
        console.log(`   email: ${usuario.email}`);
        console.log(`   name: ${usuario.nome}`);
        console.log(`   role: ${role}`);
        
        // Executar query diretamente
        const result = await db.execute(query, [
          openId,
          usuario.nome || 'Usuario Migrado',
          usuario.email,
          'manual',
          role,
          true,
        ]);
        
        usuariosMigrados++;
        console.log(`✅ Usuario inserido: ${usuario.email}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Erro ao migrar ${usuario.email}: ${msg}`);
        erros.push(`${usuario.email}: ${msg}`);
      }
    }
    
    console.log(`\n✅ MIGRACAO CONCLUIDA`);
    console.log(`   Usuarios migrados: ${usuariosMigrados}`);
    console.log(`   Erros: ${erros.length}`);
    console.log('=== FIM MIGRACAO ===\n');
    
    res.json({
      success: true,
      message: 'Migração concluída',
      data: {
        usuariosMigrados,
        total: usuarios.length,
        erros: erros.length > 0 ? erros : undefined,
      },
      timestamp: Date.now(),
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
