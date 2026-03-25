/**
 * Testes para debugAdmins.ts
 * Valida que funções usam apenas servidor (sem armazenamento local)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verificarAdmins, restaurarAdmins, garantirAdminsPresentes, sincronizarAdminsLocal } from './debugAdmins';

describe('debugAdmins - Adaptado para Servidor', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verificarAdmins', () => {
    it('deve retornar admins encontrados quando servidor retorna usuários', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'admin-victorhgs26',
              email: 'victorhgs26@gmail.com',
              name: 'Victor',
              role: 'admin',
            },
          ],
        }),
      });

      const resultado = await verificarAdmins();

      expect(resultado.encontrados).toContain('victorhgs26@gmail.com');
      expect(resultado.faltando).toHaveLength(0);
      expect(fetchMock).toHaveBeenCalledWith('/api/users');
    });

    it('deve retornar admins faltando quando não encontrados no servidor', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const resultado = await verificarAdmins();

      expect(resultado.encontrados).toHaveLength(0);
      expect(resultado.faltando).toContain('victorhgs26@gmail.com');
    });

    it('deve lidar com erro de conexão gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
      });

      const resultado = await verificarAdmins();

      expect(resultado.encontrados).toHaveLength(0);
      expect(resultado.faltando).toHaveLength(0);
    });

    it('deve lidar com erro de fetch', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const resultado = await verificarAdmins();

      expect(resultado.encontrados).toHaveLength(0);
      expect(resultado.faltando).toHaveLength(0);
    });
  });

  describe('restaurarAdmins', () => {
    it('deve restaurar admins faltando no servidor', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }), // Nenhum admin existe
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'admin-victorhgs26' }), // Admin criado
        });

      const resultado = await restaurarAdmins();

      expect(resultado.restaurados).toContain('victorhgs26@gmail.com');
      expect(resultado.erros).toHaveLength(0);
      expect(fetchMock).toHaveBeenCalledWith('/api/users');
      expect(fetchMock).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('deve pular admins que já existem no servidor', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'admin-victorhgs26',
              email: 'victorhgs26@gmail.com',
              name: 'Victor',
              role: 'admin',
            },
          ],
        }),
      });

      const resultado = await restaurarAdmins();

      expect(resultado.restaurados).toHaveLength(0);
      expect(resultado.erros).toHaveLength(0);
      // Deve fazer apenas uma chamada (verificação)
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('deve registrar erro quando falha ao criar admin', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }), // Nenhum admin existe
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Email já existe' }),
        });

      const resultado = await restaurarAdmins();

      expect(resultado.restaurados).toHaveLength(0);
      expect(resultado.erros).toContain('victorhgs26@gmail.com');
    });

    it('deve lidar com erro de conexão', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
      });

      const resultado = await restaurarAdmins();

      expect(resultado.restaurados).toHaveLength(0);
      expect(resultado.erros).toHaveLength(0);
    });
  });

  describe('garantirAdminsPresentes', () => {
    it('deve completar sem erro quando admins estão presentes', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'admin-victorhgs26',
              email: 'victorhgs26@gmail.com',
              name: 'Victor',
              role: 'admin',
            },
          ],
        }),
      });

      // Não deve lançar erro
      await expect(garantirAdminsPresentes()).resolves.toBeUndefined();
    });

    it('deve tentar restaurar quando admins faltam', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }), // Verificação: nenhum admin
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }), // Restauração: busca novamente
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'admin-victorhgs26' }), // Admin criado
        });

      await expect(garantirAdminsPresentes()).resolves.toBeUndefined();
    });
  });

  describe('sincronizarAdminsLocal', () => {
    it('deve retornar false (desabilitado)', async () => {
      const resultado = await sincronizarAdminsLocal();

      expect(resultado).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
