/**
 * migrationToServer.ts - Migração de dados de localStorage para servidor SQLite centralizado
 * 
 * Este módulo recupera dados de localStorage e envia para o servidor
 * para sincronização centralizada com todos os admins
 */

import * as db from './db';
import { UsuarioLogado } from '@/types';

/**
 * Recuperar dados de localStorage e migrar para servidor
 */
export async function migrarDadosParaServidor(usuario: UsuarioLogado) {
  try {
    console.log('🚀 Iniciando migração de dados para servidor...');
    
    // 1. Recuperar dados de localStorage
    const clientesLocalStorage = localStorage.getItem('caderninho_clientes');
    const lancamentosLocalStorage = localStorage.getItem('caderninho_lancamentos');
    
    const clientes = clientesLocalStorage ? JSON.parse(clientesLocalStorage) : [];
    const lancamentos = lancamentosLocalStorage ? JSON.parse(lancamentosLocalStorage) : [];
    
    console.log(`📊 Dados encontrados: ${clientes.length} clientes, ${lancamentos.length} lançamentos`);
    
    // 2. Recuperar dados de IndexedDB
    const clientesIndexedDB = await db.obterClientes();
    const lancamentosIndexedDB = await db.obterTodosLancamentos();
    
    console.log(`📊 IndexedDB: ${clientesIndexedDB.length} clientes, ${lancamentosIndexedDB.length} lançamentos`);
    
    // 3. Mesclar dados (remover duplicatas)
    const clientesMapa = new Map();
    
    // Adicionar clientes de localStorage
    clientes.forEach((c: any) => {
      if (!clientesMapa.has(c.id)) {
        clientesMapa.set(c.id, c);
      }
    });
    
    // Adicionar clientes de IndexedDB
    clientesIndexedDB.forEach((c: any) => {
      if (!clientesMapa.has(c.id)) {
        clientesMapa.set(c.id, c);
      }
    });
    
    const clientesMerged = Array.from(clientesMapa.values());
    
    // 4. Preparar dados para envio
    const dadosParaMigrar = {
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        tipo: usuario.tipo,
        telefone: usuario.telefone,
        nomeEstabelecimento: usuario.nomeEstabelecimento,
      },
      clientes: clientesMerged.map((c: any) => ({
        id: c.id,
        adminId: usuario.id,
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        ativo: c.ativo !== false, // Garantir booleano
        dataCriacao: c.dataCriacao || Date.now(),
        dataAtualizacao: c.dataAtualizacao || Date.now(),
      })),
      lancamentos: lancamentos.map((l: any) => ({
        id: l.id,
        adminId: usuario.id,
        clienteId: l.clienteId,
        tipo: l.tipo,
        valor: l.valor,
        descricao: l.descricao,
        data: l.data || Date.now(),
        dataCriacao: l.dataCriacao || Date.now(),
        dataAtualizacao: l.dataAtualizacao || Date.now(),
      })),
    };
    
    console.log(`📤 Enviando ${dadosParaMigrar.clientes.length} clientes e ${dadosParaMigrar.lancamentos.length} lançamentos...`);
    
    // 5. Enviar para servidor
    const response = await fetch('/api/sync/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosParaMigrar),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao migrar: ${response.statusText}`);
    }
    
    const resultado = await response.json();
    console.log('✅ Migração concluída:', resultado);
    
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao migrar dados:', error);
    throw error;
  }
}

/**
 * Sincronizar dados do servidor para localStorage
 */
export async function sincronizarDoServidor(usuario: UsuarioLogado) {
  try {
    console.log('🔄 Sincronizando dados do servidor...');
    
    // 1. Buscar TODOS os clientes do servidor
    const clientesResponse = await fetch('/api/all-clients');
    if (!clientesResponse.ok) {
      throw new Error(`Erro ao buscar clientes: ${clientesResponse.statusText}`);
    }
    
    const clientesData = await clientesResponse.json();
    const clientes = clientesData.data || [];
    
    console.log(`📥 Recebidos ${clientes.length} clientes do servidor`);
    
    // 2. Buscar transações do admin
    const transacoesResponse = await fetch(`/api/transactions?adminId=${usuario.id}`);
    if (!transacoesResponse.ok) {
      throw new Error(`Erro ao buscar transações: ${transacoesResponse.statusText}`);
    }
    
    const transacoesData = await transacoesResponse.json();
    const transacoes = transacoesData.data || [];
    
    console.log(`📥 Recebidas ${transacoes.length} transações do servidor`);
    
    // 3. Salvar clientes em localStorage
    localStorage.setItem('caderninho_clientes', JSON.stringify(clientes));
    
    // 4. Salvar clientes em IndexedDB
    for (const cliente of clientes) {
      await db.adicionarCliente({
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        ativo: cliente.ativo,
        dataCriacao: cliente.dataCriacao || Date.now(),
      });
    }
    
    // 5. Salvar transações em localStorage
    localStorage.setItem('caderninho_lancamentos', JSON.stringify(transacoes));
    
    // 6. Salvar transações em IndexedDB
    for (const transacao of transacoes) {
      await db.adicionarLancamento({
        id: transacao.id,
        clienteId: transacao.clienteId,
        tipo: transacao.tipo,
        valor: transacao.valor,
        descricao: transacao.descricao,
        data: transacao.data,
        dataCriacao: transacao.dataCriacao || Date.now(),
      });
    }
    
    console.log('✅ Sincronização concluída');
    
    return {
      clientesCount: clientes.length,
      transacoesCount: transacoes.length,
    };
  } catch (error) {
    console.error('❌ Erro ao sincronizar do servidor:', error);
    throw error;
  }
}
