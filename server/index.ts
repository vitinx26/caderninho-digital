/**
 * SERVIDOR COM MYSQL (TiDB Cloud)
 * Adaptado para usar schema EXISTENTE do banco
 * Persistência de dados garantida
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// CONEXÃO COM MYSQL (TiDB Cloud)
// ============================================================================

// Limpar DATABASE_URL removendo parâmetro SSL inválido
const rawDatabaseUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/caderninho';
const cleanDatabaseUrl = rawDatabaseUrl.replace(/\?ssl=.*$/, ''); // Remove ?ssl={...} do final

const pool = mysql.createPool({
  uri: cleanDatabaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  // TiDB Cloud requer SSL obrigatório com certificado válido
  ssl: ({
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  } as any),
} as any);

console.log(`[DB] Conectando a: ${cleanDatabaseUrl.replace(/:[^@]*@/, ':***@')}`);

// Listeners SSE
const sseClients = new Set<any>();

// ============================================================================
// INICIALIZAR BANCO DE DADOS
// ============================================================================

async function initializeDatabase() {
  try {
    console.log('[DB] Tentando conectar ao banco de dados...');
    const connection = await pool.getConnection();
    console.log('[DB] ✅ Conexão estabelecida com sucesso!');
    connection.release();
    console.log('[DB] ✅ Banco de dados pronto (usando schema existente)');
  } catch (error: any) {
    console.error('[DB] ❌ Erro ao inicializar banco:', error?.message || error);
    console.error('[DB] Detalhes:', error);
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
    } catch (error) {
      sseClients.delete(client);
    }
  });
}

// ============================================================================
// ROTA: SSE (Server-Sent Events)
// ============================================================================

app.get('/api/events/subscribe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  sseClients.add(res);
  console.log(`[SSE] Cliente conectado. Total: ${sseClients.size}`);

  // Enviar sincronização completa ao conectar
  const syncEvent = { type: 'sync:full', data: { users: [], clientes: [], lancamentos: [] } };
  res.write(`data: ${JSON.stringify(syncEvent)}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
    console.log(`[SSE] Cliente desconectado. Total: ${sseClients.size}`);
  });
});

// ============================================================================
// ROTAS: USUÁRIOS (tabela 'users')
// ============================================================================

app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM users ORDER BY id DESC LIMIT 1000');
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar usuários:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar usuários', details: error?.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    // Aceitar tanto 'nome' quanto 'name', 'senha' quanto 'password'
    const { name, nome, email, telefone, password, senha, tipo } = req.body;
    const userName = name || nome;
    const userPassword = password || senha;

    if (!userName || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const connection = await pool.getConnection();
    
    // Inserir usuário na tabela 'users'
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, telefone, role) VALUES (?, ?, ?, ?)',
      [userName, email, telefone || null, tipo === 'admin' ? 'admin' : 'user']
    ) as any;

    connection.release();

    const novoUsuario = { 
      id: userResult.insertId,
      name: userName, 
      email: email,
      telefone: telefone,
      role: tipo === 'admin' ? 'admin' : 'user'
    };
    notifySSEClients({ type: 'users:created', data: novoUsuario });

    res.json(novoUsuario);
  } catch (error: any) {
    console.error('[API] Erro ao criar usuário:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar usuário', details: error?.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const connection = await pool.getConnection();
    await connection.execute(
      'UPDATE users SET name = ?, email = ?, telefone = ? WHERE id = ?',
      [nome, email, telefone || null, id]
    );
    connection.release();

    const usuarioAtualizado = { id, nome, email, telefone };
    notifySSEClients({ type: 'users:updated', data: usuarioAtualizado });

    res.json(usuarioAtualizado);
  } catch (error: any) {
    console.error('[API] Erro ao atualizar usuário:', error?.message || error);
    res.status(500).json({ error: 'Erro ao atualizar usuário', details: error?.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    connection.release();

    notifySSEClients({ type: 'users:deleted', data: { id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[API] Erro ao deletar usuário:', error?.message || error);
    res.status(500).json({ error: 'Erro ao deletar usuário', details: error?.message });
  }
});

// ============================================================================
// ROTAS: CLIENTES (tabela 'clientes')
// ============================================================================

app.get('/api/clientes', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id, nome, telefone, email, ativo FROM clientes ORDER BY id DESC LIMIT 1000');
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar clientes:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar clientes', details: error?.message });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome do cliente eh obrigatorio', message: 'Nome do cliente eh obrigatorio' });
    }

    const connection = await pool.getConnection();
    
    // Buscar primeiro estabelecimento (padrão)
    const [estabelecimentos] = await connection.execute(
      'SELECT id FROM estabelecimentos LIMIT 1'
    ) as any;
    
    const estabelecimentoId = estabelecimentos.length > 0 ? estabelecimentos[0].id : 1;
    
    const [result] = await connection.execute(
      'INSERT INTO clientes (estabelecimentoId, nome, telefone, email, ativo) VALUES (?, ?, ?, ?, 1)',
      [estabelecimentoId, nome.trim(), telefone || null, email || null]
    ) as any;

    connection.release();

    const novoCliente = {
      id: result.insertId,
      nome: nome.trim(),
      telefone: telefone || null,
      email: email || null,
      ativo: 1
    };

    res.json(novoCliente);
  } catch (error: any) {
    console.error('[API] Erro ao criar cliente:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar cliente', message: error?.message });
  }
});

// ============================================================================
// ROTAS: LANÇAMENTOS (tabela 'lancamentos')
// ============================================================================

app.get('/api/lancamentos', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Usar campos que existem: id, clienteId, tipo, valor, descricao, data
    const [rows] = await connection.execute('SELECT id, clienteId, tipo, valor, descricao, data FROM lancamentos ORDER BY id DESC LIMIT 1000');
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar lançamentos:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar lançamentos', details: error?.message });
  }
});

app.post('/api/lancamentos', async (req, res) => {
  try {
    const { cliente_id, clienteId, tipo, valor, descricao } = req.body;
    const id_cliente = cliente_id || clienteId;
    const estabelecimentoId = 1; // Usar estabelecimento padrão

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO lancamentos (clienteId, estabelecimentoId, tipo, valor, descricao) VALUES (?, ?, ?, ?, ?)',
      [id_cliente, estabelecimentoId, tipo || 'debito', Math.round(valor * 100), descricao || null]
    ) as any;
    connection.release();

    const novoLancamento = { 
      id: result.insertId,
      clienteId: id_cliente, 
      tipo: tipo || 'debito', 
      valor: valor, 
      descricao: descricao
    };
    notifySSEClients({ type: 'lancamentos:created', data: novoLancamento });

    res.json(novoLancamento);
  } catch (error: any) {
    console.error('[API] Erro ao criar lançamento:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar lançamento', details: error?.message });
  }
});

app.delete('/api/lancamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM lancamentos WHERE id = ?', [id]);
    connection.release();

    notifySSEClients({ type: 'lancamentos:deleted', data: { id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[API] Erro ao deletar lançamento:', error?.message || error);
    res.status(500).json({ error: 'Erro ao deletar lançamento', details: error?.message });
  }
});

// ============================================================================
// ROTAS: CARDÁPIOS (tabela 'menus' com categories JSON)
// ============================================================================

app.get('/api/menus', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Buscar menus ativos
    const [menus] = await connection.execute(
      'SELECT id, name, description, is_active FROM menus WHERE is_active = 1 ORDER BY id DESC LIMIT 100'
    );
    
    // Para cada menu, buscar categorias e itens
    const menusComCategorias = await Promise.all(
      (menus as any[]).map(async (menu) => {
        const [categories] = await connection.execute(
          'SELECT id, name, `order` FROM menu_categories WHERE menu_id = ? ORDER BY `order` ASC',
          [menu.id]
        );
        
        // Para cada categoria, buscar itens
        const categoriesComItens = await Promise.all(
          (categories as any[]).map(async (cat) => {
            const [items] = await connection.execute(
              'SELECT id, name, price FROM menu_items WHERE category_id = ? ORDER BY `order` ASC',
              [cat.id]
            );
            return {
              id: cat.id,
              name: cat.name,
              items: items as any[]
            };
          })
        );
        
        return {
          id: menu.id,
          name: menu.name,
          description: menu.description,
          is_active: menu.is_active,
          categories: categoriesComItens
        };
      })
    );
    
    connection.release();
    res.json({ menus: menusComCategorias });
  } catch (error: any) {
    console.error('[API] Erro ao buscar cardápios:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar cardápios', details: error?.message });
  }
});

app.post('/api/menus', async (req, res) => {
  try {
    const { name, categories } = req.body;
    const id = Date.now().toString();

    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO menus (id, name, categories, is_active) VALUES (?, ?, ?, 1)',
      [id, name, JSON.stringify(categories || [])]
    );
    connection.release();

    const menu = { id, name, categories: categories || [], is_active: 1 };
    notifySSEClients({ type: 'menus:created', data: menu });

    res.json(menu);
  } catch (error: any) {
    console.error('[API] Erro ao criar cardápio:', error?.message || error);
    res.status(500).json({ error: 'Erro ao criar cardápio', details: error?.message });
  }
});

// ============================================================================
// ROTA: ALL-CLIENTS (alias para /api/clientes)
// ============================================================================

app.get('/api/all-clients', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id, nome, telefone, email, ativo FROM clientes ORDER BY id DESC LIMIT 1000');
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error('[API] Erro ao buscar clientes:', error?.message || error);
    res.status(500).json({ error: 'Erro ao buscar clientes', details: error?.message });
  }
});

// ============================================================================
// ROTA: HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// SERVIR FRONTEND ESTÁTICO
// ============================================================================

app.use(express.static(path.join(__dirname, '../dist/public')));

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

async function start() {
  try {
    await initializeDatabase();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log('============================================================');
      console.log('✅ SERVIDOR COM MYSQL + TiDB Cloud INICIADO');
      console.log('============================================================');
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🗄️  Banco: ${cleanDatabaseUrl.replace(/:[^@]*@/, ':***@').substring(0, 80)}...`);
      console.log(`🔒 SSL: Ativado (TiDB Cloud obrigatório)`);
      console.log('============================================================');
    });
  } catch (error: any) {
    console.error('[STARTUP] ❌ Erro ao iniciar servidor:', error?.message || error);
    process.exit(1);
  }
}

start();
