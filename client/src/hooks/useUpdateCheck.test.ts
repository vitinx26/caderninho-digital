/**
 * Testes para o hook useUpdateCheck
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUpdateCheck } from './useUpdateCheck';

describe('useUpdateCheck', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
    
    // Mock de navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          update: vi.fn().mockResolvedValue(undefined),
        }),
        register: vi.fn(),
      },
      writable: true,
    });

    // Mock de fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar updateAvailable como false inicialmente', () => {
    const { result } = renderHook(() => useUpdateCheck());
    expect(result.current.updateAvailable).toBe(false);
  });

  it('deve detectar atualização quando versão mudou', async () => {
    // Simular versão anterior armazenada
    localStorage.setItem('app_version', '1.0.0');

    // Mock do fetch para retornar nova versão
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.0.1' }),
    });

    const { result } = renderHook(() => useUpdateCheck());

    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(true);
    });

    expect(result.current.updateVersion).toBe('1.0.1');
  });

  it('deve armazenar versão na primeira execução', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    });

    renderHook(() => useUpdateCheck());

    await waitFor(() => {
      expect(localStorage.getItem('app_version')).toBe('1.0.0');
    });
  });

  it('deve chamar refreshApp e recarregar a página', async () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    const { result } = renderHook(() => useUpdateCheck());

    result.current.refreshApp();

    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });

  it('deve limpar caches ao atualizar', async () => {
    const deleteAllSpy = vi.fn().mockResolvedValue(true);
    const keysSpy = vi.fn().mockResolvedValue(['cache-1', 'cache-2']);

    Object.defineProperty(window, 'caches', {
      value: {
        keys: keysSpy,
        delete: deleteAllSpy,
      },
      writable: true,
    });

    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    const { result } = renderHook(() => useUpdateCheck());

    result.current.refreshApp();

    await waitFor(() => {
      expect(keysSpy).toHaveBeenCalled();
    });

    reloadSpy.mockRestore();
  });

  it('deve verificar atualizações a cada 5 minutos', async () => {
    vi.useFakeTimers();

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    });

    renderHook(() => useUpdateCheck());

    // Avançar 5 minutos
    vi.advanceTimersByTime(300000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('deve verificar atualizações quando página volta ao foco', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    });

    renderHook(() => useUpdateCheck());

    // Simular mudança de visibilidade
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('deve lidar com erros de fetch gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUpdateCheck());

    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(false);
    });
  });
});
