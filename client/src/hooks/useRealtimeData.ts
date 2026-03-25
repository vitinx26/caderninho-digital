/**
 * useRealtimeData.ts - Hook para sincronização em tempo real
 * 
 * Características:
 * - Conecta ao WebSocket do servidor
 * - Sincroniza dados em tempo real
 * - Cache em memória apenas (sem localStorage/IndexedDB)
 * - Atualiza automaticamente quando dados mudam
 * - Suporta múltiplos dispositivos
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface RealtimeDataState {
  usuarios: any[];
  clientes: any[];
  lancamentos: any[];
  configuracoes: any;
  ultimaSincronizacao: number;
  statusConexao: 'conectado' | 'desconectado' | 'sincronizando';
}

interface RealtimeListener {
  (state: RealtimeDataState): void;
}

class RealtimeDataManager {
  private ws: WebSocket | null = null;
  private state: RealtimeDataState = {
    usuarios: [],
    clientes: [],
    lancamentos: [],
    configuracoes: {},
    ultimaSincronizacao: 0,
    statusConexao: 'desconectado',
  };
  private listeners: Set<RealtimeListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private userId: string | null = null;

  constructor() {
    this.setupWebSocket();
  }

  private setupWebSocket() {
    try {
      // Determinar URL do WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/realtime`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.reconnectAttempts = 0;
        this.updateStatus('conectado');
        this.requestFullSync();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erro WebSocket:', error);
        this.updateStatus('desconectado');
      };

      this.ws.onclose = () => {
        console.warn('⚠️ WebSocket desconectado');
        this.updateStatus('desconectado');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      const { type, payload } = message;

      switch (type) {
        case 'sync:full_state':
          this.state = {
            ...this.state,
            ...payload,
            ultimaSincronizacao: Date.now(),
          };
          break;

        case 'sync:client_created':
        case 'sync:client_updated':
          this.updateCliente(payload);
          break;

        case 'sync:client_deleted':
          this.state.clientes = this.state.clientes.filter(
            (c) => c.id !== payload.id
          );
          break;

        case 'sync:transaction_created':
        case 'sync:transaction_updated':
          this.updateLancamento(payload);
          break;

        case 'sync:transaction_deleted':
          this.state.lancamentos = this.state.lancamentos.filter(
            (l) => l.id !== payload.id
          );
          break;

        case 'sync:config_updated':
          this.state.configuracoes = {
            ...this.state.configuracoes,
            ...payload,
          };
          break;

        default:
          console.warn('Tipo de mensagem desconhecido:', type);
      }

      this.state.ultimaSincronizacao = Date.now();
      this.notifyListeners();
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  }

  private updateCliente(cliente: any) {
    const index = this.state.clientes.findIndex((c) => c.id === cliente.id);
    if (index >= 0) {
      this.state.clientes[index] = cliente;
    } else {
      this.state.clientes.push(cliente);
    }
  }

  private updateLancamento(lancamento: any) {
    const index = this.state.lancamentos.findIndex(
      (l) => l.id === lancamento.id
    );
    if (index >= 0) {
      this.state.lancamentos[index] = lancamento;
    } else {
      this.state.lancamentos.push(lancamento);
    }
  }

  private updateStatus(
    status: 'conectado' | 'desconectado' | 'sincronizando'
  ) {
    this.state.statusConexao = status;
    this.notifyListeners();
  }

  private requestFullSync() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'sync:request_full_state',
          userId: this.userId,
        })
      );
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `🔄 Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts})`
      );
      setTimeout(() => this.setupWebSocket(), delay);
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido');
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    // Retornar função para desinscrever
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): RealtimeDataState {
    return this.state;
  }

  public send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type,
          payload,
          userId: this.userId,
        })
      );
    } else {
      console.warn('WebSocket não está conectado');
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Instância global
let realtimeManager: RealtimeDataManager | null = null;

function getRealtimeManager(): RealtimeDataManager {
  if (!realtimeManager) {
    realtimeManager = new RealtimeDataManager();
  }
  return realtimeManager;
}

/**
 * Hook para usar dados em tempo real
 */
export function useRealtimeData() {
  const { usuarioLogado } = useAuth();
  const [state, setState] = useState<RealtimeDataState>(
    getRealtimeManager().getState()
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const manager = getRealtimeManager();

    // Definir ID do usuário
    if (usuarioLogado?.id) {
      manager.setUserId(usuarioLogado.id);
    }

    // Inscrever para atualizações
    unsubscribeRef.current = manager.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [usuarioLogado?.id]);

  const send = useCallback((type: string, payload: any) => {
    getRealtimeManager().send(type, payload);
  }, []);

  return {
    ...state,
    send,
    isConnected: state.statusConexao === 'conectado',
  };
}

/**
 * Hook para operações específicas
 */
export function useRealtimeClientes() {
  const { clientes, send, isConnected } = useRealtimeData();

  const adicionarCliente = useCallback(
    async (nome: string, telefone?: string, email?: string) => {
      send('client:create', { nome, telefone, email });
    },
    [send]
  );

  const atualizarCliente = useCallback(
    async (id: string, dados: any) => {
      send('client:update', { id, ...dados });
    },
    [send]
  );

  const deletarCliente = useCallback(
    async (id: string) => {
      send('client:delete', { id });
    },
    [send]
  );

  return {
    clientes,
    adicionarCliente,
    atualizarCliente,
    deletarCliente,
    isConnected,
  };
}

/**
 * Hook para transações
 */
export function useRealtimeLancamentos(clienteId?: string) {
  const { lancamentos, send, isConnected } = useRealtimeData();

  const lancamentosDoCliente = clienteId
    ? lancamentos.filter((l) => l.clienteId === clienteId)
    : lancamentos;

  const adicionarLancamento = useCallback(
    async (
      clienteId: string,
      tipo: 'debito' | 'pagamento',
      valor: number,
      descricao: string
    ) => {
      send('transaction:create', {
        clienteId,
        tipo,
        valor,
        descricao,
        data: Date.now(),
      });
    },
    [send]
  );

  const deletarLancamento = useCallback(
    async (id: string) => {
      send('transaction:delete', { id });
    },
    [send]
  );

  return {
    lancamentos: lancamentosDoCliente,
    adicionarLancamento,
    deletarLancamento,
    isConnected,
  };
}
