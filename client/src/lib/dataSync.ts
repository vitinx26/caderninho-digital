/**
 * Sistema de Sincronização de Dados entre Admins
 * Garante que todos os admins vejam os mesmos dados
 * Usa localStorage como fonte de verdade compartilhada
 */

import { Cliente, Lancamento } from '@/types';
import * as db from './db';

const SYNC_KEY = 'caderninho_sync_data';
const LAST_SYNC_KEY = 'caderninho_last_sync';
const SYNC_INTERVAL = 10000; // 10 segundos

interface SyncData {
  clientes: Cliente[];
  lancamentos: Lancamento[];
  timestamp: number;
}

/**
 * Salva dados no localStorage para sincronização entre abas/navegadores
 */
export function salvarDadosSync(clientes: Cliente[], lancamentos: Lancamento[]) {
  try {
    const syncData: SyncData = {
      clientes,
      lancamentos,
      timestamp: Date.now(),
    };
    localStorage.setItem(SYNC_KEY, JSON.stringify(syncData));
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error('Erro ao salvar dados de sincronização:', error);
  }
}

/**
 * Carrega dados do localStorage para sincronização
 */
export function carregarDadosSync(): SyncData | null {
  try {
    const data = localStorage.getItem(SYNC_KEY);
    if (!data) return null;
    return JSON.parse(data) as SyncData;
  } catch (error) {
    console.error('Erro ao carregar dados de sincronização:', error);
    return null;
  }
}

/**
 * Sincroniza dados do localStorage para IndexedDB
 * Chamado quando um novo admin faz login ou quando dados são atualizados
 */
export async function sincronizarDadosDoLocalStorage() {
  try {
    const syncData = carregarDadosSync();
    if (!syncData) return;

    // Sincronizar clientes
    if (syncData.clientes && syncData.clientes.length > 0) {
      for (const cliente of syncData.clientes) {
        await db.adicionarCliente(cliente);
      }
    }

    // Sincronizar lançamentos
    if (syncData.lancamentos && syncData.lancamentos.length > 0) {
      for (const lancamento of syncData.lancamentos) {
        await db.adicionarLancamento(lancamento);
      }
    }

    console.log('Dados sincronizados com sucesso do localStorage');
  } catch (error) {
    console.error('Erro ao sincronizar dados do localStorage:', error);
  }
}

/**
 * Monitora mudanças no localStorage (sincronização entre abas)
 */
export function monitorarMudancasLocalStorage(callback: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === SYNC_KEY && event.newValue) {
      console.log('Dados sincronizados de outra aba');
      callback();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Força sincronização periódica de dados
 */
export function iniciarSincronizacaoPeriodica(callback: () => void) {
  const intervalo = setInterval(() => {
    sincronizarDadosDoLocalStorage().then(callback);
  }, SYNC_INTERVAL);

  return () => clearInterval(intervalo);
}

/**
 * Limpa dados de sincronização (logout)
 */
export function limparDadosSync() {
  try {
    localStorage.removeItem(SYNC_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error('Erro ao limpar dados de sincronização:', error);
  }
}
