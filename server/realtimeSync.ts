/**
 * realtimeSync.ts - Servidor WebSocket para sincronização em tempo real
 * 
 * Características:
 * - Gerencia conexões WebSocket
 * - Broadcast de eventos para clientes conectados
 * - Sincronização de estado global
 * - Autenticação por JWT
 * - Permissões por role (admin/cliente)
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import * as dbOperations from './db';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  userRole: 'admin' | 'cliente';
  connectedAt: number;
}

interface RealtimeMessage {
  type: string;
  payload: any;
  userId: string;
}

export class RealtimeSyncServer {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private jwtSecret: string;

  constructor(server: Server, jwtSecret: string) {
    this.jwtSecret = jwtSecret;
    this.wss = new WebSocketServer({ server, path: '/api/realtime' });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request: any) => {
      console.log('🔗 Nova conexão WebSocket');

      // Extrair token do header
      const token = this.extractToken(request);
      if (!token) {
        console.warn('❌ Conexão sem token rejeitada');
        ws.close(1008, 'Token não fornecido');
        return;
      }

      // Validar token
      const decoded = this.validateToken(token);
      if (!decoded) {
        console.warn('❌ Token inválido rejeitado');
        ws.close(1008, 'Token inválido');
        return;
      }

      const clientId = `${decoded.userId}-${Date.now()}`;
      const connection: ClientConnection = {
        ws,
        userId: decoded.userId,
        userRole: decoded.role,
        connectedAt: Date.now(),
      };

      this.clients.set(clientId, connection);
      console.log(`✅ Cliente conectado: ${decoded.userId} (${decoded.role})`);

      // Enviar estado completo
      this.sendFullState(ws, decoded.userId, decoded.role);

      // Listeners
      ws.on('message', (data: any) => {
        this.handleMessage(clientId, data.toString());
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`❌ Cliente desconectado: ${decoded.userId}`);
      });

      ws.on('error', (error: any) => {
        console.error('Erro WebSocket:', error);
      });
    });
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    const [, token] = authHeader.split(' ');
    return token;
  }

  private validateToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return null;
    }
  }

  private async sendFullState(
    ws: WebSocket,
    userId: string,
    userRole: 'admin' | 'cliente'
  ) {
    try {
      // Buscar dados do servidor
      const usuarios = userRole === 'admin' ? await dbOperations.getAllUsers() : [];
      const clientes = await dbOperations.getAllUsers();
      const lancamentos = await dbOperations.getAllTransactions();
      const configuracoes = {};

      const state = {
        usuarios,
        clientes,
        lancamentos,
        configuracoes,
        ultimaSincronizacao: Date.now(),
      };

      ws.send(
        JSON.stringify({
          type: 'sync:full_state',
          payload: state,
        })
      );

      console.log(`📤 Estado completo enviado para ${userId}`);
    } catch (error) {
      console.error('Erro ao enviar estado completo:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Erro ao sincronizar dados',
        })
      );
    }
  }

  private async handleMessage(clientId: string, data: string) {
    try {
      const message: RealtimeMessage = JSON.parse(data);
      const connection = this.clients.get(clientId);

      if (!connection) {
        console.warn('Conexão não encontrada');
        return;
      }

      const { type, payload, userId } = message;

      console.log(`📨 Mensagem recebida: ${type} de ${userId}`);

      // Validar permissões
      if (!this.validatePermission(connection.userRole, type)) {
        connection.ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Permissão negada',
          })
        );
        return;
      }

      // Processar operação
      await this.processOperation(type, payload, connection.userRole);

      // Broadcast para todos os clientes
      this.broadcast(type, payload);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  private validatePermission(userRole: string, operationType: string): boolean {
    // Clientes só podem criar transações
    if (userRole === 'cliente') {
      return operationType.startsWith('transaction:');
    }
    // Admins podem fazer tudo
    return true;
  }

  private async processOperation(
    type: string,
    payload: any,
    userRole: string
  ) {
    try {
      switch (type) {
        case 'client:create':
          await dbOperations.createUser(payload);
          break;

        case 'client:update':
          await dbOperations.updateUser(payload.id, payload);
          break;

        case 'client:delete':
          // Deletar usuário
          break;

        case 'transaction:create':
          await dbOperations.createTransaction(payload);
          break;

        case 'transaction:delete':
          // Deletar transação
          break;

        case 'config:update':
          // Atualizar configuração
          break;

        case 'sync:request_full_state':
          // Já tratado na conexão
          break;

        default:
          console.warn('Tipo de operação desconhecido:', type);
      }
    } catch (error) {
      console.error(`Erro ao processar ${type}:`, error);
      throw error;
    }
  }

  private broadcast(type: string, payload: any) {
    const message = JSON.stringify({
      type: `sync:${type.split(':')[0]}_${type.split(':')[1]}`,
      payload,
    });

    let count = 0;
    this.clients.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message);
        count++;
      }
    });

    console.log(`📢 Broadcast: ${type} para ${count} clientes`);
  }

  public notifyClients(type: string, payload: any) {
    this.broadcast(type, payload);
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getClientsByRole(role: 'admin' | 'cliente'): number {
    return Array.from(this.clients.values()).filter(
      (c) => c.userRole === role
    ).length;
  }
}

// Exportar instância global
let realtimeSyncServer: RealtimeSyncServer | null = null;

export function initRealtimeSync(
  server: Server,
  jwtSecret: string
): RealtimeSyncServer {
  realtimeSyncServer = new RealtimeSyncServer(server, jwtSecret);
  return realtimeSyncServer;
}

export function getRealtimeSyncServer(): RealtimeSyncServer | null {
  return realtimeSyncServer;
}
