/**
 * realtimeEndpoint.ts - Endpoint WebSocket para sincronização em tempo real
 * 
 * Gerencia conexões WebSocket e sincroniza dados entre clientes e servidor
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { IncomingMessage } from 'http';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  userType: 'admin' | 'cliente' | 'geral';
  connectedAt: number;
}

const clients = new Map<string, ClientConnection>();
let wsServer: WebSocketServer | null = null;

/**
 * Inicializar servidor WebSocket
 */
export function initializeRealtimeWebSocket(httpServer: HTTPServer) {
  wsServer = new WebSocketServer({ 
    server: httpServer,
    path: '/api/realtime'
  });

  wsServer.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log('✅ Cliente WebSocket conectado');

    const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, ws, message);
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });

    ws.on('close', () => {
      console.log(`❌ Cliente WebSocket desconectado: ${clientId}`);
      clients.delete(clientId);
      broadcastToAll({
        type: 'client:disconnected',
        clientId,
        timestamp: Date.now(),
      });
    });

    ws.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error);
    });

    // Enviar confirmação de conexão
    ws.send(JSON.stringify({
      type: 'connection:established',
      clientId,
      timestamp: Date.now(),
    }));
  });

  console.log('🔌 WebSocket servidor inicializado em /api/realtime');
  return wsServer;
}

/**
 * Processar mensagens do cliente
 */
function handleMessage(clientId: string, ws: WebSocket, message: any) {
  const { type, data, userId, userType } = message;

  if (type === 'auth') {
    // Registrar cliente
    clients.set(clientId, {
      ws,
      userId: userId || clientId,
      userType: userType || 'geral',
      connectedAt: Date.now(),
    });

    console.log(`👤 Cliente autenticado: ${userId} (${userType})`);

    // Confirmar autenticação
    ws.send(JSON.stringify({
      type: 'auth:success',
      clientId,
      timestamp: Date.now(),
    }));

    // Notificar outros clientes
    broadcastToAll({
      type: 'client:connected',
      clientId,
      userId,
      userType,
      timestamp: Date.now(),
    });
  } else if (type === 'sync:request') {
    // Cliente solicita sincronização completa
    console.log(`🔄 Sincronização solicitada por ${clientId}`);
    
    ws.send(JSON.stringify({
      type: 'sync:response',
      data: {
        usuarios: [],
        clientes: [],
        lancamentos: [],
        configuracoes: {},
      },
      timestamp: Date.now(),
    }));
  } else if (type === 'data:update') {
    // Propagar atualização para todos os clientes
    console.log(`📤 Propagando atualização: ${data.entityType}`);
    
    broadcastToAll({
      type: 'data:updated',
      entityType: data.entityType,
      data: data.payload,
      updatedBy: userId,
      timestamp: Date.now(),
    });
  } else if (type === 'ping') {
    // Responder ao ping
    ws.send(JSON.stringify({
      type: 'pong',
      timestamp: Date.now(),
    }));
  }
}

/**
 * Enviar mensagem para todos os clientes conectados
 */
function broadcastToAll(message: any) {
  const payload = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

/**
 * Enviar mensagem para clientes específicos
 */
export function sendToClients(userIds: string[], message: any) {
  const payload = JSON.stringify(message);
  
  clients.forEach((client) => {
    if (userIds.includes(client.userId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

/**
 * Obter informações de clientes conectados
 */
export function getConnectedClients() {
  return Array.from(clients.values()).map(client => ({
    userId: client.userId,
    userType: client.userType,
    connectedAt: client.connectedAt,
  }));
}

/**
 * Notificar sobre atualização de dados
 */
export function notifyDataUpdate(entityType: string, data: any, updatedBy?: string) {
  broadcastToAll({
    type: 'data:updated',
    entityType,
    data,
    updatedBy,
    timestamp: Date.now(),
  });
}
