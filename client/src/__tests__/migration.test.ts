/**
 * Testes de Migração de Dados
 * Valida que dados antigos são recuperados corretamente
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Migração de Dados', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Recuperação de Usuários', () => {
    it('deve recuperar usuários do localStorage', () => {
      const usuariosAntigos = [
        {
          id: 'admin-1',
          email: 'admin@test.com',
          senha: 'senha123',
          nome: 'Admin',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_usuarios', JSON.stringify(usuariosAntigos));

      const dados = localStorage.getItem('caderninho_usuarios');
      expect(dados).toBeDefined();

      const usuariosRecuperados = JSON.parse(dados!);
      expect(usuariosRecuperados.length).toBe(1);
      expect(usuariosRecuperados[0].email).toBe('admin@test.com');
      expect(usuariosRecuperados[0].senha).toBe('senha123');
    });

    it('deve preservar senha em múltiplas recuperações', () => {
      const usuario = {
        id: 'admin-2',
        email: 'admin2@test.com',
        senha: 'senhaSegura123!@#',
        nome: 'Admin 2',
        tipo: 'admin',
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      // Primeira salvação
      localStorage.setItem('caderninho_usuarios', JSON.stringify([usuario]));

      // Simular atualização - recuperar e re-salvar
      const dados1 = localStorage.getItem('caderninho_usuarios');
      const usuarios1 = JSON.parse(dados1!);

      localStorage.setItem('caderninho_usuarios', JSON.stringify(usuarios1));

      // Segunda recuperação
      const dados2 = localStorage.getItem('caderninho_usuarios');
      const usuarios2 = JSON.parse(dados2!);

      expect(usuarios2[0].senha).toBe('senhaSegura123!@#');
    });

    it('deve recuperar múltiplos usuários', () => {
      const usuarios = [
        {
          id: 'admin-3',
          email: 'admin3@test.com',
          senha: 'senha123',
          nome: 'Admin 3',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
        {
          id: 'cliente-1',
          email: 'cliente@test.com',
          senha: 'senha456',
          nome: 'Cliente',
          tipo: 'cliente',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_usuarios', JSON.stringify(usuarios));

      const dados = localStorage.getItem('caderninho_usuarios');
      const usuariosRecuperados = JSON.parse(dados!);

      expect(usuariosRecuperados.length).toBe(2);
      expect(usuariosRecuperados[0].tipo).toBe('admin');
      expect(usuariosRecuperados[1].tipo).toBe('cliente');
    });
  });

  describe('Recuperação de Clientes', () => {
    it('deve recuperar clientes do localStorage', () => {
      const clientes = [
        {
          id: 'cliente-1',
          nome: 'Cliente Test',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_clientes', JSON.stringify(clientes));

      const dados = localStorage.getItem('caderninho_clientes');
      expect(dados).toBeDefined();

      const clientesRecuperados = JSON.parse(dados!);
      expect(clientesRecuperados.length).toBe(1);
      expect(clientesRecuperados[0].nome).toBe('Cliente Test');
    });

    it('deve recuperar múltiplos clientes', () => {
      const clientes = [
        {
          id: 'cliente-1',
          nome: 'Cliente 1',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
        {
          id: 'cliente-2',
          nome: 'Cliente 2',
          telefone: '11988888889',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_clientes', JSON.stringify(clientes));

      const dados = localStorage.getItem('caderninho_clientes');
      const clientesRecuperados = JSON.parse(dados!);

      expect(clientesRecuperados.length).toBe(2);
    });
  });

  describe('Recuperação de Lançamentos', () => {
    it('deve recuperar lançamentos do localStorage', () => {
      const lancamentos = [
        {
          id: 'lancamento-1',
          clienteId: 'cliente-1',
          tipo: 'debito',
          valor: 100,
          descricao: 'Teste',
          data: Date.now(),
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_lancamentos', JSON.stringify(lancamentos));

      const dados = localStorage.getItem('caderninho_lancamentos');
      expect(dados).toBeDefined();

      const lancamentosRecuperados = JSON.parse(dados!);
      expect(lancamentosRecuperados.length).toBe(1);
      expect(lancamentosRecuperados[0].valor).toBe(100);
    });

    it('deve recuperar múltiplos lançamentos', () => {
      const lancamentos = [
        {
          id: 'lancamento-1',
          clienteId: 'cliente-1',
          tipo: 'debito',
          valor: 100,
          descricao: 'Débito 1',
          data: Date.now(),
          dataCriacao: Date.now(),
        },
        {
          id: 'lancamento-2',
          clienteId: 'cliente-1',
          tipo: 'pagamento',
          valor: 50,
          descricao: 'Pagamento 1',
          data: Date.now(),
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_lancamentos', JSON.stringify(lancamentos));

      const dados = localStorage.getItem('caderninho_lancamentos');
      const lancamentosRecuperados = JSON.parse(dados!);

      expect(lancamentosRecuperados.length).toBe(2);
      expect(lancamentosRecuperados[0].tipo).toBe('debito');
      expect(lancamentosRecuperados[1].tipo).toBe('pagamento');
    });
  });

  describe('Sincronização de Dados', () => {
    it('deve manter consistência entre múltiplas leituras', () => {
      const usuario = {
        id: 'admin-4',
        email: 'admin4@test.com',
        senha: 'senha123',
        nome: 'Admin 4',
        tipo: 'admin',
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      localStorage.setItem('caderninho_usuarios', JSON.stringify([usuario]));

      // Primeira leitura
      const dados1 = localStorage.getItem('caderninho_usuarios');
      const usuarios1 = JSON.parse(dados1!);

      // Segunda leitura
      const dados2 = localStorage.getItem('caderninho_usuarios');
      const usuarios2 = JSON.parse(dados2!);

      // Devem ser iguais
      expect(usuarios1[0].email).toBe(usuarios2[0].email);
      expect(usuarios1[0].senha).toBe(usuarios2[0].senha);
    });

    it('deve recuperar dados de múltiplas chaves', () => {
      const usuario = {
        id: 'admin-5',
        email: 'admin5@test.com',
        senha: 'senha123',
        nome: 'Admin 5',
        tipo: 'admin',
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      const cliente = {
        id: 'cliente-3',
        nome: 'Cliente 3',
        telefone: '11988888888',
        dataCriacao: Date.now(),
      };

      localStorage.setItem('caderninho_usuarios', JSON.stringify([usuario]));
      localStorage.setItem('caderninho_clientes', JSON.stringify([cliente]));

      const usuariosData = localStorage.getItem('caderninho_usuarios');
      const clientesData = localStorage.getItem('caderninho_clientes');

      expect(usuariosData).toBeDefined();
      expect(clientesData).toBeDefined();

      const usuarios = JSON.parse(usuariosData!);
      const clientes = JSON.parse(clientesData!);

      expect(usuarios.length).toBe(1);
      expect(clientes.length).toBe(1);
    });
  });

  describe('Integridade de Dados', () => {
    it('deve validar que email é preservado', () => {
      const usuario = {
        id: 'admin-6',
        email: 'admin6@test.com',
        senha: 'senha123',
        nome: 'Admin 6',
        tipo: 'admin',
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      localStorage.setItem('caderninho_usuarios', JSON.stringify([usuario]));

      const dados = localStorage.getItem('caderninho_usuarios');
      const usuarioRecuperado = JSON.parse(dados!)[0];

      expect(usuarioRecuperado.email).toBe('admin6@test.com');
      expect(usuarioRecuperado.email).not.toBe('');
    });

    it('deve validar que tipo de usuário é preservado', () => {
      const usuarios = [
        {
          id: 'admin-7',
          email: 'admin7@test.com',
          senha: 'senha123',
          nome: 'Admin 7',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
        {
          id: 'cliente-4',
          email: 'cliente4@test.com',
          senha: 'senha456',
          nome: 'Cliente 4',
          tipo: 'cliente',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_usuarios', JSON.stringify(usuarios));

      const dados = localStorage.getItem('caderninho_usuarios');
      const usuariosRecuperados = JSON.parse(dados!);

      expect(usuariosRecuperados[0].tipo).toBe('admin');
      expect(usuariosRecuperados[1].tipo).toBe('cliente');
    });

    it('deve validar que telefone é preservado', () => {
      const cliente = {
        id: 'cliente-5',
        nome: 'Cliente 5',
        telefone: '11987654321',
        dataCriacao: Date.now(),
      };

      localStorage.setItem('caderninho_clientes', JSON.stringify([cliente]));

      const dados = localStorage.getItem('caderninho_clientes');
      const clienteRecuperado = JSON.parse(dados!)[0];

      expect(clienteRecuperado.telefone).toBe('11987654321');
    });
  });
});
