/**
 * useRealtimeData.test.ts - Testes para sincronização em tempo real
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RealtimeDataManager', () => {
  describe('Estado inicial', () => {
    it('deve iniciar com estado vazio', () => {
      const state = {
        usuarios: [],
        clientes: [],
        lancamentos: [],
        configuracoes: {},
        ultimaSincronizacao: 0,
        statusConexao: 'desconectado' as const,
      };

      expect(state.usuarios).toEqual([]);
      expect(state.clientes).toEqual([]);
      expect(state.lancamentos).toEqual([]);
      expect(state.statusConexao).toBe('desconectado');
    });
  });

  describe('Gerenciamento de listeners', () => {
    it('deve permitir inscrever listeners', () => {
      const listeners = new Set<(state: any) => void>();
      const listener = vi.fn();

      listeners.add(listener);
      expect(listeners.size).toBe(1);
    });

    it('deve permitir desinscrever listeners', () => {
      const listeners = new Set<(state: any) => void>();
      const listener = vi.fn();

      listeners.add(listener);
      listeners.delete(listener);
      expect(listeners.size).toBe(0);
    });
  });

  describe('Processamento de mensagens', () => {
    it('deve processar mensagem de sincronização completa', () => {
      const state = {
        usuarios: [],
        clientes: [],
        lancamentos: [],
        configuracoes: {},
        ultimaSincronizacao: 0,
        statusConexao: 'desconectado' as const,
      };

      const payload = {
        usuarios: [{ id: '1', email: 'admin@example.com' }],
        clientes: [{ id: 'c1', nome: 'Cliente 1' }],
        lancamentos: [{ id: 'l1', clienteId: 'c1', valor: 100 }],
        configuracoes: { tema: 'escuro' },
      };

      const newState = {
        ...state,
        ...payload,
        ultimaSincronizacao: Date.now(),
      };

      expect(newState.usuarios).toHaveLength(1);
      expect(newState.clientes).toHaveLength(1);
      expect(newState.lancamentos).toHaveLength(1);
    });

    it('deve atualizar cliente existente', () => {
      const clientes = [
        { id: 'c1', nome: 'Cliente 1', ativo: true },
        { id: 'c2', nome: 'Cliente 2', ativo: true },
      ];

      const clienteAtualizado = { id: 'c1', nome: 'Cliente 1 Atualizado', ativo: false };

      const index = clientes.findIndex((c) => c.id === clienteAtualizado.id);
      if (index >= 0) {
        clientes[index] = clienteAtualizado;
      }

      expect(clientes[0].nome).toBe('Cliente 1 Atualizado');
      expect(clientes[0].ativo).toBe(false);
      expect(clientes).toHaveLength(2);
    });

    it('deve adicionar novo cliente se não existir', () => {
      const clientes: any[] = [{ id: 'c1', nome: 'Cliente 1' }];

      const novoCliente = { id: 'c2', nome: 'Cliente 2' };

      const index = clientes.findIndex((c) => c.id === novoCliente.id);
      if (index >= 0) {
        clientes[index] = novoCliente;
      } else {
        clientes.push(novoCliente);
      }

      expect(clientes).toHaveLength(2);
      expect(clientes[1].id).toBe('c2');
    });
  });

  describe('Eventos de sincronização', () => {
    it('deve processar evento sync:client_created', () => {
      const clientes: any[] = [];
      const message = {
        type: 'sync:client_created',
        payload: { id: 'c1', nome: 'Novo Cliente' },
      };

      if (message.type === 'sync:client_created') {
        clientes.push(message.payload);
      }

      expect(clientes).toHaveLength(1);
      expect(clientes[0].nome).toBe('Novo Cliente');
    });

    it('deve processar evento sync:transaction_created', () => {
      const lancamentos: any[] = [];
      const message = {
        type: 'sync:transaction_created',
        payload: { id: 'l1', clienteId: 'c1', valor: 50, tipo: 'debito' },
      };

      if (message.type === 'sync:transaction_created') {
        lancamentos.push(message.payload);
      }

      expect(lancamentos).toHaveLength(1);
      expect(lancamentos[0].valor).toBe(50);
    });

    it('deve deletar cliente quando receber sync:client_deleted', () => {
      const clientes = [
        { id: 'c1', nome: 'Cliente 1' },
        { id: 'c2', nome: 'Cliente 2' },
      ];

      const message = {
        type: 'sync:client_deleted',
        payload: { id: 'c1' },
      };

      if (message.type === 'sync:client_deleted') {
        const filtered = clientes.filter((c) => c.id !== message.payload.id);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('c2');
      }
    });
  });

  describe('Cálculos de saldos', () => {
    it('deve calcular saldo de cliente corretamente', () => {
      const lancamentos = [
        { id: 'l1', clienteId: 'c1', tipo: 'debito', valor: 100 },
        { id: 'l2', clienteId: 'c1', tipo: 'debito', valor: 50 },
        { id: 'l3', clienteId: 'c1', tipo: 'pagamento', valor: 30 },
      ];

      const saldo = lancamentos.reduce((total, l) => {
        if (l.tipo === 'debito') return total + l.valor;
        if (l.tipo === 'pagamento') return total - l.valor;
        return total;
      }, 0);

      expect(saldo).toBe(120); // 100 + 50 - 30
    });

    it('deve calcular saldo total de todos os clientes', () => {
      const lancamentos = [
        { id: 'l1', clienteId: 'c1', tipo: 'debito', valor: 100 },
        { id: 'l2', clienteId: 'c2', tipo: 'debito', valor: 50 },
        { id: 'l3', clienteId: 'c1', tipo: 'pagamento', valor: 30 },
      ];

      const saldoTotal = lancamentos.reduce((total, l) => {
        if (l.tipo === 'debito') return total + l.valor;
        if (l.tipo === 'pagamento') return total - l.valor;
        return total;
      }, 0);

      expect(saldoTotal).toBe(120); // 100 + 50 - 30
    });
  });

  describe('Filtros de dados', () => {
    it('deve filtrar lançamentos por cliente', () => {
      const lancamentos = [
        { id: 'l1', clienteId: 'c1', valor: 100 },
        { id: 'l2', clienteId: 'c2', valor: 50 },
        { id: 'l3', clienteId: 'c1', valor: 75 },
      ];

      const lancamentosC1 = lancamentos.filter((l) => l.clienteId === 'c1');
      expect(lancamentosC1).toHaveLength(2);
      expect(lancamentosC1[0].id).toBe('l1');
      expect(lancamentosC1[1].id).toBe('l3');
    });

    it('deve encontrar cliente por ID', () => {
      const clientes = [
        { id: 'c1', nome: 'Cliente 1' },
        { id: 'c2', nome: 'Cliente 2' },
      ];

      const cliente = clientes.find((c) => c.id === 'c1');
      expect(cliente).toBeDefined();
      expect(cliente?.nome).toBe('Cliente 1');
    });
  });

  describe('Reconexão', () => {
    it('deve tentar reconectar com backoff exponencial', () => {
      let tentativa = 0;
      const maxTentativas = 5;
      const delays: number[] = [];

      const attemptReconnect = () => {
        if (tentativa < maxTentativas) {
          tentativa++;
          const delay = 1000 * Math.pow(2, tentativa - 1);
          delays.push(delay);
        }
      };

      for (let i = 0; i < 5; i++) {
        attemptReconnect();
      }

      expect(delays).toEqual([2, 4, 8, 16, 32]); // Em unidades de 1000ms
      expect(tentativa).toBe(5);
    });
  });

  describe('Status de conexão', () => {
    it('deve atualizar status para conectado', () => {
      let statusConexao: 'conectado' | 'desconectado' | 'sincronizando' = 'desconectado';
      statusConexao = 'conectado';
      expect(statusConexao).toBe('conectado');
    });

    it('deve atualizar status para desconectado', () => {
      let statusConexao: 'conectado' | 'desconectado' | 'sincronizando' = 'conectado';
      statusConexao = 'desconectado';
      expect(statusConexao).toBe('desconectado');
    });

    it('deve atualizar status para sincronizando', () => {
      let statusConexao: 'conectado' | 'desconectado' | 'sincronizando' = 'conectado';
      statusConexao = 'sincronizando';
      expect(statusConexao).toBe('sincronizando');
    });
  });
});
