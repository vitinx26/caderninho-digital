/**
 * Serviço de Sincronização com Servidor Backend
 * Sincroniza backups com servidor para proteção contra perda total
 */

import { Cliente, Lancamento, Usuario } from '@/types';
import * as db from './db';

const BACKUP_API_URL = '/api/backup';
const SYNC_STATUS_KEY = 'caderninho_sync_status';
const LAST_SYNC_KEY = 'caderninho_last_server_sync';
const SYNC_INTERVAL = 600000; // 10 minutos

export interface SyncStatus {
  timestamp: number;
  status: 'sucesso' | 'erro' | 'sincronizando';
  mensagem?: string;
  conflitos?: SyncConflict[];
}

export interface SyncConflict {
  tipo: 'cliente' | 'lancamento' | 'usuario';
  id: string;
  localTimestamp: number;
  servidorTimestamp: number;
  acao: 'usar_local' | 'usar_servidor' | 'mesclar';
}

export interface SyncHistory {
  id: string;
  timestamp: number;
  usuarioEmail: string;
  status: 'sucesso' | 'erro';
  itemsSincronizados: number;
  conflitos: number;
  duracao: number;
}

/**
 * Sincroniza dados com servidor backend
 */
export async function sincronizarComServidor(usuarioEmail: string): Promise<SyncStatus> {
  const inicioSync = Date.now();

  try {
    console.log('🔄 Iniciando sincronização com servidor...');

    // Obter dados locais
    const clientes = await db.obterClientes();
    const lancamentos = await db.obterTodosLancamentos();
    const usuarios = await db.obterTodosUsuarios();

    // Enviar para servidor
    const response = await fetch(`${BACKUP_API_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        usuarioEmail,
        timestamp: Date.now(),
        clientes,
        lancamentos,
        usuarios,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao sincronizar: ${response.statusText}`);
    }

    const resultado = await response.json();

    // Processar conflitos se houver
    if (resultado.conflitos && resultado.conflitos.length > 0) {
      console.warn('⚠️ Conflitos detectados:', resultado.conflitos);
      await processarConflitos(resultado.conflitos);
    }

    // Atualizar status
    const duracao = Date.now() - inicioSync;
    const status: SyncStatus = {
      timestamp: Date.now(),
      status: 'sucesso',
      mensagem: `Sincronizado com sucesso em ${duracao}ms`,
      conflitos: resultado.conflitos,
    };

    salvarStatusSincronizacao(status);
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    console.log('✓ Sincronização concluída:', status);
    return status;
  } catch (error) {
    const duracao = Date.now() - inicioSync;
    const status: SyncStatus = {
      timestamp: Date.now(),
      status: 'erro',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    };

    salvarStatusSincronizacao(status);
    console.error('✗ Erro ao sincronizar:', error);
    return status;
  }
}

/**
 * Processa conflitos de sincronização
 */
async function processarConflitos(conflitos: SyncConflict[]): Promise<void> {
  for (const conflito of conflitos) {
    try {
      // Por padrão, usar versão do servidor (mais recente)
      if (conflito.acao === 'usar_servidor') {
        console.log(`Usando versão do servidor para ${conflito.tipo}: ${conflito.id}`);
        // Dados do servidor serão sincronizados automaticamente
      } else if (conflito.acao === 'usar_local') {
        console.log(`Mantendo versão local para ${conflito.tipo}: ${conflito.id}`);
        // Manter dados locais
      } else if (conflito.acao === 'mesclar') {
        console.log(`Mesclando dados para ${conflito.tipo}: ${conflito.id}`);
        // Implementar lógica de mesclagem conforme necessário
      }
    } catch (error) {
      console.error(`Erro ao processar conflito: ${conflito.id}`, error);
    }
  }
}

/**
 * Obtém status de sincronização
 */
export async function obterStatusSincronizacao(usuarioEmail: string): Promise<SyncStatus | null> {
  try {
    const response = await fetch(`${BACKUP_API_URL}/sync/status?email=${encodeURIComponent(usuarioEmail)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter status de sincronização:', error);
    return null;
  }
}

/**
 * Obtém histórico de sincronizações
 */
export async function obterHistoricoSincronizacao(usuarioEmail: string): Promise<SyncHistory[]> {
  try {
    const response = await fetch(`${BACKUP_API_URL}/sync/history?email=${encodeURIComponent(usuarioEmail)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter histórico: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    return [];
  }
}

/**
 * Salva status de sincronização localmente
 */
export function salvarStatusSincronizacao(status: SyncStatus): void {
  try {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Erro ao salvar status:', error);
  }
}

/**
 * Carrega status de sincronização local
 */
export function carregarStatusSincronizacao(): SyncStatus | null {
  try {
    const data = localStorage.getItem(SYNC_STATUS_KEY);
    if (!data) return null;
    return JSON.parse(data) as SyncStatus;
  } catch (error) {
    console.error('Erro ao carregar status:', error);
    return null;
  }
}

/**
 * Verifica se precisa sincronizar
 */
export function precisaSincronizar(): boolean {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (!lastSync) return true;
  return Date.now() - parseInt(lastSync) > SYNC_INTERVAL;
}

/**
 * Obtém tempo desde última sincronização
 */
export function tempoDesdeUltimaSincronizacao(): number {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (!lastSync) return Infinity;
  return Date.now() - parseInt(lastSync);
}

/**
 * Inicia sincronização automática periódica
 */
export function iniciarSincronizacaoAutomatica(usuarioEmail: string) {
  // Sincronizar imediatamente
  sincronizarComServidor(usuarioEmail).catch(console.error);

  // Depois a cada intervalo
  const intervalo = setInterval(() => {
    sincronizarComServidor(usuarioEmail).catch(console.error);
  }, SYNC_INTERVAL);

  return () => clearInterval(intervalo);
}

/**
 * Força sincronização imediata
 */
export async function forcaSincronizacao(usuarioEmail: string): Promise<SyncStatus> {
  return sincronizarComServidor(usuarioEmail);
}

/**
 * Limpa dados de sincronização
 */
export function limparDadosSincronizacao(): void {
  try {
    localStorage.removeItem(SYNC_STATUS_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
  }
}
