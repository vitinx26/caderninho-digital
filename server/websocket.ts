/**
 * websocket.ts - Servidor WebSocket para sincronização em tempo real
 * 
 * Gerencia conexões de clientes e emite eventos quando dados são alterados
 * Permite que múltiplos admins vejam atualizações instantaneamente
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

interface ConnectedAdmin {
  id: string;
  email: string;
  socketId: string;
}

interface SyncEvent {
  type: 'client:created' | 'client:updated' | 'transaction:created' | 'transaction:updated';
  data: any;
  adminId: string;
  timestamp: number;
}

// Armazenar admins conectados
const connectedAdmins = new Map<string, ConnectedAdmin>();

// Fila de eventos para sincronização
const eventQueue: SyncEvent[] = [];

/**
 * Inicializar servidor WebSocket
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  /**
   * Evento: Admin conectado
   */
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    /**
     * Admin faz login e se registra no WebSocket
     */
    socket.on('admin:login', (data: { id: string; email: string }) => {
      console.log(`👤 Admin logado: ${data.email} (${socket.id})`);

      // Armazenar admin conectado
      connectedAdmins.set(data.id, {
        id: data.id,
        email: data.email,
        socketId: socket.id,
      });

      // Entrar em sala específica do admin
      socket.join(`admin:${data.id}`);

      // Entrar em sala de broadcast para todos os admins
      socket.join('admins:broadcast');

      // Notificar que admin conectou
      io.to('admins:broadcast').emit('admin:connected', {
        adminId: data.id,
        email: data.email,
        timestamp: Date.now(),
        connectedAdmins: Array.from(connectedAdmins.values()),
      });

      // Enviar fila de eventos pendentes
      if (eventQueue.length > 0) {
        console.log(`📨 Enviando ${eventQueue.length} eventos pendentes para ${data.email}`);
        socket.emit('sync:queue', eventQueue);
        eventQueue.length = 0; // Limpar fila
      }

      console.log(`✅ Admin registrado. Total conectado: ${connectedAdmins.size}`);
    });

    /**
     * Novo cliente criado
     */
    socket.on('client:created', (data: any) => {
      console.log(`✨ Novo cliente criado: ${data.nome} (admin: ${data.adminId})`);

      const event: SyncEvent = {
        type: 'client:created',
        data,
        adminId: data.adminId,
        timestamp: Date.now(),
      };

      // Broadcast para todos os admins
      io.to('admins:broadcast').emit('client:created', event);

      // Adicionar à fila se houver admins desconectados
      if (connectedAdmins.size < 2) {
        eventQueue.push(event);
      }

      console.log(`📢 Evento 'client:created' enviado para ${connectedAdmins.size} admins`);
    });

    /**
     * Cliente atualizado
     */
    socket.on('client:updated', (data: any) => {
      console.log(`✏️ Cliente atualizado: ${data.nome} (admin: ${data.adminId})`);

      const event: SyncEvent = {
        type: 'client:updated',
        data,
        adminId: data.adminId,
        timestamp: Date.now(),
      };

      // Broadcast para todos os admins
      io.to('admins:broadcast').emit('client:updated', event);

      // Adicionar à fila se houver admins desconectados
      if (connectedAdmins.size < 2) {
        eventQueue.push(event);
      }

      console.log(`📢 Evento 'client:updated' enviado para ${connectedAdmins.size} admins`);
    });

    /**
     * Novo lançamento criado
     */
    socket.on('transaction:created', (data: any) => {
      console.log(`💰 Novo lançamento: ${data.tipo} de R$ ${data.valor} (cliente: ${data.clienteId})`);

      const event: SyncEvent = {
        type: 'transaction:created',
        data,
        adminId: data.adminId,
        timestamp: Date.now(),
      };

      // Broadcast para todos os admins
      io.to('admins:broadcast').emit('transaction:created', event);

      // Adicionar à fila se houver admins desconectados
      if (connectedAdmins.size < 2) {
        eventQueue.push(event);
      }

      console.log(`📢 Evento 'transaction:created' enviado para ${connectedAdmins.size} admins`);
    });

    /**
     * Lançamento atualizado
     */
    socket.on('transaction:updated', (data: any) => {
      console.log(`✏️ Lançamento atualizado: ${data.tipo} de R$ ${data.valor}`);

      const event: SyncEvent = {
        type: 'transaction:updated',
        data,
        adminId: data.adminId,
        timestamp: Date.now(),
      };

      // Broadcast para todos os admins
      io.to('admins:broadcast').emit('transaction:updated', event);

      // Adicionar à fila se houver admins desconectados
      if (connectedAdmins.size < 2) {
        eventQueue.push(event);
      }

      console.log(`📢 Evento 'transaction:updated' enviado para ${connectedAdmins.size} admins`);
    });

    /**
     * Sincronização periódica (heartbeat)
     */
    socket.on('sync:heartbeat', (data: { adminId: string }) => {
      console.log(`💓 Heartbeat de ${data.adminId}`);

      // Atualizar timestamp do admin
      const admin = connectedAdmins.get(data.adminId);
      if (admin) {
        admin.socketId = socket.id; // Atualizar socket ID em caso de reconexão
      }

      // Responder com confirmação
      socket.emit('sync:heartbeat:ack', {
        timestamp: Date.now(),
        connectedAdmins: connectedAdmins.size,
      });
    });

    /**
     * Admin desconectado
     */
    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);

      // Remover admin da lista
      let disconnectedAdmin: ConnectedAdmin | undefined;
      const entries = Array.from(connectedAdmins.entries());
      for (const [adminId, admin] of entries) {
        if (admin.socketId === socket.id) {
          disconnectedAdmin = admin;
          connectedAdmins.delete(adminId);
          break;
        }
      }

      if (disconnectedAdmin) {
        console.log(`👤 Admin desconectado: ${disconnectedAdmin.email}`);

        // Notificar outros admins
        io.to('admins:broadcast').emit('admin:disconnected', {
          adminId: disconnectedAdmin.id,
          email: disconnectedAdmin.email,
          timestamp: Date.now(),
          connectedAdmins: Array.from(connectedAdmins.values()),
        });
      }

      console.log(`ℹ️ Total de admins conectados: ${connectedAdmins.size}`);
    });

    /**
     * Erro de conexão
     */
    socket.on('error', (error: any) => {
      console.error(`⚠️ Erro de WebSocket: ${error}`);
    });
  });

  return io;
}

/**
 * Emitir evento de sincronização para todos os admins
 */
export function broadcastSyncEvent(io: SocketIOServer, event: SyncEvent) {
  console.log(`📢 Broadcasting evento: ${event.type}`);
  io.to('admins:broadcast').emit(event.type, event);
}

/**
 * Obter lista de admins conectados
 */
export function getConnectedAdmins() {
  return Array.from(connectedAdmins.values());
}

/**
 * Obter fila de eventos pendentes
 */
export function getEventQueue() {
  return [...eventQueue];
}
