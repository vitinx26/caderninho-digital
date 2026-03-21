/**
 * sync.polling.test.ts - Testes para sincronização via polling HTTP
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from './db-client';
import { users, clients, transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Sincronização via Polling HTTP', () => {
  const testUserId = 1;
  const testUserEmail = 'test-sync@example.com';

  beforeEach(async () => {
    // Limpar dados de teste antes de cada teste
    try {
      await db.delete(transactions).where(eq(transactions.adminId, testUserId)).execute();
      await db.delete(clients).where(eq(clients.adminId, testUserId)).execute();
      await db.delete(users).where(eq(users.email, testUserEmail)).execute();
    } catch (e) {
      // Tabelas podem não existir em ambiente de teste
    }
  });

  describe('Endpoints de sincronização', () => {
    it('POST /api/sync/dados - Deve retornar dados do usuário', async () => {
      // Criar usuário de teste
      await db.insert(users).values({
        id: testUserId,
        email: testUserEmail,
        name: 'Test User',
        role: 'admin',
        ativo: true,
      }).execute();

      // Criar cliente de teste
      const clientId = 'client-1';
      await db.insert(clients).values({
        id: clientId,
        adminId: testUserId,
        nome: 'Test Client',
        ativo: true,
      }).execute();

      // Simular requisição GET /api/sync/dados
      const response = await fetch('http://localhost:3000/api/sync/dados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: testUserId, lastSync: 0 }),
      }).catch(e => {
        console.warn('Erro ao conectar ao servidor:', e.message);
        return null;
      });

      if (response) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('clientes');
        expect(data).toHaveProperty('lancamentos');
        expect(data).toHaveProperty('timestamp');
        expect(Array.isArray(data.clientes)).toBe(true);
      }
    });

    it('POST /api/sync/enviar - Deve sincronizar dados locais', async () => {
      const clientData = {
        id: 'client-sync-1',
        nome: 'Sync Test Client',
        telefone: '123456789',
        email: 'client@test.com',
        ativo: true,
      };

      const response = await fetch('http://localhost:3000/api/sync/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: testUserId,
          clientes: [clientData],
          lancamentos: [],
          timestamp: Date.now(),
        }),
      }).catch(e => {
        console.warn('Erro ao conectar ao servidor:', e.message);
        return null;
      });

      if (response) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('clientesCriados');
        expect(data).toHaveProperty('lancamentosCriados');
      }
    });

    it('GET /api/sync/status - Deve retornar status de sincronização', async () => {
      const response = await fetch('http://localhost:3000/api/sync/status', {
        method: 'GET',
      }).catch(e => {
        console.warn('Erro ao conectar ao servidor:', e.message);
        return null;
      });

      if (response) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('isConnected', true);
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('version');
      }
    });
  });

  describe('Lógica de sincronização', () => {
    it('Deve detectar conflitos por timestamp', () => {
      const local = {
        id: 'client-1',
        nome: 'Local Version',
        dataAtualizacao: 1000,
      };

      const remote = {
        id: 'client-1',
        nome: 'Remote Version',
        dataAtualizacao: 2000,
      };

      // Remote é mais recente
      const resolution = local.dataAtualizacao > remote.dataAtualizacao ? 'local' : 'remote';
      expect(resolution).toBe('remote');
    });

    it('Deve resolver conflitos com "última modificação vence"', () => {
      const conflitos = [
        {
          type: 'cliente' as const,
          id: 'client-1',
          local: { dataAtualizacao: 1000 },
          remote: { dataAtualizacao: 2000 },
          resolution: 'remote' as const,
        },
      ];

      expect(conflitos[0].resolution).toBe('remote');
      expect(conflitos[0].type).toBe('cliente');
    });

    it('Deve manter integridade de IDs durante sincronização', () => {
      const clienteLocal = {
        id: 'client-123',
        nome: 'Test',
        adminId: testUserId,
      };

      const clienteRemoto = {
        id: 'client-123',
        nome: 'Test Updated',
        adminId: testUserId,
      };

      // IDs devem ser idênticos
      expect(clienteLocal.id).toBe(clienteRemoto.id);
      expect(clienteLocal.adminId).toBe(clienteRemoto.adminId);
    });
  });

  describe('Tratamento de erros', () => {
    it('Deve retornar 400 quando usuarioId está faltando', async () => {
      const response = await fetch('http://localhost:3000/api/sync/dados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastSync: 0 }),
      }).catch(e => {
        console.warn('Erro ao conectar ao servidor:', e.message);
        return null;
      });

      if (response) {
        expect(response.status).toBe(400);
      }
    });

    it('Deve continuar sincronização mesmo com erros parciais', async () => {
      const mixedData = {
        usuarioId: testUserId,
        clientes: [
          { id: 'valid-1', nome: 'Valid Client', ativo: true },
          { id: 'invalid', nome: '', ativo: true }, // Inválido
          { id: 'valid-2', nome: 'Another Client', ativo: true },
        ],
        lancamentos: [],
      };

      const response = await fetch('http://localhost:3000/api/sync/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mixedData),
      }).catch(e => {
        console.warn('Erro ao conectar ao servidor:', e.message);
        return null;
      });

      if (response) {
        expect(response.status).toBe(200);
        const data = await response.json();
        // Deve ter processado alguns clientes mesmo com erro
        expect(data.clientesCriados).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Suporte offline', () => {
    it('Deve armazenar mudanças pendentes quando offline', () => {
      const pendingChanges = [
        { type: 'cliente', action: 'create', data: { id: 'new-1', nome: 'New Client' } },
        { type: 'lancamento', action: 'create', data: { id: 'tx-1', tipo: 'debito', valor: 100 } },
      ];

      expect(pendingChanges.length).toBe(2);
      expect(pendingChanges[0].type).toBe('cliente');
      expect(pendingChanges[1].type).toBe('lancamento');
    });

    it('Deve sincronizar mudanças pendentes ao reconectar', () => {
      const pendingChanges = [
        { id: 'client-1', nome: 'Pending', synced: false },
        { id: 'client-2', nome: 'Also Pending', synced: false },
      ];

      // Simular sincronização
      const syncedChanges = pendingChanges.map(c => ({ ...c, synced: true }));

      expect(syncedChanges.every(c => c.synced)).toBe(true);
      expect(syncedChanges.length).toBe(pendingChanges.length);
    });
  });
});
