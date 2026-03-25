/**
 * Serviço de armazenamento - DESABILITADO
 * Aplicativo usa APENAS servidor como fonte de dados
 * Nenhum armazenamento local (IndexedDB/localStorage) é permitido
 * Exceção: Sessão de autenticação é armazenada em cookies (gerenciado pelo servidor)
 */

import { Cliente, Lancamento, ConfiguracaoApp, Usuario } from '@/types';

/**
 * TODAS AS FUNÇÕES ABAIXO ESTÃO DESABILITADAS
 * O aplicativo deve usar APENAS endpoints do servidor via hooks (useServerClientes, useServerTransactions)
 */

// ============ CLIENTES - DESABILITADO ============

export async function adicionarCliente(cliente: Cliente): Promise<Cliente> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function obterClientes(): Promise<Cliente[]> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function obterClienteAtivo(): Promise<Cliente[]> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function obterClientePorId(id: string): Promise<Cliente | undefined> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function atualizarCliente(cliente: Cliente): Promise<void> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

// ============ LANÇAMENTOS - DESABILITADO ============

export async function adicionarLancamento(lancamento: Lancamento): Promise<string> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function obterLancamentosDoCliente(clienteId: string): Promise<Lancamento[]> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function obterTodosLancamentos(): Promise<Lancamento[]> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function deletarLancamento(id: string): Promise<void> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

// ============ CONFIGURAÇÃO - DESABILITADO ============

export async function obterConfiguracao(): Promise<ConfiguracaoApp | undefined> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function salvarConfiguracao(config: ConfiguracaoApp): Promise<void> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

// ============ EXPORT/IMPORT - DESABILITADO ============

export async function exportarDados(): Promise<string> {
  throw new Error('Armazenamento local desabilitado. Backup local não é permitido.');
}

export async function importarDados(jsonString: string): Promise<void> {
  throw new Error('Armazenamento local desabilitado. Restauração local não é permitida.');
}

// ============ USUÁRIOS - DESABILITADO ============

export async function adicionarUsuario(usuario: Usuario): Promise<Usuario> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function obterUsuarioPorEmail(email: string): Promise<Usuario | undefined> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function obterUsuarioPorId(id: string): Promise<Usuario | undefined> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function obterTodosUsuarios(): Promise<Usuario[]> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

export async function atualizarUsuario(usuario: Partial<Usuario> & { id: string }): Promise<void> {
  throw new Error('Armazenamento local desabilitado. Use servidor via API.');
}

// ============ RECUPERAÇÃO DE DADOS ANTIGOS - DESABILITADO ============

export async function recuperarDadosAntigos(): Promise<void> {
  // Função desabilitada - nenhuma recuperação de dados locais é permitida
  console.warn('Recuperação de dados locais desabilitada. Aplicativo usa APENAS servidor.');
}
