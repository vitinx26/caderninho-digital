/**
 * useWebSocket.ts - Hook para gerenciar conexão WebSocket
 * 
 * Conecta ao servidor WebSocket ao fazer login
 * Emite eventos quando dados são criados/atualizados
 * Recebe eventos de sincronização em tempo real
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { setupWebSocketListeners, removeWebSocketListeners } from '@/lib/websocketListener';
import { UsuarioLogado } from '@/types';

interface WebSocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectedAdmins: number;
}

export function useWebSocket(usuario: UsuarioLogado | null) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectedAdmins: 0,
  });

  useEffect(() => {
    // Só conectar se for admin e tiver usuário logado
    if (!usuario || usuario.tipo !== 'admin') {
      return;
    }

    console.log('🔌 Conectando ao WebSocket...');
    setStatus(prev => ({ ...prev, isConnecting: true }));

    // Criar conexão WebSocket
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    /**
     * Conectado ao servidor
     */
    socket.on('connect', () => {
      // Configurar listeners de eventos
      setupWebSocketListeners(socket);
      console.log('✅ Conectado ao WebSocket');

      // Registrar admin
      socket.emit('admin:login', {
        id: usuario.id,
        email: usuario.email,
      });

      setStatus(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));

      // Iniciar heartbeat para manter conexão viva
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('sync:heartbeat', { adminId: usuario.id });
        }
      }, 30000); // A cada 30 segundos

      // Limpar heartbeat ao desconectar
      socket.on('disconnect', () => {
        clearInterval(heartbeatInterval);
      });
    });

    /**
     * Erro de conexão
     */
    socket.on('connect_error', (error: any) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error.message,
      }));
    });

    /**
     * Desconectado
     */
    socket.on('disconnect', () => {
      console.log('❌ Desconectado do WebSocket');
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    });

    /**
     * Admin conectado
     */
    socket.on('admin:connected', (data: any) => {
      console.log(`👤 Admin conectado: ${data.email}`);
      setStatus(prev => ({
        ...prev,
        connectedAdmins: data.connectedAdmins.length,
      }));
    });

    /**
     * Admin desconectado
     */
    socket.on('admin:disconnected', (data: any) => {
      console.log(`👤 Admin desconectado: ${data.email}`);
      setStatus(prev => ({
        ...prev,
        connectedAdmins: data.connectedAdmins.length,
      }));
    });

    /**
     * Fila de eventos pendentes
     */
    socket.on('sync:queue', (events: any[]) => {
      console.log(`📨 Recebidos ${events.length} eventos pendentes`);
      // Disparar evento customizado para sincronizar dados
      window.dispatchEvent(
        new CustomEvent('websocket:sync-queue', { detail: events })
      );
    });

    /**
     * Heartbeat ACK
     */
    socket.on('sync:heartbeat:ack', (data: any) => {
      console.log(`💓 Heartbeat ACK - Admins conectados: ${data.connectedAdmins}`);
    });

    // Limpar ao desmontar
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [usuario]);

  /**
   * Emitir evento de novo cliente criado
   */
  const emitClientCreated = (clientData: any) => {
    if (socketRef.current?.connected) {
      console.log(`📤 Emitindo client:created - ${clientData.nome}`);
      socketRef.current.emit('client:created', {
        ...clientData,
        adminId: usuario?.id,
      });
    }
  };

  /**
   * Emitir evento de cliente atualizado
   */
  const emitClientUpdated = (clientData: any) => {
    if (socketRef.current?.connected) {
      console.log(`📤 Emitindo client:updated - ${clientData.nome}`);
      socketRef.current.emit('client:updated', {
        ...clientData,
        adminId: usuario?.id,
      });
    }
  };

  /**
   * Emitir evento de novo lançamento criado
   */
  const emitTransactionCreated = (transactionData: any) => {
    if (socketRef.current?.connected) {
      console.log(`📤 Emitindo transaction:created - ${transactionData.tipo}`);
      socketRef.current.emit('transaction:created', {
        ...transactionData,
        adminId: usuario?.id,
      });
    }
  };

  /**
   * Emitir evento de lançamento atualizado
   */
  const emitTransactionUpdated = (transactionData: any) => {
    if (socketRef.current?.connected) {
      console.log(`📤 Emitindo transaction:updated - ${transactionData.tipo}`);
      socketRef.current.emit('transaction:updated', {
        ...transactionData,
        adminId: usuario?.id,
      });
    }
  };

  /**
   * Registrar listener para evento específico
   */
  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  /**
   * Remover listener
   */
  const off = (event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    status,
    emitClientCreated,
    emitClientUpdated,
    emitTransactionCreated,
    emitTransactionUpdated,
    on,
    off,
  };
}
