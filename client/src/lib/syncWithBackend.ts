/**
 * Sincronização de dados migrados com o backend
 * Envia dados locais para o servidor para persistência permanente
 */

import { Cliente, Lancamento, Usuario } from '@/types';

/**
 * Interface para resposta de sincronização
 */
export interface SyncResponse {
  success: boolean;
  message?: string;
  errors?: string[];
}

/**
 * Sincronizar usuário com o backend
 */
export async function syncUserWithBackend(user: Usuario): Promise<SyncResponse> {
  try {
    const response = await fetch('/api/trpc/sync.users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: [
          {
            id: user.id,
            email: user.email,
            nome: user.nome,
            tipo: user.tipo,
            telefone: user.telefone,
            senha: user.senha,
            dataCriacao: user.dataCriacao,
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Erro ao sincronizar usuário: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Usuário sincronizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
    return {
      success: false,
      message: `Erro ao sincronizar usuário: ${String(error)}`,
    };
  }
}

/**
 * Sincronizar clientes com o backend
 */
export async function syncClientsWithBackend(
  adminId: string,
  clients: Cliente[]
): Promise<SyncResponse> {
  try {
    const response = await fetch('/api/trpc/sync.clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          adminId,
          clients: clients.map(client => ({
            id: client.id,
            adminId,
            nome: client.nome,
            telefone: client.telefone,
            email: client.email,
            ativo: client.ativo,
            dataCriacao: client.dataCriacao,
          })),
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Erro ao sincronizar clientes: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `${clients.length} cliente(s) sincronizado(s) com sucesso`,
    };
  } catch (error) {
    console.error('Erro ao sincronizar clientes:', error);
    return {
      success: false,
      message: `Erro ao sincronizar clientes: ${String(error)}`,
    };
  }
}

/**
 * Sincronizar lançamentos com o backend
 */
export async function syncTransactionsWithBackend(
  adminId: string,
  transactions: Lancamento[]
): Promise<SyncResponse> {
  try {
    const response = await fetch('/api/trpc/sync.transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          adminId,
          transactions: transactions.map(tx => ({
            id: tx.id,
            adminId,
            clienteId: tx.clienteId,
            tipo: tx.tipo,
            valor: tx.valor,
            descricao: tx.descricao,
            data: tx.data,
            dataCriacao: tx.dataCriacao,
          })),
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Erro ao sincronizar lançamentos: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `${transactions.length} lançamento(s) sincronizado(s) com sucesso`,
    };
  } catch (error) {
    console.error('Erro ao sincronizar lançamentos:', error);
    return {
      success: false,
      message: `Erro ao sincronizar lançamentos: ${String(error)}`,
    };
  }
}

/**
 * Sincronizar todos os dados de um admin (migração completa)
 */
export async function syncAllDataWithBackend(
  user: Usuario,
  clients: Cliente[],
  transactions: Lancamento[]
): Promise<SyncResponse> {
  try {
    const response = await fetch('/api/trpc/sync.migrateAll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          user: {
            id: user.id,
            email: user.email,
            nome: user.nome,
            tipo: user.tipo,
            telefone: user.telefone,
            senha: user.senha,
            dataCriacao: user.dataCriacao,
          },
          clients: clients.map(client => ({
            id: client.id,
            adminId: user.id,
            nome: client.nome,
            telefone: client.telefone,
            email: client.email,
            ativo: client.ativo,
            dataCriacao: client.dataCriacao,
          })),
          transactions: transactions.map(tx => ({
            id: tx.id,
            adminId: user.id,
            clienteId: tx.clienteId,
            tipo: tx.tipo,
            valor: tx.valor,
            descricao: tx.descricao,
            data: tx.data,
            dataCriacao: tx.dataCriacao,
          })),
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Erro ao sincronizar dados: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Todos os dados foram sincronizados com sucesso',
    };
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    return {
      success: false,
      message: `Erro ao sincronizar dados: ${String(error)}`,
    };
  }
}

/**
 * Sincronizar com retry automático
 */
export async function syncWithRetry(
  syncFn: () => Promise<SyncResponse>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<SyncResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await syncFn();
      if (result.success) {
        return result;
      }
      lastError = new Error(result.message || 'Erro desconhecido');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Aguardar antes de tentar novamente
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  return {
    success: false,
    message: `Falha após ${maxRetries} tentativas: ${lastError?.message}`,
  };
}
