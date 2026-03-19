/**
 * serverSync.ts - Sistema de sincronização centralizada com servidor
 * 
 * Responsável por:
 * 1. Carregar dados do servidor
 * 2. Sincronizar dados locais para o servidor
 * 3. Sincronizar dados do servidor para o local
 * 4. Manter consistência entre todos os usuários
 */

import * as db from './db';
import { UsuarioLogado } from '@/types';

/**
 * Sincronizar todos os dados de um admin para o servidor
 */
export async function sincronizarDadosParaServidor(usuario: UsuarioLogado) {
  try {
    console.log('🔄 Iniciando sincronização para servidor...');
    
    // 1. Obter dados locais
    const clientesLocais = await db.obterClientes();
    const lancamentosLocais = await db.obterTodosLancamentos();
    
    // 2. Preparar dados para sincronização
    const dadosParaSincronizar = {
      user: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        tipo: usuario.tipo,
        telefone: usuario.telefone,
        nomeEstabelecimento: usuario.nomeEstabelecimento,
        senha: 'hashed', // Não enviar senha real
        dataCriacao: Date.now(),
      },
      clients: clientesLocais.map((c: any) => ({
        id: c.id,
        adminId: usuario.id,
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        ativo: c.ativo,
        dataCriacao: c.dataCriacao,
      })),
      transactions: lancamentosLocais.map((l: any) => ({
        id: l.id,
        adminId: usuario.id,
        clienteId: l.clienteId,
        tipo: l.tipo,
        valor: l.valor,
        descricao: l.descricao,
        data: l.data,
        dataCriacao: l.dataCriacao,
      })),
    };
    
    // 3. Enviar para servidor (usando fetch direto pois é migração)
    const response = await fetch('/api/sync/migrateAll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosParaSincronizar),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao sincronizar: ${response.statusText}`);
    }
    
    const resultado = await response.json();
    console.log('✅ Sincronização para servidor concluída:', resultado);
    
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao sincronizar para servidor:', error);
    throw error;
  }
}

/**
 * Carregar dados do servidor e atualizar local
 */
export async function carregarDadosDoServidor(usuario: UsuarioLogado) {
  try {
    console.log('🔄 Carregando dados do servidor...');
    
    // 1. Buscar usuários do servidor
    const usuariosResponse = await fetch('/api/users');
    if (!usuariosResponse.ok) throw new Error('Erro ao buscar usuários');
    const usuarios = await usuariosResponse.json();
    
    // 2. Buscar clientes do servidor
    const clientesResponse = await fetch(`/api/clients?adminId=${usuario.id}`);
    if (!clientesResponse.ok) throw new Error('Erro ao buscar clientes');
    const clientes = await clientesResponse.json();
    
    // 3. Buscar transações do servidor
    const transacoesResponse = await fetch(`/api/transactions?adminId=${usuario.id}`);
    if (!transacoesResponse.ok) throw new Error('Erro ao buscar transações');
    const transacoes = await transacoesResponse.json();
    
    // 4. Atualizar dados locais
    for (const cliente of clientes) {
      await db.adicionarCliente(cliente);
    }
    for (const transacao of transacoes) {
      await db.adicionarLancamento(transacao);
    }
    
    console.log('✅ Dados carregados do servidor com sucesso');
    
    return { usuarios, clientes, transacoes };
  } catch (error) {
    console.error('❌ Erro ao carregar dados do servidor:', error);
    throw error;
  }
}

/**
 * Sincronizar bidirecionalmente (local ↔ servidor)
 */
export async function sincronizarBidirecional(usuario: UsuarioLogado) {
  try {
    console.log('🔄 Iniciando sincronização bidirecional...');
    
    // 1. Enviar dados locais para servidor
    await sincronizarDadosParaServidor(usuario);
    
    // 2. Carregar dados atualizados do servidor
    await carregarDadosDoServidor(usuario);
    
    console.log('✅ Sincronização bidirecional concluída');
  } catch (error) {
    console.error('❌ Erro na sincronização bidirecional:', error);
    throw error;
  }
}

/**
 * Monitorar mudanças e sincronizar periodicamente
 */
export function iniciarSincronizacaoPeriodica(usuario: UsuarioLogado, intervaloMs: number = 30000) {
  console.log(`⏱️ Iniciando sincronização periódica a cada ${intervaloMs}ms`);
  
  const intervaloId = setInterval(async () => {
    try {
      await sincronizarBidirecional(usuario);
    } catch (error) {
      console.error('Erro na sincronização periódica:', error);
    }
  }, intervaloMs);
  
  // Retornar função para cancelar
  return () => {
    clearInterval(intervaloId);
    console.log('Sincronização periódica cancelada');
  };
}

/**
 * Detectar quando volta online e sincronizar
 */
export function monitorarConexao(usuario: UsuarioLogado) {
  const handleOnline = async () => {
    console.log('📡 Conexão restaurada, sincronizando...');
    try {
      await sincronizarBidirecional(usuario);
    } catch (error) {
      console.error('Erro ao sincronizar após volta online:', error);
    }
  };
  
  window.addEventListener('online', handleOnline);
  
  // Retornar função para remover listener
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
