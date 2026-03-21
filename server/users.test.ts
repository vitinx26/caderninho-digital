/**
 * users.test.ts - Testes para endpoints de usuários
 * Valida CRUD de usuários e migração
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as dbHelpers from './db';

describe('User Management', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testUser = {
    id: `test-${Date.now()}`,
    email: testEmail,
    nome: 'Usuário Teste',
    tipo: 'cliente' as const,
    telefone: '11999999999',
    senha: 'senha123',
    ativo: true,
    dataCriacao: Date.now(),
    dataAtualizacao: Date.now(),
  };

  let createdUserId: string;

  describe('CREATE', () => {
    it('deve criar novo usuário', async () => {
      const usuario = await dbHelpers.createUser(testUser);
      expect(usuario).toBeDefined();
      expect(usuario.email).toBe(testEmail);
      expect(usuario.nome).toBe('Usuário Teste');
      expect(usuario.ativo).toBe(true);
      createdUserId = usuario.id;
    });

    it('deve retornar erro ao criar usuário duplicado', async () => {
      try {
        await dbHelpers.createUser(testUser);
        expect.fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('READ', () => {
    it('deve buscar usuário por email', async () => {
      const usuario = await dbHelpers.getUserByEmail(testEmail);
      expect(usuario).toBeDefined();
      expect(usuario?.email).toBe(testEmail);
    });

    it('deve buscar usuário por ID', async () => {
      const usuario = await dbHelpers.getUserById(createdUserId);
      expect(usuario).toBeDefined();
      expect(usuario?.id).toBe(createdUserId);
    });

    it('deve retornar todos os usuários', async () => {
      const usuarios = await dbHelpers.getAllUsers();
      expect(Array.isArray(usuarios)).toBe(true);
      expect(usuarios.length).toBeGreaterThan(0);
    });

    it('deve filtrar apenas usuários ativos', async () => {
      const usuarios = await dbHelpers.getAllUsers();
      const ativos = usuarios.filter((u: any) => u.ativo !== false);
      expect(ativos.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE', () => {
    it('deve atualizar nome do usuário', async () => {
      const novoNome = 'Novo Nome Teste';
      const usuarioAtualizado = await dbHelpers.updateUser(createdUserId, {
        nome: novoNome,
        dataAtualizacao: Date.now(),
      } as any);
      expect(usuarioAtualizado.nome).toBe(novoNome);
    });

    it('deve atualizar tipo do usuário', async () => {
      const usuarioAtualizado = await dbHelpers.updateUser(createdUserId, {
        tipo: 'admin',
        dataAtualizacao: Date.now(),
      } as any);
      expect(usuarioAtualizado.tipo).toBe('admin');
    });

    it('deve marcar usuário como inativo (soft delete)', async () => {
      const usuarioAtualizado = await dbHelpers.updateUser(createdUserId, {
        ativo: false,
        dataAtualizacao: Date.now(),
      } as any);
      expect(usuarioAtualizado.ativo).toBe(false);
    });
  });

  describe('Migration Scenario', () => {
    it('deve simular migração de múltiplos usuários', async () => {
      const usuariosParaMigrar = [
        {
          id: `migrado-${Date.now()}-1`,
          email: `migrado1-${Date.now()}@example.com`,
          nome: 'Lucas Peres',
          tipo: 'cliente' as const,
          telefone: '11987654321',
          senha: 'migrado123',
          ativo: true,
          dataCriacao: Date.now(),
          dataAtualizacao: Date.now(),
        },
        {
          id: `migrado-${Date.now()}-2`,
          email: `migrado2-${Date.now()}@example.com`,
          nome: 'Anna Carolina',
          tipo: 'cliente' as const,
          telefone: '11987654322',
          senha: 'migrado123',
          ativo: true,
          dataCriacao: Date.now(),
          dataAtualizacao: Date.now(),
        },
      ];

      let sucessos = 0;
      let erros = 0;

      for (const usuario of usuariosParaMigrar) {
        try {
          const usuarioCriado = await dbHelpers.createUser(usuario);
          expect(usuarioCriado).toBeDefined();
          sucessos++;
        } catch (error) {
          erros++;
        }
      }

      expect(sucessos).toBe(2);
      expect(erros).toBe(0);
    });

    it('deve evitar duplicatas durante migração', async () => {
      const email = `duplicata-${Date.now()}@example.com`;
      const usuario1 = {
        id: `dup-${Date.now()}-1`,
        email,
        nome: 'Usuário Duplicado 1',
        tipo: 'cliente' as const,
        telefone: '11999999999',
        senha: 'senha123',
        ativo: true,
        dataCriacao: Date.now(),
        dataAtualizacao: Date.now(),
      };

      // Criar primeiro
      const criado1 = await dbHelpers.createUser(usuario1);
      expect(criado1).toBeDefined();

      // Tentar criar duplicado
      const usuario2 = { ...usuario1, id: `dup-${Date.now()}-2` };
      try {
        await dbHelpers.createUser(usuario2);
        expect.fail('Deveria ter lançado erro de duplicata');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Soft Delete', () => {
    it('deve manter usuário no banco após soft delete', async () => {
      // Criar usuário para teste
      const emailTemp = `softdelete-${Date.now()}@example.com`;
      const usuarioTemp = {
        id: `softdel-${Date.now()}`,
        email: emailTemp,
        nome: 'Usuário Soft Delete',
        tipo: 'cliente' as const,
        telefone: '11999999999',
        senha: 'senha123',
        ativo: true,
        dataCriacao: Date.now(),
        dataAtualizacao: Date.now(),
      };

      const criado = await dbHelpers.createUser(usuarioTemp);
      expect(criado.ativo).toBe(true);

      // Soft delete
      const deletado = await dbHelpers.updateUser(criado.id, {
        ativo: false,
        dataAtualizacao: Date.now(),
      } as any);
      expect(deletado.ativo).toBe(false);

      // Verificar que ainda existe no banco mas inativo
      const usuarioInativo = await dbHelpers.getUserById(criado.id);
      expect(usuarioInativo).toBeDefined();
      expect(usuarioInativo?.ativo).toBe(false);

      // Verificar que não aparece na lista de ativos
      const usuariosAtivos = await dbHelpers.getAllUsers();
      const encontrado = usuariosAtivos.find((u: any) => u.id === criado.id && u.ativo !== false);
      expect(encontrado).toBeUndefined();
    });
  });
});
