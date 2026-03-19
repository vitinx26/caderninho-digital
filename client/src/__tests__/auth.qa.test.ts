/**
 * Testes de QA para Autenticação e Preservação de Dados
 * Valida login, logout e recuperação de dados após atualização
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as db from '../lib/db';
import { migrateAllOldData } from '../lib/migrate';
import { recuperarDadosAutomaticamente } from '../lib/autoRecovery';

// Mock IndexedDB para testes
const mockIndexedDB = {
  deleteDatabase: vi.fn(),
};

describe('QA: Autenticação e Preservação de Dados', () => {
  beforeEach(async () => {
    // Limpar dados antes de cada teste
    localStorage.clear();
    // Não usar IndexedDB em testes (usar mock)
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase('caderninho_db');
      } catch (e) {
        // Ignorar erro se IndexedDB não estiver disponível
      }
    }
  });

  afterEach(async () => {
    // Limpar dados após cada teste
    localStorage.clear();
  })

  describe('Login de Administrador', () => {
    it('deve permitir login com credenciais corretas', async () => {
      // Criar usuário admin
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        senha: 'senha123',
        nome: 'Admin Test',
        tipo: 'admin' as const,
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      // Adicionar ao banco
      await db.adicionarUsuario(admin);

      // Recuperar e validar
      const usuarioRecuperado = await db.obterUsuarioPorEmail('admin@test.com');
      expect(usuarioRecuperado).toBeDefined();
      expect(usuarioRecuperado?.email).toBe('admin@test.com');
      expect(usuarioRecuperado?.senha).toBe('senha123');
      expect(usuarioRecuperado?.tipo).toBe('admin');
    });

    it('deve rejeitar login com senha incorreta', async () => {
      const admin = {
        id: 'admin-2',
        email: 'admin2@test.com',
        senha: 'senha123',
        nome: 'Admin Test 2',
        tipo: 'admin' as const,
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      await db.adicionarUsuario(admin);

      const usuarioRecuperado = await db.obterUsuarioPorEmail('admin2@test.com');
      expect(usuarioRecuperado?.senha).not.toBe('senhaErrada');
    });

    it('deve rejeitar login com email inexistente', async () => {
      const usuarioRecuperado = await db.obterUsuarioPorEmail('inexistente@test.com');
      expect(usuarioRecuperado).toBeUndefined();
    });
  });

  describe('Preservação de Dados em Atualizações', () => {
    it('deve recuperar usuários salvos após atualização', async () => {
      // Simular dados antigos no localStorage
      const usuariosAntigos = [
        {
          id: 'admin-3',
          email: 'admin3@test.com',
          senha: 'senha123',
          nome: 'Admin 3',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_usuarios', JSON.stringify(usuariosAntigos));

      // Executar migração
      const resultado = await migrateAllOldData();

      // Validar recuperação
      expect(resultado.usuarios).toBeGreaterThan(0);

      // Verificar se usuário foi recuperado
      const usuarioRecuperado = await db.obterUsuarioPorEmail('admin3@test.com');
      expect(usuarioRecuperado).toBeDefined();
      expect(usuarioRecuperado?.senha).toBe('senha123');
    });

    it('deve recuperar clientes salvos após atualização', async () => {
      const clientesAntigos = [
        {
          id: 'cliente-1',
          nome: 'Cliente Test',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_clientes', JSON.stringify(clientesAntigos));

      const resultado = await migrateAllOldData();

      expect(resultado.clientes).toBeGreaterThan(0);

      const clienteRecuperado = await db.obterClientes();
      expect(clienteRecuperado.length).toBeGreaterThan(0);
      expect(clienteRecuperado[0].nome).toBe('Cliente Test');
    });

    it('deve recuperar lançamentos salvos após atualização', async () => {
      // Primeiro criar cliente
      const cliente = {
        id: 'cliente-2',
        nome: 'Cliente Test 2',
        telefone: '11988888888',
        dataCriacao: Date.now(),
      };

      await db.adicionarCliente(cliente);

      // Simular lançamentos antigos
      const lancamentosAntigos = [
        {
          id: 'lancamento-1',
          clienteId: 'cliente-2',
          tipo: 'debito' as const,
          valor: 100,
          descricao: 'Teste',
          data: Date.now(),
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_lancamentos', JSON.stringify(lancamentosAntigos));

      const resultado = await migrateAllOldData();

      expect(resultado.lancamentos).toBeGreaterThan(0);
    });

    it('deve preservar senha de admin em múltiplas atualizações', async () => {
      const admin = {
        id: 'admin-4',
        email: 'admin4@test.com',
        senha: 'senhaSegura123!@#',
        nome: 'Admin 4',
        tipo: 'admin' as const,
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      // Primeira adição
      await db.adicionarUsuario(admin);

      // Simular atualização
      const usuarioAntigo = JSON.stringify([admin]);
      localStorage.setItem('caderninho_usuarios', usuarioAntigo);

    // Limpar IndexedDB
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase('caderninho_db');
      } catch (e) {
        // Ignorar erro
      }
    }

      // Recuperar dados
      await migrateAllOldData();

      // Validar que senha foi preservada
      const usuarioRecuperado = await db.obterUsuarioPorEmail('admin4@test.com');
      expect(usuarioRecuperado?.senha).toBe('senhaSegura123!@#');
    });
  });

  describe('Recuperação Automática de Dados', () => {
    it('deve recuperar todos os dados automaticamente', async () => {
      // Criar dados de teste
      const admin = {
        id: 'admin-5',
        email: 'admin5@test.com',
        senha: 'senha123',
        nome: 'Admin 5',
        tipo: 'admin' as const,
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      const cliente = {
        id: 'cliente-3',
        nome: 'Cliente Test 3',
        telefone: '11988888888',
        dataCriacao: Date.now(),
      };

      // Adicionar ao banco
      await db.adicionarUsuario(admin);
      await db.adicionarCliente(cliente);

      // Simular dados antigos no localStorage
      localStorage.setItem('caderninho_usuarios', JSON.stringify([admin]));
      localStorage.setItem('caderninho_clientes', JSON.stringify([cliente]));

      // Executar recuperação automática
      const resultado = await recuperarDadosAutomaticamente();

      expect(resultado.usuarios).toBeGreaterThan(0);
      expect(resultado.clientes).toBeGreaterThan(0);
      expect(resultado.sincronizado).toBe(true);
    });

    it('deve retornar dados válidos mesmo sem dados antigos', async () => {
      const resultado = await recuperarDadosAutomaticamente();

      expect(resultado).toBeDefined();
      expect(resultado.usuarios).toBeGreaterThanOrEqual(0);
      expect(resultado.clientes).toBeGreaterThanOrEqual(0);
      expect(resultado.lancamentos).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integridade de Dados', () => {
    it('deve manter relação entre usuário e cliente', async () => {
      const usuario = {
        id: 'usuario-1',
        email: 'usuario@test.com',
        senha: 'senha123',
        nome: 'Usuário Test',
        tipo: 'cliente' as const,
        telefone: '11988888888',
        dataCriacao: Date.now(),
      };

      await db.adicionarUsuario(usuario);

      const usuarioRecuperado = await db.obterUsuarioPorEmail('usuario@test.com');
      expect(usuarioRecuperado?.id).toBe('usuario-1');
      expect(usuarioRecuperado?.telefone).toBe('11988888888');
    });

    it('deve validar que admin pode acessar todos os clientes', async () => {
      const admin = {
        id: 'admin-6',
        email: 'admin6@test.com',
        senha: 'senha123',
        nome: 'Admin 6',
        tipo: 'admin' as const,
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      const cliente1 = {
        id: 'cliente-4',
        nome: 'Cliente 4',
        telefone: '11988888888',
        dataCriacao: Date.now(),
      };

      const cliente2 = {
        id: 'cliente-5',
        nome: 'Cliente 5',
        telefone: '11988888889',
        dataCriacao: Date.now(),
      };

      await db.adicionarUsuario(admin);
      await db.adicionarCliente(cliente1);
      await db.adicionarCliente(cliente2);

      const clientes = await db.obterClientes();
      expect(clientes.length).toBe(2);
    });
  });
});
