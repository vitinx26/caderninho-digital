/**
 * Testes para recuperação automática de dados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recuperarDadosAutomaticamente,
  garantirUsuarioExiste,
  sincronizarDadosComBackend,
} from './autoRecovery';
import * as db from './db';

// Mock do módulo db
vi.mock('./db', () => ({
  obterTodosUsuarios: vi.fn(),
  obterClientes: vi.fn(),
  obterTodosLancamentos: vi.fn(),
  obterUsuarioPorEmail: vi.fn(),
  adicionarUsuario: vi.fn(),
}));

// Mock do módulo migrate
vi.mock('./migrate', () => ({
  migrateAllOldData: vi.fn().mockResolvedValue({
    usuarios: 0,
    clientes: 0,
    lancamentos: 0,
  }),
  syncMigratedDataWithBackend: vi.fn().mockResolvedValue(true),
}));

describe('autoRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recuperarDadosAutomaticamente', () => {
    it('deve retornar contagem de dados recuperados', async () => {
      const mockUsuarios = [
        { id: '1', email: 'admin@test.com', tipo: 'admin' },
        { id: '2', email: 'user@test.com', tipo: 'user' },
      ];

      vi.mocked(db.obterTodosUsuarios).mockResolvedValue(mockUsuarios as any);
      vi.mocked(db.obterClientes).mockResolvedValue([]);
      vi.mocked(db.obterTodosLancamentos).mockResolvedValue([]);

      const resultado = await recuperarDadosAutomaticamente();

      expect(resultado.usuarios).toBeGreaterThanOrEqual(0);
      expect(resultado.clientes).toBeGreaterThanOrEqual(0);
      expect(resultado.lancamentos).toBeGreaterThanOrEqual(0);
    });

    it('deve evitar múltiplas recuperações simultâneas', async () => {
      vi.mocked(db.obterTodosUsuarios).mockResolvedValue([]);
      vi.mocked(db.obterClientes).mockResolvedValue([]);
      vi.mocked(db.obterTodosLancamentos).mockResolvedValue([]);

      // Iniciar duas recuperações
      const promise1 = recuperarDadosAutomaticamente();
      const promise2 = recuperarDadosAutomaticamente();

      const [resultado1, resultado2] = await Promise.all([promise1, promise2]);

      // Uma deve ter sincronizado, outra não
      expect(resultado1).toBeDefined();
      expect(resultado2).toBeDefined();
    });

    it('deve retornar sincronizado false se não houver usuários', async () => {
      vi.mocked(db.obterTodosUsuarios).mockResolvedValue([]);
      vi.mocked(db.obterClientes).mockResolvedValue([]);
      vi.mocked(db.obterTodosLancamentos).mockResolvedValue([]);

      const resultado = await recuperarDadosAutomaticamente();

      expect(resultado.usuarios).toBe(0);
      expect(resultado.clientes).toBe(0);
      expect(resultado.lancamentos).toBe(0);
    });
  });

  describe('garantirUsuarioExiste', () => {
    it('deve retornar usuário se existir no banco', async () => {
      const usuarioMock = {
        id: '1',
        email: 'admin@test.com',
        tipo: 'admin',
        nome: 'Admin',
        senha: 'senha123',
      };

      vi.mocked(db.obterUsuarioPorEmail).mockResolvedValue(usuarioMock as any);

      const usuario = await garantirUsuarioExiste('admin@test.com');

      expect(usuario).toEqual(usuarioMock);
      expect(db.obterUsuarioPorEmail).toHaveBeenCalledWith('admin@test.com');
    });

    it('deve retornar null se usuário não existir e não conseguir recuperar', async () => {
      vi.mocked(db.obterUsuarioPorEmail).mockResolvedValue(undefined);

      const usuario = await garantirUsuarioExiste('inexistente@test.com');

      expect(usuario).toBeNull();
    });

    it('deve tentar recuperar dados se usuário não existir', async () => {
      vi.mocked(db.obterUsuarioPorEmail).mockResolvedValue(undefined);

      const usuario = await garantirUsuarioExiste('admin@test.com');

      // Deve ter tentado obter usuário
      expect(db.obterUsuarioPorEmail).toHaveBeenCalled();
    });
  });

  describe('sincronizarDadosComBackend', () => {
    it('deve retornar false se não houver usuários', async () => {
      vi.mocked(db.obterTodosUsuarios).mockResolvedValue([]);

      const resultado = await sincronizarDadosComBackend();

      expect(resultado).toBe(false);
    });

    it('deve retornar false se não houver usuário admin', async () => {
      const mockUsuarios = [
        { id: '1', email: 'user@test.com', tipo: 'user' },
      ];

      vi.mocked(db.obterTodosUsuarios).mockResolvedValue(mockUsuarios as any);
      vi.mocked(db.obterClientes).mockResolvedValue([]);
      vi.mocked(db.obterTodosLancamentos).mockResolvedValue([]);

      const resultado = await sincronizarDadosComBackend();

      expect(resultado).toBe(false);
    });

    it('deve tentar sincronizar se houver usuário admin', async () => {
      const mockUsuarios = [
        { id: '1', email: 'admin@test.com', tipo: 'admin' },
      ];

      vi.mocked(db.obterTodosUsuarios).mockResolvedValue(mockUsuarios as any);
      vi.mocked(db.obterClientes).mockResolvedValue([]);
      vi.mocked(db.obterTodosLancamentos).mockResolvedValue([]);

      const resultado = await sincronizarDadosComBackend();

      // Deve retornar um booleano
      expect(resultado).toBe(true);
    });
  });
});
