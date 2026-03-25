/**
 * SERVIDOR CENTRALIZADO SIMPLIFICADO
 * Arquitetura limpa sem complexidades
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// DADOS EM MEMÓRIA
// ============================================================================

interface User {
  id: string;
  email: string;
  nome: string;
  tipo: 'admin' | 'cliente';
}

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
}

interface Lancamento {
  id: string;
  clienteId: string;
  tipo: 'debito' | 'pagamento';
  valor: number;
  descricao?: string;
  criadoEm: number;
}

let users: User[] = [
  { id: '1', email: 'admin@test.com', nome: 'Admin', tipo: 'admin' },
];

let clientes: Cliente[] = [];
let lancamentos: Lancamento[] = [];

// Listeners SSE
const sseClients = new Set<any>();

// ============================================================================
// FUNÇÃO PARA NOTIFICAR CLIENTES SSE
// ============================================================================

function notifySSEClients(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  });
}

// ============================================================================
// ROTAS: USUÁRIOS
// ============================================================================

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { email, nome, tipo } = req.body;
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

app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Não encontrado' });
  Object.assign(user, req.body);
  notifySSEClients({ type: 'users:updated', data: user });
  res.json(user);
});

app.delete('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Não encontrado' });
  const [deleted] = users.splice(idx, 1);
  notifySSEClients({ type: 'users:deleted', data: deleted });
  res.json(deleted);
});

// ============================================================================
// ROTAS: CLIENTES
// ============================================================================

app.get('/api/clientes', (req, res) => {
  res.json(clientes);
});

app.post('/api/clientes', (req, res) => {
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

app.put('/api/clientes/:id', (req, res) => {
  const cliente = clientes.find(c => c.id === req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Não encontrado' });
  Object.assign(cliente, req.body);
  notifySSEClients({ type: 'clientes:updated', data: cliente });
  res.json(cliente);
});

app.delete('/api/clientes/:id', (req, res) => {
  const idx = clientes.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Não encontrado' });
  const [deleted] = clientes.splice(idx, 1);
  notifySSEClients({ type: 'clientes:deleted', data: deleted });
  res.json(deleted);
});

// ============================================================================
// ROTAS: LANÇAMENTOS
// ============================================================================

app.get('/api/lancamentos', (req, res) => {
  res.json(lancamentos);
});

app.post('/api/lancamentos', (req, res) => {
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

app.delete('/api/lancamentos/:id', (req, res) => {
  const idx = lancamentos.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Não encontrado' });
  const [deleted] = lancamentos.splice(idx, 1);
  notifySSEClients({ type: 'lancamentos:deleted', data: deleted });
  res.json(deleted);
});

// ============================================================================
// ROTAS: SINCRONIZAÇÃO
// ============================================================================

app.get('/api/sync/full', (req, res) => {
  res.json({
    users,
    clientes,
    lancamentos,
    timestamp: Date.now(),
  });
});

app.get('/api/events/subscribe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  sseClients.add(res);

  // Enviar sincronização completa ao conectar
  res.write(`data: ${JSON.stringify({
    type: 'sync:full',
    data: { users, clientes, lancamentos },
  })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ============================================================================
// SERVIR FRONTEND
// ============================================================================

const staticPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(staticPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// ============================================================================
// INICIAR
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
