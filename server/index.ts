import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import notificationRouter from "./notificationRouter";
import syncRouter from "./syncRouter";
import migrateRouter from "./migrateRouter";
import migrateUsersRouter from "./migrateUsersRouter";
import menuRouter from "./menuRouter";
import syncPollingRouter from "./syncPollingRouter";
import backupRouter from "./backupRouter";
import { initializeEmailService } from "./emailService";
import { initializeWebSocket } from "./websocket";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Inicializar WebSocket (desabilitado temporariamente)
  // const io = initializeWebSocket(server);
  // console.log('🔌 WebSocket inicializado com CORS correto');

  // Inicializar serviço de email
  initializeEmailService();

  // Middleware para JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rotas de notificação
  app.use('/api/notificacoes', notificationRouter);
  
  // Rotas de migração
  app.use('/api', migrateRouter);
  app.use('/api', migrateUsersRouter);
  
  // Rotas de sincronização
  app.use('/api', syncRouter);
  app.use('/api/sync', syncPollingRouter);
  
  // Rotas de cardápios
  app.use(menuRouter);
  
  // Rotas de backup
  app.use('/api/backup', backupRouter);

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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
