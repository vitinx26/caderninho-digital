/**
 * Serviço de armazenamento IndexedDB
 * Suporta funcionamento offline completo
 */

import { Cliente, Lancamento, ConfiguracaoApp, Usuario } from '@/types';

const DB_NAME = 'CaderninhoDigital';
const DB_VERSION = 2; // Incrementado para forçar recriação do banco

interface DBStores {
  clientes: Cliente;
  lancamentos: Lancamento;
  configuracao: ConfiguracaoApp;
}

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Criar store de clientes
      if (!database.objectStoreNames.contains('clientes')) {
        const clientesStore = database.createObjectStore('clientes', { keyPath: 'id' });
        clientesStore.createIndex('nome', 'nome', { unique: false });
        clientesStore.createIndex('ativo', 'ativo', { unique: false });
      }

      // Criar store de lançamentos
      if (!database.objectStoreNames.contains('lancamentos')) {
        const lancamentosStore = database.createObjectStore('lancamentos', { keyPath: 'id' });
        lancamentosStore.createIndex('clienteId', 'clienteId', { unique: false });
        lancamentosStore.createIndex('data', 'data', { unique: false });
        lancamentosStore.createIndex('tipo', 'tipo', { unique: false });
      }

      // Criar store de configuração
      if (!database.objectStoreNames.contains('configuracao')) {
        database.createObjectStore('configuracao', { keyPath: 'id' });
      }

      // Criar store de usuários
      if (!database.objectStoreNames.contains('usuarios')) {
        const usuariosStore = database.createObjectStore('usuarios', { keyPath: 'id' });
        usuariosStore.createIndex('email', 'email', { unique: true });
        usuariosStore.createIndex('tipo', 'tipo', { unique: false });
      }
    };
  });
}

// ============ CLIENTES ============

export async function adicionarCliente(cliente: Cliente): Promise<string> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clientes'], 'readwrite');
    const store = transaction.objectStore('clientes');
    const request = store.add(cliente);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string);
  });
}

export async function obterClientes(): Promise<Cliente[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clientes'], 'readonly');
    const store = transaction.objectStore('clientes');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function obterClienteAtivo(): Promise<Cliente[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clientes'], 'readonly');
    const store = transaction.objectStore('clientes');
    const index = store.index('ativo');
    const request = index.getAll(IDBKeyRange.only(true));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function obterClientePorId(id: string): Promise<Cliente | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clientes'], 'readonly');
    const store = transaction.objectStore('clientes');
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function atualizarCliente(cliente: Cliente): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clientes'], 'readwrite');
    const store = transaction.objectStore('clientes');
    const request = store.put(cliente);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ============ LANÇAMENTOS ============

export async function adicionarLancamento(lancamento: Lancamento): Promise<string> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['lancamentos'], 'readwrite');
    const store = transaction.objectStore('lancamentos');
    const request = store.add(lancamento);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string);
  });
}

export async function obterLancamentosDoCliente(clienteId: string): Promise<Lancamento[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['lancamentos'], 'readonly');
    const store = transaction.objectStore('lancamentos');
    const index = store.index('clienteId');
    const request = index.getAll(clienteId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function obterTodosLancamentos(): Promise<Lancamento[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['lancamentos'], 'readonly');
    const store = transaction.objectStore('lancamentos');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deletarLancamento(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['lancamentos'], 'readwrite');
    const store = transaction.objectStore('lancamentos');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ============ CONFIGURAÇÃO ============

export async function obterConfiguracao(): Promise<ConfiguracaoApp | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['configuracao'], 'readonly');
    const store = transaction.objectStore('configuracao');
    const request = store.get('app-config');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function salvarConfiguracao(config: ConfiguracaoApp): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['configuracao'], 'readwrite');
    const store = transaction.objectStore('configuracao');
    const request = store.put({ id: 'app-config', ...config });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ============ EXPORT/IMPORT ============

export async function exportarDados(): Promise<string> {
  const clientes = await obterClientes();
  const lancamentos = await obterTodosLancamentos();
  const configuracao = await obterConfiguracao();

  const dados = {
    versao: '1.0',
    dataExportacao: new Date().toISOString(),
    clientes,
    lancamentos,
    configuracao,
  };

  return JSON.stringify(dados, null, 2);
}

export async function importarDados(jsonString: string): Promise<void> {
  try {
    const dados = JSON.parse(jsonString);

    // Limpar dados existentes
    const database = await initDB();
    const transaction = database.transaction(['clientes', 'lancamentos', 'configuracao'], 'readwrite');
    transaction.objectStore('clientes').clear();
    transaction.objectStore('lancamentos').clear();
    transaction.objectStore('configuracao').clear();

    // Importar novos dados
    if (dados.clientes && Array.isArray(dados.clientes)) {
      for (const cliente of dados.clientes) {
        await adicionarCliente(cliente);
      }
    }

    if (dados.lancamentos && Array.isArray(dados.lancamentos)) {
      for (const lancamento of dados.lancamentos) {
        await adicionarLancamento(lancamento);
      }
    }

    if (dados.configuracao) {
      await salvarConfiguracao(dados.configuracao);
    }
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    throw new Error('Falha ao importar dados. Verifique o arquivo.');
  }
}

// ============ USUÁRIOS ============

export async function adicionarUsuario(usuario: Usuario): Promise<Usuario> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['usuarios'], 'readwrite');
    const store = transaction.objectStore('usuarios');
    // Usar put em vez de add para permitir atualização se já existe
    const request = store.put(usuario);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(usuario);
  });
}

export async function obterUsuarioPorEmail(email: string): Promise<Usuario | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['usuarios'], 'readonly');
    const store = transaction.objectStore('usuarios');
    const index = store.index('email');
    const request = index.get(email);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function obterUsuarioPorId(id: string): Promise<Usuario | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['usuarios'], 'readonly');
    const store = transaction.objectStore('usuarios');
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function obterTodosUsuarios(): Promise<Usuario[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['usuarios'], 'readonly');
    const store = transaction.objectStore('usuarios');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}


// ============ RECUPERAÇÃO DE DADOS ANTIGOS ============

export async function recuperarDadosAntigos(): Promise<void> {
  try {
    // Tentar abrir banco antigo com versão 1
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onsuccess = async () => {
      const oldDb = request.result;
      
      // Verificar se há dados no banco antigo
      if (oldDb.objectStoreNames.contains('clientes') && oldDb.objectStoreNames.contains('lancamentos')) {
        const clientesAntigos = await new Promise<any[]>((resolve) => {
          const tx = oldDb.transaction(['clientes'], 'readonly');
          const store = tx.objectStore('clientes');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve([]);
        });

        const lancamentosAntigos = await new Promise<any[]>((resolve) => {
          const tx = oldDb.transaction(['lancamentos'], 'readonly');
          const store = tx.objectStore('lancamentos');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve([]);
        });

        // Migrar dados para o novo banco
        if (clientesAntigos.length > 0 || lancamentosAntigos.length > 0) {
          const newDb = await initDB();
          
          // Adicionar clientes antigos
          for (const cliente of clientesAntigos) {
            await adicionarCliente(cliente);
          }

          // Adicionar lançamentos antigos
          for (const lancamento of lancamentosAntigos) {
            await adicionarLancamento(lancamento);
          }

          console.log('Dados antigos migrados com sucesso');
        }
      }
      
      oldDb.close();
    };

    request.onerror = () => {
      console.log('Nenhum banco antigo encontrado');
    };
  } catch (error) {
    console.error('Erro ao recuperar dados antigos:', error);
  }
}
