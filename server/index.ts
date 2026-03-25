/**
 * SERVIDOR COM POSTGRESQL
 * Persistência de dados garantida
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// CONEXÃO COM POSTGRESQL
// ============================================================================

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/caderninho',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Listeners SSE
const sseClients = new Set<any>();

// ============================================================================
// INICIALIZAR BANCO DE DADOS
// ============================================================================

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Criar tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        tipo TEXT DEFAULT 'cliente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        telefone TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de lançamentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS lancamentos (
        id TEXT PRIMARY KEY,
        cliente_id TEXT REFERENCES clientes(id),
        tipo TEXT NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        descricao TEXT,
        criado_em BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('✅ Banco de dados inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
  }
}

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

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, nome, tipo } = req.body;
    const id = Date.now().toString();
    
    const result = await pool.query(
      'INSERT INTO users (id, email, nome, tipo) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, email, nome, tipo || 'cliente']
    );
    
    notifySSEClients({ type: 'users:created', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nome, tipo } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET email = $1, nome = $2, tipo = $3 WHERE id = $4 RETURNING *',
      [email, nome, tipo, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    notifySSEClients({ type: 'users:updated', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    notifySSEClients({ type: 'users:deleted', data: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// ============================================================================
// ROTAS: CLIENTES
// ============================================================================

app.get('/api/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;
    const id = Date.now().toString();
    
    const result = await pool.query(
      'INSERT INTO clientes (id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, nome, telefone, email]
    );
    
    notifySSEClients({ type: 'clientes:created', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, email } = req.body;
    
    const result = await pool.query(
      'UPDATE clientes SET nome = $1, telefone = $2, email = $3 WHERE id = $4 RETURNING *',
      [nome, telefone, email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    notifySSEClients({ type: 'clientes:updated', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    notifySSEClients({ type: 'clientes:deleted', data: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

// ============================================================================
// ROTAS: LANÇAMENTOS
// ============================================================================

app.get('/api/lancamentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lancamentos ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar lançamentos' });
  }
});

app.post('/api/lancamentos', async (req, res) => {
  try {
    const { clienteId, tipo, valor, descricao } = req.body;
    const id = Date.now().toString();
    const criadoEm = Date.now();
    
    const result = await pool.query(
      'INSERT INTO lancamentos (id, cliente_id, tipo, valor, descricao, criado_em) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, clienteId, tipo, valor, descricao, criadoEm]
    );
    
    notifySSEClients({ type: 'lancamentos:created', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
    res.status(500).json({ error: 'Erro ao criar lançamento' });
  }
});

app.put('/api/lancamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, valor, descricao } = req.body;
    
    const result = await pool.query(
      'UPDATE lancamentos SET tipo = $1, valor = $2, descricao = $3 WHERE id = $4 RETURNING *',
      [tipo, valor, descricao, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }
    
    notifySSEClients({ type: 'lancamentos:updated', data: result.rows[0] });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar lançamento' });
  }
});

app.delete('/api/lancamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM lancamentos WHERE id = $1', [id]);
    notifySSEClients({ type: 'lancamentos:deleted', data: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar lançamento:', error);
    res.status(500).json({ error: 'Erro ao deletar lançamento' });
  }
});

// ============================================================================
// ROTAS: SINCRONIZAÇÃO
// ============================================================================

app.get('/api/sync/full', async (req, res) => {
  try {
    const users = await pool.query('SELECT * FROM users');
    const clientes = await pool.query('SELECT * FROM clientes');
    const lancamentos = await pool.query('SELECT * FROM lancamentos');
    
    res.json({
      users: users.rows,
      clientes: clientes.rows,
      lancamentos: lancamentos.rows,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    res.status(500).json({ error: 'Erro ao sincronizar' });
  }
});

app.get('/api/events/subscribe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  sseClients.add(res);
  
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ============================================================================
// SERVIR FRONTEND
// ============================================================================

const staticPath = path.resolve(__dirname, '..', 'dist', 'public');
app.use(express.static(staticPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// ============================================================================
// INICIAR
// ============================================================================

const PORT = process.env.PORT || 3000;

async function start() {
  await initializeDatabase();
  
  server.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ SERVIDOR COM POSTGRESQL INICIADO`);
    console.log(`${'='.repeat(60)}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🗄️  Banco: ${process.env.DATABASE_URL || 'localhost:5432'}`);
    console.log(`${'='.repeat(60)}\n`);
  });
}

start().catch(error => {
  console.error('Erro ao iniciar servidor:', error);
  process.exit(1);
});

export default app;
