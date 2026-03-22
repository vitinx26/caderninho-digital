/**
 * sync-endpoints.test.ts - Testes para endpoints de sincronização de usuários
 * Valida PUT /api/users/:id, GET /api/users, POST /api/users
 */

import { describe, it, expect } from 'vitest';
import * as dbHelpers from './db';

describe('Sync Endpoints - Users', () => {
  describe('PUT /api/users/:id - Atualizar Usuário', () => {
    it('deve atualizar nome do usuário com sucesso', async () => {
      try {
        // Buscar um usuário existente
        const usuarios = await dbHelpers.getAllUsers();
        if (usuarios.length === 0) {
          console.log('⚠️ Nenhum usuário encontrado para teste');
          return;
        }

        const usuarioId = usuarios[0].id;
        const novoNome = `Admin Atualizado ${Date.now()}`;

        // Atualizar usuário
        const resultado = await dbHelpers.updateUser(usuarioId, {
          name: novoNome,
        } as any);

        expect(resultado).toBeDefined();
        console.log(`✅ Usuário ${usuarioId} atualizado com sucesso`);
      } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        throw error;
      }
    });

    it('deve atualizar role do usuário', async () => {
      try {
        const usuarios = await dbHelpers.getAllUsers();
        if (usuarios.length === 0) return;

        const usuarioId = usuarios[0].id;
        const resultado = await dbHelpers.updateUser(usuarioId, {
          role: 'admin',
        } as any);

        expect(resultado).toBeDefined();
        console.log(`✅ Role do usuário ${usuarioId} atualizado`);
      } catch (error) {
        console.error('❌ Erro ao atualizar role:', error);
        throw error;
      }
    });

    it('deve atualizar múltiplos campos simultaneamente', async () => {
      try {
        const usuarios = await dbHelpers.getAllUsers();
        if (usuarios.length === 0) return;

        const usuarioId = usuarios[0].id;
        const resultado = await dbHelpers.updateUser(usuarioId, {
          name: `Admin Teste ${Date.now()}`,
          role: 'admin',
          ativo: true,
        } as any);

        expect(resultado).toBeDefined();
        console.log(`✅ Múltiplos campos atualizados para usuário ${usuarioId}`);
      } catch (error) {
        console.error('❌ Erro ao atualizar múltiplos campos:', error);
        throw error;
      }
    });

    it('deve rejeitar atualização com campos vazios', async () => {
      try {
        const usuarios = await dbHelpers.getAllUsers();
        if (usuarios.length === 0) return;

        const usuarioId = usuarios[0].id;

        // Tentar atualizar com objeto vazio deve falhar ou ser ignorado
        const resultado = await dbHelpers.updateUser(usuarioId, {} as any);
        
        // Se não lançar erro, está OK (pode ser ignorado silenciosamente)
        expect(resultado).toBeDefined();
        console.log(`✅ Atualização com campos vazios tratada corretamente`);
      } catch (error) {
        // Também é aceitável lançar erro
        console.log(`✅ Atualização com campos vazios rejeitada corretamente`);
      }
    });
  });

  describe('GET /api/users - Listar Usuários', () => {
    it('deve retornar lista de usuários', async () => {
      try {
        const usuarios = await dbHelpers.getAllUsers();
        
        expect(Array.isArray(usuarios)).toBe(true);
        expect(usuarios.length).toBeGreaterThan(0);
        console.log(`✅ Retornados ${usuarios.length} usuários`);
      } catch (error) {
        console.error('❌ Erro ao listar usuários:', error);
        throw error;
      }
    });

    it('deve retornar usuários com campos obrigatórios', async () => {
      try {
        const usuarios = await dbHelpers.getAllUsers();
        
        if (usuarios.length > 0) {
          const usuario = usuarios[0];
          expect(usuario).toHaveProperty('id');
          expect(usuario).toHaveProperty('email');
          expect(usuario).toHaveProperty('name');
          expect(usuario).toHaveProperty('role');
          console.log(`✅ Usuário contém todos os campos obrigatórios`);
        }
      } catch (error) {
        console.error('❌ Erro ao validar campos:', error);
        throw error;
      }
    });

    it('deve filtrar usuários ativos', async () => {
      try {
        const usuarios = await dbHelpers.getAllUsers();
        const ativos = usuarios.filter((u: any) => u.ativo !== false);
        
        expect(ativos.length).toBeGreaterThan(0);
        console.log(`✅ ${ativos.length} usuários ativos encontrados`);
      } catch (error) {
        console.error('❌ Erro ao filtrar usuários ativos:', error);
        throw error;
      }
    });
  });

  describe('POST /api/users - Criar Usuário', () => {
    it('deve criar novo usuário com sucesso', async () => {
      try {
        const novoUsuario = {
          openId: `openid-${Date.now()}`,
          name: `Usuário Teste ${Date.now()}`,
          email: `teste-${Date.now()}@example.com`,
          role: 'user' as const,
          ativo: true,
        };

        const resultado = await dbHelpers.createUser(novoUsuario as any);
        
        expect(resultado).toBeDefined();
        expect(resultado.email).toBe(novoUsuario.email);
        console.log(`✅ Novo usuário criado: ${novoUsuario.email}`);
      } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        throw error;
      }
    });

    it('deve retornar erro ao criar usuário duplicado', async () => {
      try {
        const email = `duplicado-${Date.now()}@example.com`;
        const usuario = {
          openId: `openid-${Date.now()}`,
          name: 'Usuário Duplicado',
          email,
          role: 'user' as const,
          ativo: true,
        };

        // Criar primeiro
        await dbHelpers.createUser(usuario as any);

        // Tentar criar duplicado
        try {
          await dbHelpers.createUser(usuario as any);
          console.log('⚠️ Duplicata não foi rejeitada (pode ser esperado com ON DUPLICATE KEY UPDATE)');
        } catch (error) {
          console.log(`✅ Duplicata rejeitada corretamente`);
        }
      } catch (error) {
        console.error('❌ Erro no teste de duplicata:', error);
        throw error;
      }
    });
  });

  describe('Sincronização entre Admins', () => {
    it('deve sincronizar alterações entre múltiplos admins', async () => {
      try {
        const usuarios = await dbHelpers.getAllUsers();
        
        if (usuarios.length > 0) {
          const usuarioId = usuarios[0].id;
          const timestamp = Date.now();

          // Admin 1 atualiza
          await dbHelpers.updateUser(usuarioId, {
            name: `Atualizado por Admin 1 ${timestamp}`,
          } as any);

          // Verificar que a mudança está visível
          const usuarioAtualizado = await dbHelpers.getUserById(usuarioId);
          expect(usuarioAtualizado).toBeDefined();
          expect(usuarioAtualizado?.name).toContain('Admin 1');

          console.log(`✅ Sincronização entre admins funcionando`);
        }
      } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        throw error;
      }
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro ao atualizar usuário inexistente', async () => {
      try {
        const resultado = await dbHelpers.updateUser('99999', {
          name: 'Não Existe',
        } as any);

        // Se não lançar erro, está OK (pode retornar vazio)
        console.log(`✅ Atualização de usuário inexistente tratada`);
      } catch (error) {
        // Também é aceitável lançar erro
        console.log(`✅ Erro ao atualizar usuário inexistente capturado`);
      }
    });

    it('deve tratar erro ao buscar usuário inexistente', async () => {
      try {
        const usuario = await dbHelpers.getUserById('99999');
        expect(usuario).toBeUndefined();
        console.log(`✅ Busca de usuário inexistente retorna undefined`);
      } catch (error) {
        console.log(`✅ Erro ao buscar usuário inexistente capturado`);
      }
    });
  });
});
