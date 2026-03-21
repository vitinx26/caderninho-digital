import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import notificationRouter from "./notificationRouter";
import syncRouter from "./syncRouter";
import migrationRouter from "./migrationRouter";
import simpleRouter from "./simpleRouter";
import menuRouter from "./menuRouter";
import { initializeEmailService } from "./emailService";
import { initializeWebSocket } from "./websocket";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Inicializar WebSocket (desabilitado temporariamente para debug)
  // const io = initializeWebSocket(server);
  // console.log('🔌 WebSocket inicializado');

  // Inicializar serviço de email
  initializeEmailService();

  // Middleware para JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rotas de notificação
  app.use('/api/notificacoes', notificationRouter);
  
  // Rotas de migração (DEVE VIR ANTES de syncRouter)
  app.use('/api', migrationRouter);
  
  // Rotas simples de migração (teste)
  app.use('/api', simpleRouter);
  
  // Rotas de sincronização
  app.use('/api', syncRouter);
  
  // Rotas de cardápios
  app.use(menuRouter);

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
