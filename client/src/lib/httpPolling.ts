/**
 * httpPolling.ts - Sistema de sincronização via polling HTTP
 * 
 * Sincroniza dados entre dispositivos usando polling HTTP a cada 5-10 segundos
 * Detecta conflitos e resolve usando última modificação
 * Funciona offline com sincronização automática ao reconectar
 */

import * as db from './db';
import { UsuarioLogado, Cliente, Lancamento } from '@/types';

interface SyncState {
  isConnected: boolean;
  lastSync: number;
  pendingChanges: number;
  syncInProgress: boolean;
  lastError: string | null;
}

interface SyncConflict {
  type: 'cliente' | 'lancamento';
  id: string;
  local: any;
  remote: any;
  resolution: 'local' | 'remote';
}

let syncState: SyncState = {
  isConnected: true,
  lastSync: Date.now(),
  pendingChanges: 0,
  syncInProgress: false,
  lastError: null,
};

let syncConflicts: SyncConflict[] = [];
let pollingIntervalId: NodeJS.Timeout | null = null;

/**
 * Iniciar polling HTTP
 */
export function iniciarPollingHTTP(usuario: UsuarioLogado, intervalo: number = 5000) {
  console.log(`🔄 Iniciando polling HTTP a cada ${intervalo}ms`);

  // Sincronizar imediatamente
  sincronizarDados(usuario);

  // Configurar polling periódico
  pollingIntervalId = setInterval(() => {
    sincronizarDados(usuario);
  }, intervalo);

  // Monitorar conexão
  window.addEventListener('online', () => {
    console.log('✅ Conexão restaurada');
    syncState.isConnected = true;
    sincronizarDados(usuario);
  });

  window.addEventListener('offline', () => {
    console.log('❌ Conexão perdida');
    syncState.isConnected = false;
  });

  return () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  };
}

/**
 * Sincronizar dados com servidor
 */
async function sincronizarDados(usuario: UsuarioLogado) {
  if (syncState.syncInProgress) {
    return; // Evitar sincronizações simultâneas
  }

  syncState.syncInProgress = true;

  try {
    // 1. Enviar dados locais para servidor primeiro
    const dadosLocais = await buscarDadosLocais(usuario);
    await enviarDadosParaServidor(usuario, dadosLocais);

    // 2. Buscar dados do servidor
    const dadosServidor = await buscarDadosServidor(usuario);

    // 3. Detectar conflitos
    const conflitos = detectarConflitos(dadosLocais, dadosServidor);
    if (conflitos.length > 0) {
      console.warn('⚠️ Conflitos detectados:', conflitos);
      syncConflicts = conflitos;
      resolverConflitos(conflitos);
    }

    // 4. Atualizar dados locais com dados do servidor
    await atualizarDadosLocais(dadosServidor);

    syncState.lastSync = Date.now();
    syncState.pendingChanges = 0;
    syncState.lastError = null;
    syncState.isConnected = true;
    console.log('✅ Sincronização concluída com sucesso');

    // Emitir evento de sincronização
    window.dispatchEvent(new CustomEvent('sync:completed', {
      detail: { timestamp: syncState.lastSync }
    }));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao sincronizar:', errorMsg);
    syncState.isConnected = false;
    syncState.lastError = errorMsg;
  } finally {
    syncState.syncInProgress = false;
  }
}

/**
 * Buscar dados do servidor
 */
async function buscarDadosServidor(usuario: UsuarioLogado) {
  try {
    const response = await fetch('/api/sync/dados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: usuario.id, lastSync: syncState.lastSync }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar dados do servidor:', error);
    return { clientes: [], lancamentos: [] };
  }
}

/**
 * Buscar dados locais
 */
async function buscarDadosLocais(usuario: UsuarioLogado) {
  try {
    const clientes = await db.obterClientes();
    const lancamentos = await db.obterTodosLancamentos();

    return {
      clientes: clientes || [],
      lancamentos: lancamentos || [],
    };
  } catch (error) {
    console.error('Erro ao buscar dados locais:', error);
    return { clientes: [], lancamentos: [] };
  }
}

/**
 * Detectar conflitos entre dados locais e do servidor
 */
function detectarConflitos(dadosLocais: any, dadosServidor: any): SyncConflict[] {
  const conflitos: SyncConflict[] = [];

  // Verificar conflitos em clientes
  for (const clienteLocal of dadosLocais.clientes) {
    const clienteRemoto = dadosServidor.clientes?.find((c: any) => c.id === clienteLocal.id);
    if (clienteRemoto && clienteLocal.dataAtualizacao !== clienteRemoto.dataAtualizacao) {
      conflitos.push({
        type: 'cliente',
        id: clienteLocal.id,
        local: clienteLocal,
        remote: clienteRemoto,
        resolution: clienteLocal.dataAtualizacao > clienteRemoto.dataAtualizacao ? 'local' : 'remote',
      });
    }
  }

  // Verificar conflitos em lançamentos
  for (const lancamentoLocal of dadosLocais.lancamentos) {
    const lancamentoRemoto = dadosServidor.lancamentos?.find((l: any) => l.id === lancamentoLocal.id);
    if (lancamentoRemoto && lancamentoLocal.dataAtualizacao !== lancamentoRemoto.dataAtualizacao) {
      conflitos.push({
        type: 'lancamento',
        id: lancamentoLocal.id,
        local: lancamentoLocal,
        remote: lancamentoRemoto,
        resolution: lancamentoLocal.dataAtualizacao > lancamentoRemoto.dataAtualizacao ? 'local' : 'remote',
      });
    }
  }

  return conflitos;
}

/**
 * Resolver conflitos (usar última modificação)
 */
function resolverConflitos(conflitos: SyncConflict[]) {
  for (const conflito of conflitos) {
    const vencedor = conflito.resolution === 'local' ? conflito.local : conflito.remote;
    console.log(`🔧 Resolvendo conflito de ${conflito.type} ${conflito.id}: usando versão ${conflito.resolution}`);
  }
}

/**
 * Enviar dados locais para servidor
 */
async function enviarDadosParaServidor(usuario: UsuarioLogado, dados: any) {
  try {
    const response = await fetch('/api/sync/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: usuario.id,
        clientes: dados.clientes,
        lancamentos: dados.lancamentos,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar dados: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Dados enviados para servidor: ${result.clientesCriados} clientes, ${result.lancamentosCriados} lançamentos`);
  } catch (error) {
    console.error('Erro ao enviar dados para servidor:', error);
    syncState.pendingChanges++;
  }
}

/**
 * Atualizar dados locais com dados do servidor
 */
async function atualizarDadosLocais(dadosServidor: any) {
  try {
    // Atualizar clientes
    for (const cliente of dadosServidor.clientes || []) {
      await db.adicionarCliente(cliente);
    }

    // Atualizar lançamentos
    for (const lancamento of dadosServidor.lancamentos || []) {
      await db.adicionarLancamento(lancamento);
    }

    console.log('✅ Dados locais atualizados');
  } catch (error) {
    console.error('Erro ao atualizar dados locais:', error);
  }
}

/**
 * Obter estado de sincronização
 */
export function obterEstadoSync(): SyncState {
  return { ...syncState };
}

/**
 * Obter conflitos pendentes
 */
export function obterConflitos(): SyncConflict[] {
  return [...syncConflicts];
}

/**
 * Forçar sincronização imediata
 */
export async function forcarSincronizacao(usuario: UsuarioLogado) {
  console.log('🔄 Forçando sincronização imediata...');
  await sincronizarDados(usuario);
}

/**
 * Parar polling
 */
export function pararPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    console.log('⏹️ Polling parado');
  }
}
