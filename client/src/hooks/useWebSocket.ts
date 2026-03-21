/**
 * useWebSocket.ts - Hook para gerenciar conexão WebSocket
 * 
 * DESABILITADO TEMPORARIAMENTE - Usar polling HTTP em vez disso
 * Conecta ao servidor WebSocket ao fazer login
 * Emite eventos quando dados são criados/atualizados
 * Recebe eventos de sincronização em tempo real
 */

import { useRef, useState } from 'react';
import { UsuarioLogado } from '@/types';

interface WebSocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectedAdmins: number;
}

export function useWebSocket(usuario: UsuarioLogado | null) {
  const socketRef = useRef<any>(null);
  const [status] = useState<WebSocketStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectedAdmins: 0,
  });

  /**
   * Emitir evento de novo cliente criado
   */
  const emitClientCreated = (clientData: any) => {
    console.log(`📤 client:created (WebSocket desabilitado) - ${clientData.nome}`);
  };

  /**
   * Emitir evento de cliente atualizado
   */
  const emitClientUpdated = (clientData: any) => {
    console.log(`📤 client:updated (WebSocket desabilitado) - ${clientData.nome}`);
  };

  /**
   * Emitir evento de novo lançamento criado
   */
  const emitTransactionCreated = (transactionData: any) => {
    console.log(`📤 transaction:created (WebSocket desabilitado) - ${transactionData.tipo}`);
  };

  /**
   * Emitir evento de lançamento atualizado
   */
  const emitTransactionUpdated = (transactionData: any) => {
    console.log(`📤 transaction:updated (WebSocket desabilitado) - ${transactionData.tipo}`);
  };

  /**
   * Registrar listener para evento específico
   */
  const on = (event: string, callback: (data: any) => void) => {
    // WebSocket desabilitado
  };

  /**
   * Remover listener
   */
  const off = (event: string, callback?: (data: any) => void) => {
    // WebSocket desabilitado
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
