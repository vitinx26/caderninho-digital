/**
 * SERVIDOR CENTRALIZADO - Caderninho Digital
 * 
 * Arquitetura:
 * - Frontend (React) + Backend (Express) + DB (SQLite) integrados
 * - Uma única base de dados para todos
 * - Sincronização em tempo real via SSE + Polling
 * - Sem problemas de proxy/CORS
 */

import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

const app: Express = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session
app.use(session({
  secret: process.env.JWT_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  },
}));

// ============================================================================
// TIPOS
// ============================================================================

interface User {
  id: string;
  email: string;
  senha?: string;
  nome: string;
  tipo: 'admin' | 'cliente';
}

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  usuarioId?: string;
}

interface Lancamento {
  id: string;
  clienteId: string;
  usuarioId?: string;
  tipo: 'debito' | 'pagamento' | 'compra';
  valor: number;
  descricao?: string;
  criadoEm: number;
}

// ============================================================================
// ESTADO EM MEMÓRIA (Simulando banco de dados)
// ============================================================================

let users: User[] = [];
let clientes: Cliente[] = [];
let lancamentos: Lancamento[] = [];
let cardapios: any[] = [];

// Listeners para SSE
const sseClients = new Set<Response>();

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================================

function requireAuth(req: any, res: Response, next: Function) {
  const user = req.session?.user;
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  req.user = user;
  next();
}

function requireAdmin(req: any, res: Response, next: Function) {
  const user = req.session?.user;
  if (!user || user.tipo !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  req.user = user;
  next();
}

// ============================================================================
// FUNÇÃO PARA NOTIFICAR CLIENTES SSE
// ============================================================================

function notifySSEClients(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    client.write(message);
  });
}

// ============================================================================
// ROTAS: AUTENTICAÇÃO
// ============================================================================

app.post('/api/auth/login', (req: any, res: Response) => {
  const { email, senha } = req.body;
  
  // Buscar usuário
  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  // Salvar na sessão
  req.session.user = user;
  res.json({ user });
});

app.post('/api/auth/logout', (req: any, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/auth/me', (req: any, res: Response) => {
  const user = req.session?.user;
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  res.json({ user });
});

// ============================================================================
// ROTAS: USUÁRIOS
// ============================================================================

app.get('/api/users', (req: Request, res: Response) => {
  res.json(users);
});

app.post('/api/users', requireAdmin, (req: Request, res: Response) => {
  const { email, senha, nome, telefone, tipo } = req.body;
  
  const newUser: User = {
    id: Date.now().toString(),
    email,
    nome,
    tipo: tipo || 'cliente',
  };
  
  users.push(newUser);
  notifySSEClients({ type: 'users:created', data: newUser });
  res.json(newUser);
});

app.put('/api/users/:id', requireAdmin, (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  Object.assign(user, req.body);
  notifySSEClients({ type: 'users:updated', data: user });
  res.json(user);
});

app.delete('/api/users/:id', requireAdmin, (req: Request, res: Response) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  const [deleted] = users.splice(index, 1);
  notifySSEClients({ type: 'users:deleted', data: deleted });
  res.json(deleted);
});

// ============================================================================
// ROTAS: CLIENTES
// ============================================================================

app.get('/api/clientes', (req: Request, res: Response) => {
  res.json(clientes);
});

app.post('/api/clientes', (req: Request, res: Response) => {
  const { nome, telefone, email } = req.body;
  
  const newCliente: Cliente = {
    id: Date.now().toString(),
    nome,
    telefone,
    email,
  };
  
  clientes.push(newCliente);
  notifySSEClients({ type: 'clientes:created', data: newCliente });
  res.json(newCliente);
});

app.put('/api/clientes/:id', (req: Request, res: Response) => {
  const cliente = clientes.find(c => c.id === req.params.id);
  if (!cliente) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }
  
  Object.assign(cliente, req.body);
  notifySSEClients({ type: 'clientes:updated', data: cliente });
  res.json(cliente);
});

app.delete('/api/clientes/:id', requireAdmin, (req: Request, res: Response) => {
  const index = clientes.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }
  
  const [deleted] = clientes.splice(index, 1);
  notifySSEClients({ type: 'clientes:deleted', data: deleted });
  res.json(deleted);
});

// ============================================================================
// ROTAS: LANÇAMENTOS
// ============================================================================

app.get('/api/lancamentos', (req: Request, res: Response) => {
  res.json(lancamentos);
});

app.post('/api/lancamentos', (req: Request, res: Response) => {
  const { clienteId, tipo, valor, descricao } = req.body;
  
  const newLancamento: Lancamento = {
    id: Date.now().toString(),
    clienteId,
    tipo,
    valor,
    descricao,
    criadoEm: Date.now(),
  };
  
  lancamentos.push(newLancamento);
  notifySSEClients({ type: 'lancamentos:created', data: newLancamento });
  res.json(newLancamento);
});

app.delete('/api/lancamentos/:id', requireAdmin, (req: Request, res: Response) => {
  const index = lancamentos.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lançamento não encontrado' });
  }
  
  const [deleted] = lancamentos.splice(index, 1);
  notifySSEClients({ type: 'lancamentos:deleted', data: deleted });
  res.json(deleted);
});

// ============================================================================
// ROTAS: SINCRONIZAÇÃO
// ============================================================================

app.get('/api/sync/full', (req: Request, res: Response) => {
  res.json({
    users,
    clientes,
    lancamentos,
    cardapios,
    timestamp: Date.now(),
  });
});

app.get('/api/events/subscribe', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  sseClients.add(res);
  
  // Enviar sincronização completa ao conectar
  const syncData = {
    type: 'sync:full',
    data: { users, clientes, lancamentos, cardapios },
  };
  res.write(`data: ${JSON.stringify(syncData)}\n\n`);
  
  // Remover ao desconectar
  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ============================================================================
// SERVIR FRONTEND ESTÁTICO
// ============================================================================

const staticPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(staticPath));

// SPA fallback
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ SERVIDOR CENTRALIZADO INICIADO`);
  console.log(`${'='.repeat(60)}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Usuários: ${users.length}`);
  console.log(`👥 Clientes: ${clientes.length}`);
  console.log(`📝 Lançamentos: ${lancamentos.length}`);
  console.log(`${'='.repeat(60)}\n`);
});

export default app;
