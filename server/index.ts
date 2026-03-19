import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import notificationRouter from "./notificationRouter";
import syncRouter from "./syncRouter";
import migrationRouter from "./migrationRouter";
import { initializeEmailService } from "./emailService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Inicializar serviço de email
  initializeEmailService();

  // Middleware para JSON
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rotas de notificação
  app.use('/api/notificacoes', notificationRouter);
  
  // Rotas de sincronização
  app.use('/api', syncRouter);
  
  // Rotas de migração
  app.use('/api/sync', migrationRouter);

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
