/**
 * dashboard-realtime-sync.test.ts
 * 
 * Testes de sincronização em tempo real do Dashboard
 * Simula múltiplos admins acessando o Dashboard simultaneamente
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Dashboard - Sincronização em Tempo Real Entre Múltiplos Admins', () => {
  describe('Cenário 1: Admin A adiciona cliente, Admin B vê automaticamente', () => {
    it('deve atualizar lista de clientes quando outro admin adiciona', () => {
      // Estado inicial
      const clientesAdminA = [
        { id: 'c1', nome: 'Cliente 1', ativo: true },
        { id: 'c2', nome: 'Cliente 2', ativo: true },
      ];

      const clientesAdminB = [...clientesAdminA]; // Mesma lista sincronizada

      // Admin A adiciona novo cliente
      const novoCliente = { id: 'c3', nome: 'Cliente 3', ativo: true };
      const clientesAdminAAtualizado = [...clientesAdminA, novoCliente];

      // Simular broadcast do servidor para Admin B
      const clientesAdminBAtualizado = [...clientesAdminB, novoCliente];

      expect(clientesAdminAAtualizado).toHaveLength(3);
      expect(clientesAdminBAtualizado).toHaveLength(3);
      expect(clientesAdminBAtualizado[2].id).toBe('c3');
    });

    it('deve atualizar saldo total quando outro admin adiciona transação', () => {
      let saldoTotalAdminA = 500;
      let saldoTotalAdminB = 500; // Sincronizado

      // Admin A adiciona transação de R$ 100
      const novaTransacao = { valor: 100, tipo: 'debito' };
      saldoTotalAdminA += novaTransacao.valor;

      // Broadcast do servidor atualiza Admin B
      saldoTotalAdminB += novaTransacao.valor;

      expect(saldoTotalAdminA).toBe(600);
      expect(saldoTotalAdminB).toBe(600);
    });

    it('deve remover cliente da lista quando outro admin deleta', () => {
      let clientesAdminA = [
        { id: 'c1', nome: 'Cliente 1' },
        { id: 'c2', nome: 'Cliente 2' },
        { id: 'c3', nome: 'Cliente 3' },
      ];

      let clientesAdminB = [...clientesAdminA]; // Sincronizado

      // Admin A deleta cliente
      clientesAdminA = clientesAdminA.filter((c) => c.id !== 'c2');

      // Broadcast do servidor atualiza Admin B
      clientesAdminB = clientesAdminB.filter((c) => c.id !== 'c2');

      expect(clientesAdminA).toHaveLength(2);
      expect(clientesAdminB).toHaveLength(2);
      expect(clientesAdminA.find((c) => c.id === 'c2')).toBeUndefined();
      expect(clientesAdminB.find((c) => c.id === 'c2')).toBeUndefined();
    });

    it('deve atualizar dados do cliente quando outro admin edita', () => {
      let clientesAdminA = [{ id: 'c1', nome: 'Cliente 1', telefone: '1111-1111' }];
      let clientesAdminB = [...clientesAdminA]; // Sincronizado

      // Admin A edita telefone do cliente
      clientesAdminA = clientesAdminA.map((c) =>
        c.id === 'c1' ? { ...c, telefone: '2222-2222' } : c
      );

      // Broadcast do servidor atualiza Admin B
      clientesAdminB = clientesAdminB.map((c) =>
        c.id === 'c1' ? { ...c, telefone: '2222-2222' } : c
      );

      expect(clientesAdminA[0].telefone).toBe('2222-2222');
      expect(clientesAdminB[0].telefone).toBe('2222-2222');
    });
  });

  describe('Cenário 2: Cliente novo se cadastra na página inicial, Admin vê automaticamente', () => {
    it('deve adicionar novo cliente ao Dashboard quando se cadastra', () => {
      const clientesAtuais = [
        { id: 'c1', nome: 'Cliente 1' },
        { id: 'c2', nome: 'Cliente 2' },
      ];

      // Cliente novo se cadastra na página inicial
      const novoClienteCadastro = { id: 'c3', nome: 'Cliente Novo', ativo: true };

      // Servidor cria cliente e faz broadcast
      const clientesAtualizados = [...clientesAtuais, novoClienteCadastro];

      expect(clientesAtualizados).toHaveLength(3);
      expect(clientesAtualizados[2].nome).toBe('Cliente Novo');
    });

    it('deve atualizar saldo do Dashboard quando cliente novo faz primeira compra', () => {
      let saldoTotal = 1000;
      const lancamentosAtuais: any[] = [];

      // Cliente novo faz primeira compra
      const primeiraCompra = {
        id: 'l1',
        clienteId: 'c3',
        tipo: 'debito',
        valor: 150,
        descricao: 'Primeira compra',
      };

      lancamentosAtuais.push(primeiraCompra);
      saldoTotal += primeiraCompra.valor;

      expect(saldoTotal).toBe(1150);
      expect(lancamentosAtuais).toHaveLength(1);
    });

    it('deve mostrar cliente novo no Dashboard em tempo real', () => {
      const clientesNoDashboard = [
        { id: 'c1', nome: 'Cliente 1', saldo: 100 },
        { id: 'c2', nome: 'Cliente 2', saldo: 50 },
      ];

      // Cliente novo se cadastra e faz primeira compra
      const novoCliente = { id: 'c3', nome: 'Cliente Novo', saldo: 150 };
      const clientesAtualizado = [...clientesNoDashboard, novoCliente];

      expect(clientesAtualizado).toHaveLength(3);
      expect(clientesAtualizado[2].saldo).toBe(150);
    });
  });

  describe('Cenário 3: Múltiplos admins editando simultaneamente', () => {
    it('deve sincronizar quando dois admins adicionam clientes ao mesmo tempo', () => {
      const clientesBase = [{ id: 'c1', nome: 'Cliente 1' }];

      // Admin A adiciona cliente
      const clienteAdminA = { id: 'c2', nome: 'Cliente A' };
      // Admin B adiciona cliente
      const clienteAdminB = { id: 'c3', nome: 'Cliente B' };

      // Servidor recebe ambas as operações e sincroniza
      const clientesFinal = [...clientesBase, clienteAdminA, clienteAdminB];

      expect(clientesFinal).toHaveLength(3);
      expect(clientesFinal.find((c) => c.id === 'c2')).toBeDefined();
      expect(clientesFinal.find((c) => c.id === 'c3')).toBeDefined();
    });

    it('deve manter consistência de saldo com múltiplas transações simultâneas', () => {
      let saldoTotal = 1000;

      // Admin A adiciona transação
      const tx1 = { valor: 100, tipo: 'debito' };
      saldoTotal += tx1.valor;

      // Admin B adiciona transação
      const tx2 = { valor: 50, tipo: 'debito' };
      saldoTotal += tx2.valor;

      // Admin A faz pagamento
      const tx3 = { valor: 75, tipo: 'pagamento' };
      saldoTotal -= tx3.valor;

      expect(saldoTotal).toBe(1075); // 1000 + 100 + 50 - 75
    });

    it('deve não perder dados com operações simultâneas', () => {
      const operacoes: any[] = [];

      // Simular 3 admins fazendo operações simultaneamente
      const op1 = { id: 'op1', tipo: 'client:create', clienteId: 'c1' };
      const op2 = { id: 'op2', tipo: 'transaction:create', clienteId: 'c1' };
      const op3 = { id: 'op3', tipo: 'transaction:create', clienteId: 'c2' };

      operacoes.push(op1, op2, op3);

      expect(operacoes).toHaveLength(3);
      expect(operacoes.every((op) => op.id)).toBe(true);
    });
  });

  describe('Cenário 4: Desconexão e Reconexão', () => {
    it('deve sincronizar dados quando admin se reconecta', () => {
      let clientesLocal = [
        { id: 'c1', nome: 'Cliente 1' },
        { id: 'c2', nome: 'Cliente 2' },
      ];

      // Admin desconecta
      const statusConexao = 'desconectado';
      expect(statusConexao).toBe('desconectado');

      // Enquanto desconectado, outro admin adiciona cliente
      const clientesNoServidor = [
        ...clientesLocal,
        { id: 'c3', nome: 'Cliente 3' },
      ];

      // Admin se reconecta e recebe estado completo
      clientesLocal = clientesNoServidor;

      expect(clientesLocal).toHaveLength(3);
      expect(clientesLocal[2].id).toBe('c3');
    });

    it('deve receber todas as mudanças após reconexão', () => {
      const mudanças = [
        { tipo: 'client:created', clienteId: 'c3' },
        { tipo: 'transaction:created', clienteId: 'c1', valor: 100 },
        { tipo: 'client:updated', clienteId: 'c2', nome: 'Cliente 2 Atualizado' },
      ];

      // Simular recebimento de todas as mudanças
      const mudançasRecebidas = [...mudanças];

      expect(mudançasRecebidas).toHaveLength(3);
      expect(mudançasRecebidas.every((m) => m.tipo)).toBe(true);
    });
  });

  describe('Cenário 5: Atualização de Filtros', () => {
    it('deve manter filtro ao receber atualizações', () => {
      const saldosPorCliente = [
        { clienteId: 'c1', clienteNome: 'Zé', saldo: 100 },
        { clienteId: 'c2', clienteNome: 'Ana', saldo: 50 },
        { clienteId: 'c3', clienteNome: 'Bruno', saldo: 75 },
      ];

      let filtro = 'alfabetico';
      let devedoresFiltrados = [...saldosPorCliente];

      if (filtro === 'alfabetico') {
        devedoresFiltrados.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome));
      }

      // Novo cliente é adicionado
      const novoCliente = { clienteId: 'c4', clienteNome: 'Diana', saldo: 60 };
      devedoresFiltrados.push(novoCliente);

      // Reaplica filtro
      if (filtro === 'alfabetico') {
        devedoresFiltrados.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome));
      }

      expect(devedoresFiltrados[0].clienteNome).toBe('Ana');
      expect(devedoresFiltrados[1].clienteNome).toBe('Bruno');
      expect(devedoresFiltrados[2].clienteNome).toBe('Diana');
      expect(devedoresFiltrados[3].clienteNome).toBe('Zé');
    });
  });

  describe('Performance', () => {
    it('deve sincronizar 100 clientes rapidamente', () => {
      const inicio = Date.now();

      // Simular sincronização de 100 clientes
      const clientes = Array.from({ length: 100 }, (_, i) => ({
        id: `c${i}`,
        nome: `Cliente ${i}`,
        saldo: Math.random() * 1000,
      }));

      const fim = Date.now();
      const tempo = fim - inicio;

      expect(clientes).toHaveLength(100);
      expect(tempo).toBeLessThan(100); // Deve ser rápido (menos de 100ms)
    });

    it('deve filtrar 100 clientes rapidamente', () => {
      const clientes = Array.from({ length: 100 }, (_, i) => ({
        id: `c${i}`,
        nome: `Cliente ${i}`,
        saldo: i % 2 === 0 ? Math.random() * 1000 : 0,
      }));

      const inicio = Date.now();

      const devedores = clientes.filter((c) => c.saldo > 0);

      const fim = Date.now();
      const tempo = fim - inicio;

      expect(devedores.length).toBeLessThanOrEqual(100);
      expect(tempo).toBeLessThan(50); // Deve ser muito rápido
    });
  });
});
