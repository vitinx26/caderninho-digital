/**
 * Função de migração robusta de dados antigos
 * Procura por dados em múltiplas fontes (localStorage, IndexedDB v1, v2, etc)
 */

import { Cliente, Lancamento, Usuario } from '@/types';
import * as db from './db';

export async function migrateAllOldData(): Promise<{
  usuarios: number;
  clientes: number;
  lancamentos: number;
}> {
  let usuariosRecuperados = 0;
  let clientesRecuperados = 0;
  let lancamentosRecuperados = 0;

  try {
    console.log('Iniciando migração de dados antigos...');

    // ============ RECUPERAR USUÁRIOS ============
    console.log('Procurando usuários antigos...');
    
    // Chaves possíveis no localStorage
    const chavasUsuarios = [
      'caderninho_usuarios',
      'usuarios',
      'app_usuarios',
      'caderninho_session',
      'session',
    ];

    for (const chave of chavasUsuarios) {
      const data = localStorage.getItem(chave);
      if (data) {
        try {
          let usuarios: Usuario[] = [];
          const parsed = JSON.parse(data);
          
          // Se for um array, usar diretamente
          if (Array.isArray(parsed)) {
            usuarios = parsed;
          } 
          // Se for um objeto com propriedade usuarios, usar essa
          else if (parsed.usuarios && Array.isArray(parsed.usuarios)) {
            usuarios = parsed.usuarios;
          }
          // Se for um único usuário, converter para array
          else if (parsed.email && parsed.tipo) {
            usuarios = [parsed];
          }

          for (const usuario of usuarios) {
            try {
              const usuarioNormalizado: Usuario = {
                id: usuario.id || Math.random().toString(36).substring(2),
                email: usuario.email,
                nome: usuario.nome,
                tipo: usuario.tipo || 'cliente',
                telefone: usuario.telefone,
                nomeEstabelecimento: usuario.nomeEstabelecimento,
                senha: usuario.senha || 'temp123',
                dataCriacao: usuario.dataCriacao || Date.now(),
              };
              await db.adicionarUsuario(usuarioNormalizado);
              usuariosRecuperados++;
              console.log(`✓ Usuário recuperado: ${usuario.email}`);
            } catch (e) {
              console.warn('Erro ao adicionar usuário:', usuario.email, e);
            }
          }
        } catch (error) {
          console.warn(`Erro ao parsear dados da chave ${chave}:`, error);
        }
      }
    }

    // ============ RECUPERAR CLIENTES ============
    console.log('Procurando clientes antigos...');
    
    const chavasClientes = [
      'caderninho_clientes',
      'clientes',
      'app_clientes',
    ];

    for (const chave of chavasClientes) {
      const data = localStorage.getItem(chave);
      if (data) {
        try {
          let clientes: Cliente[] = [];
          const parsed = JSON.parse(data);
          
          if (Array.isArray(parsed)) {
            clientes = parsed;
          } else if (parsed.clientes && Array.isArray(parsed.clientes)) {
            clientes = parsed.clientes;
          }

          for (const cliente of clientes) {
            try {
              const clienteNormalizado: Cliente = {
                id: cliente.id || Math.random().toString(36).substring(2),
                nome: cliente.nome,
                telefone: cliente.telefone,
                email: cliente.email,

                ativo: cliente.ativo ?? true,
                dataCriacao: cliente.dataCriacao || Date.now(),
              };
              await db.adicionarCliente(clienteNormalizado);
              clientesRecuperados++;
              console.log(`✓ Cliente recuperado: ${cliente.nome}`);
            } catch (e) {
              console.warn('Erro ao adicionar cliente:', cliente.nome, e);
            }
          }
        } catch (error) {
          console.warn(`Erro ao parsear clientes da chave ${chave}:`, error);
        }
      }
    }

    // ============ RECUPERAR LANÇAMENTOS ============
    console.log('Procurando lançamentos antigos...');
    
    const chavasLancamentos = [
      'caderninho_lancamentos',
      'lancamentos',
      'app_lancamentos',
    ];

    for (const chave of chavasLancamentos) {
      const data = localStorage.getItem(chave);
      if (data) {
        try {
          let lancamentos: Lancamento[] = [];
          const parsed = JSON.parse(data);
          
          if (Array.isArray(parsed)) {
            lancamentos = parsed;
          } else if (parsed.lancamentos && Array.isArray(parsed.lancamentos)) {
            lancamentos = parsed.lancamentos;
          }

          for (const lancamento of lancamentos) {
            try {
              const lancamentoNormalizado: Lancamento = {
                id: lancamento.id || Math.random().toString(36).substring(2),
                clienteId: lancamento.clienteId,
                valor: lancamento.valor,
                descricao: lancamento.descricao,
                data: lancamento.data || Date.now(),
                dataCriacao: lancamento.dataCriacao || Date.now(),
                tipo: lancamento.tipo || 'debito',
              };
              await db.adicionarLancamento(lancamentoNormalizado);
              lancamentosRecuperados++;
              console.log(`✓ Lançamento recuperado: ${lancamento.descricao}`);
            } catch (e) {
              console.warn('Erro ao adicionar lançamento:', lancamento.descricao, e);
            }
          }
        } catch (error) {
          console.warn(`Erro ao parsear lançamentos da chave ${chave}:`, error);
        }
      }
    }

    // ============ RECUPERAR DO INDEXEDDB ANTIGO ============
    console.log('Procurando dados no IndexedDB antigo...');
    
    // Tentar abrir banco antigo com versão 1 e 2
    for (const version of [1, 2]) {
      try {
        const oldDb = await new Promise<IDBDatabase | null>((resolve) => {
          const request = indexedDB.open('CaderninhoDigital', version);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
        });

        if (!oldDb) continue;

        // Recuperar usuários do banco antigo
        if (oldDb.objectStoreNames.contains('usuarios')) {
          const usuarios = await new Promise<any[]>((resolve) => {
            const tx = oldDb.transaction(['usuarios'], 'readonly');
            const store = tx.objectStore('usuarios');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve([]);
          });

          for (const usuario of usuarios) {
            try {
              const usuarioNormalizado: Usuario = {
                id: usuario.id || Math.random().toString(36).substring(2),
                email: usuario.email,
                nome: usuario.nome,
                tipo: usuario.tipo || 'cliente',
                telefone: usuario.telefone,
                nomeEstabelecimento: usuario.nomeEstabelecimento,
                senha: usuario.senha || 'temp123',
                dataCriacao: usuario.dataCriacao || Date.now(),
              };
              await db.adicionarUsuario(usuarioNormalizado);
              usuariosRecuperados++;
              console.log(`✓ Usuário recuperado do IndexedDB v${version}: ${usuario.email}`);
            } catch (e) {
              console.warn('Erro ao adicionar usuário do IndexedDB:', usuario.email, e);
            }
          }
        }

        // Recuperar clientes do banco antigo
        if (oldDb.objectStoreNames.contains('clientes')) {
          const clientes = await new Promise<any[]>((resolve) => {
            const tx = oldDb.transaction(['clientes'], 'readonly');
            const store = tx.objectStore('clientes');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve([]);
          });

          for (const cliente of clientes) {
            try {
              const clienteNormalizado: Cliente = {
                id: cliente.id || Math.random().toString(36).substring(2),
                nome: cliente.nome,
                telefone: cliente.telefone,
                email: cliente.email,

                ativo: cliente.ativo ?? true,
                dataCriacao: cliente.dataCriacao || Date.now(),
              };
              await db.adicionarCliente(clienteNormalizado);
              clientesRecuperados++;
              console.log(`✓ Cliente recuperado do IndexedDB v${version}: ${cliente.nome}`);
            } catch (e) {
              console.warn('Erro ao adicionar cliente do IndexedDB:', cliente.nome, e);
            }
          }
        }

        // Recuperar lançamentos do banco antigo
        if (oldDb.objectStoreNames.contains('lancamentos')) {
          const lancamentos = await new Promise<any[]>((resolve) => {
            const tx = oldDb.transaction(['lancamentos'], 'readonly');
            const store = tx.objectStore('lancamentos');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve([]);
          });

          for (const lancamento of lancamentos) {
            try {
              const lancamentoNormalizado: Lancamento = {
                id: lancamento.id || Math.random().toString(36).substring(2),
                clienteId: lancamento.clienteId,
                valor: lancamento.valor,
                descricao: lancamento.descricao,
                data: lancamento.data || Date.now(),
                dataCriacao: lancamento.dataCriacao || Date.now(),
                tipo: lancamento.tipo || 'debito',
              };
              await db.adicionarLancamento(lancamentoNormalizado);
              lancamentosRecuperados++;
              console.log(`✓ Lançamento recuperado do IndexedDB v${version}: ${lancamento.descricao}`);
            } catch (e) {
              console.warn('Erro ao adicionar lançamento do IndexedDB:', lancamento.descricao, e);
            }
          }
        }

        oldDb.close();
      } catch (error) {
        console.warn(`Erro ao acessar IndexedDB versão ${version}:`, error);
      }
    }

    console.log('Migração concluída:', {
      usuarios: usuariosRecuperados,
      clientes: clientesRecuperados,
      lancamentos: lancamentosRecuperados,
    });

    return {
      usuarios: usuariosRecuperados,
      clientes: clientesRecuperados,
      lancamentos: lancamentosRecuperados,
    };
  } catch (error) {
    console.error('Erro durante migração de dados:', error);
    return {
      usuarios: usuariosRecuperados,
      clientes: clientesRecuperados,
      lancamentos: lancamentosRecuperados,
    };
  }
}
