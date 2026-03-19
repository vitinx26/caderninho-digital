/**
 * websocketListener.ts - Listener para eventos WebSocket
 * 
 * Recebe eventos do servidor WebSocket e dispara eventos customizados
 * para sincronização automática de dados
 */

import { Socket } from 'socket.io-client';

/**
 * Configurar listeners de eventos WebSocket
 */
export function setupWebSocketListeners(socket: Socket) {
  console.log('🔧 Configurando listeners de WebSocket');

  /**
   * Novo cliente criado por outro admin
   */
  socket.on('client:created', (event: any) => {
    console.log('📥 Evento recebido: client:created', event);

    // Disparar evento customizado para sincronizar UI
    window.dispatchEvent(
      new CustomEvent('websocket:client-created', { detail: event })
    );

    // Toast de notificação
    window.dispatchEvent(
      new CustomEvent('websocket:notification', {
        detail: {
          type: 'success',
          message: `✨ Novo cliente: ${event.data.nome}`,
        },
      })
    );
  });

  /**
   * Cliente atualizado por outro admin
   */
  socket.on('client:updated', (event: any) => {
    console.log('📥 Evento recebido: client:updated', event);

    // Disparar evento customizado para sincronizar UI
    window.dispatchEvent(
      new CustomEvent('websocket:client-updated', { detail: event })
    );

    // Toast de notificação
    window.dispatchEvent(
      new CustomEvent('websocket:notification', {
        detail: {
          type: 'info',
          message: `✏️ Cliente atualizado: ${event.data.nome}`,
        },
      })
    );
  });

  /**
   * Novo lançamento criado por outro admin
   */
  socket.on('transaction:created', (event: any) => {
    console.log('📥 Evento recebido: transaction:created', event);

    // Disparar evento customizado para sincronizar UI
    window.dispatchEvent(
      new CustomEvent('websocket:transaction-created', { detail: event })
    );

    // Toast de notificação
    const tipo = event.data.tipo === 'debito' ? 'Débito' : 'Pagamento';
    window.dispatchEvent(
      new CustomEvent('websocket:notification', {
        detail: {
          type: 'info',
          message: `💰 ${tipo}: R$ ${(event.data.valor / 100).toFixed(2)}`,
        },
      })
    );
  });

  /**
   * Lançamento atualizado por outro admin
   */
  socket.on('transaction:updated', (event: any) => {
    console.log('📥 Evento recebido: transaction:updated', event);

    // Disparar evento customizado para sincronizar UI
    window.dispatchEvent(
      new CustomEvent('websocket:transaction-updated', { detail: event })
    );

    // Toast de notificação
    const tipo = event.data.tipo === 'debito' ? 'Débito' : 'Pagamento';
    window.dispatchEvent(
      new CustomEvent('websocket:notification', {
        detail: {
          type: 'info',
          message: `✏️ ${tipo} atualizado: R$ ${(event.data.valor / 100).toFixed(2)}`,
        },
      })
    );
  });

  /**
   * Admin conectado
   */
  socket.on('admin:connected', (data: any) => {
    console.log('👤 Admin conectado:', data);

    window.dispatchEvent(
      new CustomEvent('websocket:admin-connected', { detail: data })
    );

    if (data.connectedAdmins.length > 1) {
      window.dispatchEvent(
        new CustomEvent('websocket:notification', {
          detail: {
            type: 'success',
            message: `👥 ${data.email} conectado (${data.connectedAdmins.length} online)`,
          },
        })
      );
    }
  });

  /**
   * Admin desconectado
   */
  socket.on('admin:disconnected', (data: any) => {
    console.log('👤 Admin desconectado:', data);

    window.dispatchEvent(
      new CustomEvent('websocket:admin-disconnected', { detail: data })
    );

    window.dispatchEvent(
      new CustomEvent('websocket:notification', {
        detail: {
          type: 'warning',
          message: `👤 ${data.email} desconectado`,
        },
      })
    );
  });

  /**
   * Fila de eventos pendentes
   */
  socket.on('sync:queue', (events: any[]) => {
    console.log('📨 Fila de eventos recebida:', events);

    window.dispatchEvent(
      new CustomEvent('websocket:sync-queue', { detail: events })
    );

    window.dispatchEvent(
      new CustomEvent('websocket:notification', {
        detail: {
          type: 'info',
          message: `📨 ${events.length} eventos sincronizados`,
        },
      })
    );
  });
}

/**
 * Remover listeners de WebSocket
 */
export function removeWebSocketListeners(socket: Socket) {
  console.log('🔧 Removendo listeners de WebSocket');

  socket.off('client:created');
  socket.off('client:updated');
  socket.off('transaction:created');
  socket.off('transaction:updated');
  socket.off('admin:connected');
  socket.off('admin:disconnected');
  socket.off('sync:queue');
}
