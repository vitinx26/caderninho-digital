/**
 * sseEndpoint.ts - Server-Sent Events para sincronização em tempo real
 * 
 * Alternativa mais simples e confiável ao WebSocket
 * Usa HTTP long-polling com SSE para notificações em tempo real
 */

import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';

const sseRouter = Router();

// Gerenciador de eventos SSE
class SSEManager extends EventEmitter {
  private clients: Map<string, Response> = new Map();
  private lastEventId: number = 0;

  addClient(clientId: string, res: Response) {
    this.clients.set(clientId, res);
    console.log(`✅ Cliente SSE conectado: ${clientId} (Total: ${this.clients.size})`);
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
    console.log(`❌ Cliente SSE desconectado: ${clientId} (Total: ${this.clients.size})`);
  }

  broadcast(event: string, data: any) {
    this.lastEventId++;
    const message = `id: ${this.lastEventId}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    
    let successCount = 0;
    this.clients.forEach((res, clientId) => {
      try {
        res.write(message);
        successCount++;
      } catch (error) {
        console.error(`Erro ao enviar para ${clientId}:`, error);
        this.removeClient(clientId);
      }
    });

    if (successCount > 0) {
      console.log(`📤 Evento "${event}" enviado para ${successCount} cliente(s)`);
    }
  }

  getConnectedCount(): number {
    return this.clients.size;
  }
}

const sseManager = new SSEManager();

/**
 * Endpoint SSE: Conectar cliente para receber atualizações
 */
sseRouter.get('/api/events/subscribe', (req: Request, res: Response) => {
  const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Configurar headers SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');

  // Enviar comentário inicial
  res.write(`: SSE conectado\n\n`);

  // Registrar cliente
  sseManager.addClient(clientId, res);

  // Enviar ping a cada 30 segundos para manter conexão viva
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch (error) {
      clearInterval(pingInterval);
      sseManager.removeClient(clientId);
    }
  }, 30000);

  // Limpar ao desconectar
  req.on('close', () => {
    clearInterval(pingInterval);
    sseManager.removeClient(clientId);
  });

  req.on('error', () => {
    clearInterval(pingInterval);
    sseManager.removeClient(clientId);
  });
});

/**
 * Endpoint para notificar atualização de dados
 */
sseRouter.post('/api/events/notify', (req: Request, res: Response) => {
  const { event, data } = req.body;

  if (!event || !data) {
    return res.status(400).json({ error: 'event e data são obrigatórios' });
  }

  sseManager.broadcast(event, data);
  res.json({ 
    success: true, 
    clientsNotified: sseManager.getConnectedCount(),
    event,
  });
});

/**
 * Endpoint para obter status de conexões
 */
sseRouter.get('/api/events/status', (req: Request, res: Response) => {
  res.json({
    connectedClients: sseManager.getConnectedCount(),
    timestamp: Date.now(),
  });
});

/**
 * Exportar manager para uso em outros módulos
 */
export { sseManager, sseRouter };
