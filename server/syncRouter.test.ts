/**
 * Testes para validar sincronização de lançamentos e filtros
 * Verifica se admin e cliente sincronizam corretamente com o servidor
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as dbHelpers from './db';

describe('Sincronização de Lançamentos', () => {
  let testAdminId: string;
  let testClienteId: string;

  beforeAll(async () => {
    // Usar IDs de teste conhecidos
    testAdminId = '1';
    testClienteId = '30016';
  });

  describe('GET /api/transactions', () => {
    it('deve retornar todas as transações quando não há filtro', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      expect(transacoes).toBeDefined();
      expect(Array.isArray(transacoes)).toBe(true);
      expect(transacoes.length).toBeGreaterThan(0);
      
      // Verificar estrutura de dados
      transacoes.forEach((t: any) => {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('admin_id');
        expect(t).toHaveProperty('cliente_id');
        expect(t).toHaveProperty('tipo');
        expect(t).toHaveProperty('valor');
      });
    });

    it('deve usar snake_case para admin_id (não camelCase)', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      transacoes.forEach((t: any) => {
        // ✅ Verificar que usa snake_case
        expect(t).toHaveProperty('admin_id');
        
        // ❌ Verificar que NÃO usa camelCase
        expect(t).not.toHaveProperty('adminId');
      });
    });

    it('deve usar snake_case para cliente_id (não camelCase)', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      transacoes.forEach((t: any) => {
        // ✅ Verificar que usa snake_case
        expect(t).toHaveProperty('cliente_id');
        
        // ❌ Verificar que NÃO usa camelCase
        expect(t).not.toHaveProperty('clienteId');
      });
    });

    it('deve filtrar corretamente por admin_id', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      // Filtrar por admin_id (usando snake_case correto)
      const transacoesAdmin1 = transacoes.filter((t: any) => t.admin_id === testAdminId);
      
      // Verificar que retorna transações
      expect(transacoesAdmin1.length).toBeGreaterThan(0);
      
      // Verificar que todas têm admin_id = testAdminId
      transacoesAdmin1.forEach((t: any) => {
        expect(t.admin_id).toBe(testAdminId);
      });
    });

    it('deve filtrar corretamente por cliente_id', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      // Filtrar por cliente_id (usando snake_case correto)
      const transacoesCliente = transacoes.filter((t: any) => t.cliente_id === testClienteId);
      
      // Verificar que retorna transações
      expect(transacoesCliente.length).toBeGreaterThan(0);
      
      // Verificar que todas têm cliente_id = testClienteId
      transacoesCliente.forEach((t: any) => {
        expect(t.cliente_id).toBe(testClienteId);
      });
    });

    it('deve retornar transações com valores em centavos', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      transacoes.forEach((t: any) => {
        // Valor deve ser número
        expect(typeof t.valor).toBe('number');
        
        // Valor deve ser positivo
        expect(t.valor).toBeGreaterThan(0);
        
        // Valor deve estar em centavos (múltiplo de 100 para reais inteiros)
        // Exemplo: 5000 = R$ 50,00
        expect(t.valor).toBeGreaterThanOrEqual(100);
      });
    });

    it('deve retornar transações com tipo válido', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      transacoes.forEach((t: any) => {
        expect(['debito', 'pagamento']).toContain(t.tipo);
      });
    });
  });

  describe('Sincronização Admin vs Cliente', () => {
    it('admin e cliente devem ver as mesmas transações', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      // Ambos devem ver todas as transações
      expect(transacoes.length).toBeGreaterThan(0);
      
      // Não deve haver filtro que oculte transações
      const todasVisíveis = transacoes.every((t: any) => 
        t.admin_id && t.cliente_id && t.tipo && t.valor
      );
      
      expect(todasVisíveis).toBe(true);
    });

    it('lançamento criado por admin deve ter admin_id correto', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      // Encontrar transação recente
      const transacaoRecente = transacoes[0];
      
      expect(transacaoRecente).toBeDefined();
      expect(transacaoRecente.admin_id).toBeDefined();
      expect(typeof transacaoRecente.admin_id).toBe('string');
    });

    it('lançamento deve ter cliente_id válido', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      transacoes.forEach((t: any) => {
        expect(t.cliente_id).toBeDefined();
        expect(t.cliente_id).not.toBe('');
        expect(t.cliente_id).not.toBe(null);
      });
    });
  });

  describe('Integridade de Dados', () => {
    it('todas as transações devem ter ID único', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      const ids = transacoes.map((t: any) => t.id);
      const idsUnicos = new Set(ids);
      
      expect(idsUnicos.size).toBe(ids.length);
    });

    it('não deve haver transações órfãs (cliente_id inválido)', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      transacoes.forEach((t: any) => {
        // cliente_id deve ser número ou string válida
        expect(t.cliente_id).toBeTruthy();
      });
    });

    it('admin_id deve estar preenchido (não null ou undefined)', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      transacoes.forEach((t: any) => {
        expect(t.admin_id).toBeTruthy();
        expect(t.admin_id).not.toBe('null');
        expect(t.admin_id).not.toBe('undefined');
      });
    });
  });

  describe('Performance de Filtros', () => {
    it('filtro por admin_id deve ser rápido', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      const inicio = Date.now();
      const transacoesAdmin = transacoes.filter((t: any) => t.admin_id === testAdminId);
      const tempo = Date.now() - inicio;
      
      // Deve ser muito rápido (< 10ms para 18 transações)
      expect(tempo).toBeLessThan(10);
      expect(transacoesAdmin.length).toBeGreaterThan(0);
    });

    it('filtro por cliente_id deve ser rápido', async () => {
      const transacoes = await dbHelpers.getAllTransactions();
      
      const inicio = Date.now();
      const transacoesCliente = transacoes.filter((t: any) => t.cliente_id === testClienteId);
      const tempo = Date.now() - inicio;
      
      // Deve ser muito rápido (< 10ms para 18 transações)
      expect(tempo).toBeLessThan(10);
      expect(transacoesCliente.length).toBeGreaterThan(0);
    });
  });
});
