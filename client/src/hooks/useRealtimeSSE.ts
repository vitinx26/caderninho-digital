/**
 * useRealtimeSSE.ts - Hook para sincronização em tempo real via SSE + Polling
 * 
 * Combina:
 * - SSE para notificações em tempo real (push)
 * - Polling inteligente como fallback (pull)
 * - Cache em memória apenas
 */

import { useEffect, useCallback, useRef, useState } from 'react';

export interface RealtimeSSEState {
  usuarios: any[];
  clientes: any[];
  lancamentos: any[];
  configuracoes: any;
  ultimaSincronizacao: number;
  statusConexao: 'conectado' | 'desconectado' | 'sincronizando';
  isConnected: boolean;
}

class RealtimeSSEManager {
  private state: RealtimeSSEState = {
    usuarios: [],
    clientes: [],
    lancamentos: [],
    configuracoes: {},
    ultimaSincronizacao: 0,
    statusConexao: 'desconectado',
    isConnected: false,
  };

  private listeners: Set<(state: RealtimeSSEState) => void> = new Set();
  private eventSource: EventSource | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private pollingDelay = 5000; // 5 segundos
  private lastPollTime = 0;
  private isConnecting = false; // Flag para evitar múltiplas conexões
  private connectionAttempts = 0; // Contador de tentativas

  /**
   * Conectar ao SSE
   */
  connect() {
    // Evitar múltiplas tentativas simultâneas
    if (this.eventSource || this.isConnecting) {
      console.warn('⚠️ SSE já está conectado ou conectando');
      return;
    }

    this.isConnecting = true;
    this.connectionAttempts++;

    try {
      console.log(`🔌 Conectando ao SSE (tentativa ${this.connectionAttempts})...`);
      this.updateStatus('sincronizando');

      // Usar URL absoluta em produção, relativa em dev
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const sseUrl = `${baseUrl}/api/events/subscribe`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        console.log('✅ SSE conectado com sucesso');
        this.updateStatus('conectado');
        this.requestFullSync();
      };

      this.eventSource.addEventListener('data:updated', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📥 Atualização recebida: ${data.entityType}`);
          this.handleDataUpdate(data);
        } catch (error) {
          console.error('Erro ao processar evento SSE:', error);
        }
      });

      this.eventSource.onerror = () => {
        console.error('❌ Erro SSE - Usando polling como fallback');
        this.updateStatus('desconectado');
        this.eventSource?.close();
        this.eventSource = null;
        this.isConnecting = false;
        // Tentar polling direto em vez de reconectar SSE
        this.startPolling();
      };
    } catch (error) {
      console.error('Erro ao conectar SSE:', error);
      this.updateStatus('desconectado');
      this.isConnecting = false;
      // Usar polling como fallback
      this.startPolling();
    }
  }

  /**
   * Desconectar do SSE
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 SSE desconectado');
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.updateStatus('desconectado');
  }

  /**
   * Tentar reconectar
   */
  private attemptReconnect() {
    // Limitar tentativas de reconexão
    if (this.connectionAttempts > 5) {
      console.error('❌ Muitas tentativas de reconexão, desistindo');
      return;
    }

    const delayMs = Math.min(3000 * this.connectionAttempts, 30000); // Backoff exponencial
    console.log(`🔄 Tentando reconectar em ${delayMs}ms (tentativa ${this.connectionAttempts})...`);
    setTimeout(() => {
      this.isConnecting = false;
      this.connect();
    }, delayMs);
  }

  /**
   * Solicitar sincronização completa
   */
  private async requestFullSync() {
    try {
      console.log('🔄 Solicitando sincronização completa...');
      this.updateStatus('sincronizando');
      this.isConnecting = false; // Marcar como conectado

      // Usar URL absoluta em produção, relativa em dev
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const apiUrl = (path: string) => `${baseUrl}${path}`;

      // Carregar dados do servidor
      console.log('🔄 Sincronizando: GET /api/users, /api/all-clients, /api/lancamentos');
      const [usuarios, clientes, lancamentos] = await Promise.all([
        fetch(apiUrl('/api/users')).then(r => {
          console.log(`  ✅ GET /api/users: ${r.status} ${r.statusText}`);
          return r.json();
        }).catch(e => {
          console.error(`  ❌ GET /api/users: ${e.message}`);
          throw e;
        }),
        fetch(apiUrl('/api/all-clients')).then(r => {
          console.log(`  ✅ GET /api/all-clients: ${r.status} ${r.statusText}`);
          return r.json();
        }).catch(e => {
          console.error(`  ❌ GET /api/all-clients: ${e.message}`);
          throw e;
        }),
        fetch(apiUrl('/api/lancamentos')).then(r => {
          console.log(`  ✅ GET /api/lancamentos: ${r.status} ${r.statusText}`);
          return r.json();
        }).catch(e => {
          console.error(`  ❌ GET /api/lancamentos: ${e.message}`);
          throw e;
        }),
      ]);

      this.state.usuarios = Array.isArray(usuarios) ? usuarios : [];
      this.state.clientes = Array.isArray(clientes) ? clientes : [];
      this.state.lancamentos = Array.isArray(lancamentos) ? lancamentos : [];
      this.state.ultimaSincronizacao = Date.now();

      console.log(`✅ Sincronização completa: ${this.state.usuarios.length} usuários, ${this.state.clientes.length} clientes, ${this.state.lancamentos.length} lançamentos`);

      // Marcar como conectado (mesmo que SSE falhe, polling funciona)
      this.updateStatus('conectado');
      this.notifyListeners();
      this.connectionAttempts = 0; // Resetar contador

      // Sempre iniciar polling como fallback/backup
      this.startPolling();
      console.log('📄 Polling iniciado como sincronização de backup');
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      // Não marcar como desconectado - tentar polling mesmo assim
      this.isConnecting = false;
      this.startPolling();
    }
  }

  /**
   * Iniciar polling inteligente
   */
  private startPolling() {
    if (this.pollingInterval) {
      return; // Já está rodando
    }

    console.log('📊 Iniciando polling inteligente (5s)');

    this.pollingInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const timeSinceLastPoll = now - this.lastPollTime;

        // Fazer polling a cada 5 segundos
        if (timeSinceLastPoll >= this.pollingDelay) {
          this.lastPollTime = now;

          // Usar URL absoluta em produção, relativa em dev
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const apiUrl = (path: string) => `${baseUrl}${path}`;

          // Carregar dados do servidor
          const [usuarios, clientes, lancamentos] = await Promise.all([
            fetch(apiUrl('/api/users')).then(r => {
              if (!r.ok) console.warn(`  ⚠️ GET /api/users: ${r.status}`);
              return r.json();
            }).catch(e => {
              console.error(`  ❌ GET /api/users: ${e.message}`);
              return [];
            }),
            fetch(apiUrl('/api/all-clients')).then(r => {
              if (!r.ok) console.warn(`  ⚠️ GET /api/all-clients: ${r.status}`);
              return r.json();
            }).catch(e => {
              console.error(`  ❌ GET /api/all-clients: ${e.message}`);
              return [];
            }),
            fetch(apiUrl('/api/lancamentos')).then(r => {
              if (!r.ok) console.warn(`  ⚠️ GET /api/lancamentos: ${r.status}`);
              return r.json();
            }).catch(e => {
              console.error(`  ❌ GET /api/lancamentos: ${e.message}`);
              return [];
            }),
          ]);

          const usuariosArray = Array.isArray(usuarios) ? usuarios : [];
          const clientesArray = Array.isArray(clientes) ? clientes : [];
          const lancamentosArray = Array.isArray(lancamentos) ? lancamentos : [];

          // Detectar mudanças
          const usuariosChanged = JSON.stringify(this.state.usuarios) !== JSON.stringify(usuariosArray);
          const clientesChanged = JSON.stringify(this.state.clientes) !== JSON.stringify(clientesArray);
          const lancamentosChanged = JSON.stringify(this.state.lancamentos) !== JSON.stringify(lancamentosArray);

          if (usuariosChanged || clientesChanged || lancamentosChanged) {
            console.log('🔄 Mudanças detectadas no polling');

            if (usuariosChanged) this.state.usuarios = usuariosArray;
            if (clientesChanged) this.state.clientes = clientesArray;
            if (lancamentosChanged) this.state.lancamentos = lancamentosArray;

            this.state.ultimaSincronizacao = now;
            this.notifyListeners();
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 1000); // Verificar a cada 1 segundo se é hora de fazer polling
  }

  /**
   * Processar atualização de dados
   */
  private handleDataUpdate(data: any) {
    const { entityType, data: payload } = data;

    switch (entityType) {
      case 'usuarios':
        this.state.usuarios = payload;
        break;
      case 'clientes':
        this.state.clientes = payload;
        break;
      case 'lancamentos':
        this.state.lancamentos = payload;
        break;
      default:
        console.warn(`Tipo de entidade desconhecido: ${entityType}`);
    }

    this.state.ultimaSincronizacao = Date.now();
    this.notifyListeners();
  }

  /**
   * Atualizar status
   */
  private updateStatus(status: 'conectado' | 'desconectado' | 'sincronizando') {
    this.state.statusConexao = status;
    this.state.isConnected = status === 'conectado';
    this.notifyListeners();
  }

  /**
   * Notificar listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Adicionar listener
   */
  subscribe(listener: (state: RealtimeSSEState) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Obter estado atual
   */
  getState(): RealtimeSSEState {
    return { ...this.state };
  }
}

// Instância global
const sseManager = new RealtimeSSEManager();

/**
 * Hook para usar dados em tempo real
 */
export function useRealtimeSSE() {
  const [state, setState] = useState<RealtimeSSEState>(sseManager.getState());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Conectar ao SSE
    sseManager.connect();

    // Inscrever para atualizações
    unsubscribeRef.current = sseManager.subscribe(setState);

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return state;
}

/**
 * Hook para dados de clientes
 */
export function useClientesSSE() {
  const { clientes, isConnected } = useRealtimeSSE();

  return {
    clientes,
    isConnected,
  };
}

/**
 * Hook para dados de lançamentos
 */
export function useLancamentosSSE(clienteId?: string) {
  const { lancamentos, isConnected } = useRealtimeSSE();

  const lancamentosDoCliente = clienteId
    ? lancamentos.filter((l: any) => l.clienteId === clienteId)
    : lancamentos;

  return {
    lancamentos: lancamentosDoCliente,
    isConnected,
  };
}

/**
 * Hook para status de conexão
 */
export function useConnectionStatusSSE() {
  const { statusConexao, isConnected, ultimaSincronizacao } = useRealtimeSSE();

  return {
    statusConexao,
    isConnected,
    ultimaSincronizacao,
  };
}

export { sseManager };
