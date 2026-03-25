import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import notificationRouter from "./notificationRouter";
// DESABILITADO: Routers legados que causam conflitos
// import syncRouter from "./syncRouter";
// import migrateRouter from "./migrateRouter";
// import migrateUsersRouter from "./migrateUsersRouter";
// import syncPollingRouter from "./syncPollingRouter";
// import backupRouter from "./backupRouter";
// import multiUserRouter from "./multiUserRouter";
import menuRouter from "./menuRouter";
import { initializeEmailService } from "./emailService";
// DESABILITADO: WebSocket causando problemas
// import { initializeWebSocket } from "./websocket";
// import { initializeRealtimeWebSocket } from "./realtimeEndpoint";
import { sseRouter } from "./sseEndpoint";
import dataRouter from "./dataEndpoints";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // DESABILITADO: WebSocket causando problemas de conexão
  // Usar SSE + Polling em vez disso
  // const io = initializeWebSocket(server);
  // initializeRealtimeWebSocket(server);

  // Inicializar serviço de email
  initializeEmailService();

  // Middleware para JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rotas de notificação
  app.use('/api/notificacoes', notificationRouter);
  
  // DESABILITADO: Routers legados que causam conflitos
  // Usar apenas dataRouter + sseRouter para sincronização
  // app.use('/api', migrateRouter);
  // app.use('/api', migrateUsersRouter);
  // app.use('/api', syncRouter);
  // app.use('/api/sync', syncPollingRouter);
  // app.use('/api/backup', backupRouter);
  // app.use('/api/multiuser', multiUserRouter);
  
  // Rotas de cardápios
  app.use(menuRouter);

  // Rotas de dados para sincronização (ÚNICA fonte de dados)
  app.use('/api', dataRouter);
  console.log('✅ Endpoints de dados inicializados (dataRouter)');

  // Rotas de SSE para sincronização em tempo real (com polling inteligente)
  app.use(sseRouter);
  console.log('✅ SSE endpoint inicializado em /api/events/subscribe');

  // Em desenvolvimento, Vite roda em porta 5173
  // O cliente acessa via http://localhost:3000 e Express faz proxy das APIs
  // Vite serve o frontend via HMR

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes (deve ser a última rota)
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  console.log('\n=== SERVIDOR CONFIGURADO ===');
  console.log('✅ Routers legados desabilitados');
  console.log('✅ Usando apenas: dataRouter + sseRouter');
  console.log('✅ Sincronização: SSE + Polling inteligente');
  console.log('============================\n');

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
