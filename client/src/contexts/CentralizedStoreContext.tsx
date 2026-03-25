/**
 * CentralizedStoreContext.tsx - Contexto centralizado de estado global
 * 
 * Características:
 * - Estado global sincronizado via WebSocket
 * - Cache em memória apenas (sem localStorage/IndexedDB)
 * - Compartilhado entre todas as páginas
 * - Atualização automática quando dados mudam
 * - Mesma visualização para todos os dispositivos
 */

import React, { createContext, useContext, useCallback } from 'react';
import { useRealtimeData, useRealtimeClientes, useRealtimeLancamentos } from '@/hooks/useRealtimeData';

interface CentralizedStoreContextType {
  // Estado
  usuarios: any[];
  clientes: any[];
  lancamentos: any[];
  configuracoes: any;
  ultimaSincronizacao: number;
  statusConexao: 'conectado' | 'desconectado' | 'sincronizando';
  isConnected: boolean;

  // Operações de clientes
  adicionarCliente: (nome: string, telefone?: string, email?: string) => Promise<void>;
  atualizarCliente: (id: string, dados: any) => Promise<void>;
  deletarCliente: (id: string) => Promise<void>;

  // Operações de transações
  adicionarLancamento: (
    clienteId: string,
    tipo: 'debito' | 'pagamento',
    valor: number,
    descricao: string
  ) => Promise<void>;
  deletarLancamento: (id: string) => Promise<void>;

  // Utilitários
  obterClientePorId: (id: string) => any;
  obterLancamentosDoCliente: (clienteId: string) => any[];
  calcularSaldoCliente: (clienteId: string) => number;
  calcularSaldoTotal: () => number;
}

const CentralizedStoreContext = createContext<CentralizedStoreContextType | undefined>(undefined);

export function CentralizedStoreProvider({ children }: { children: React.ReactNode }) {
  const {
    usuarios,
    clientes,
    lancamentos,
    configuracoes,
    ultimaSincronizacao,
    statusConexao,
    isConnected,
    send,
  } = useRealtimeData();

  const {
    adicionarCliente,
    atualizarCliente,
    deletarCliente,
  } = useRealtimeClientes();

  const {
    adicionarLancamento,
    deletarLancamento,
  } = useRealtimeLancamentos();

  // Utilitários
  const obterClientePorId = useCallback(
    (id: string) => {
      return clientes.find((c) => c.id === id);
    },
    [clientes]
  );

  const obterLancamentosDoCliente = useCallback(
    (clienteId: string) => {
      return lancamentos.filter((l) => l.clienteId === clienteId);
    },
    [lancamentos]
  );

  const calcularSaldoCliente = useCallback(
    (clienteId: string) => {
      const lancamentosCliente = obterLancamentosDoCliente(clienteId);
      return lancamentosCliente.reduce((total, lancamento) => {
        if (lancamento.tipo === 'debito') {
          return total + lancamento.valor;
        } else if (lancamento.tipo === 'pagamento') {
          return total - lancamento.valor;
        }
        return total;
      }, 0);
    },
    [obterLancamentosDoCliente]
  );

  const calcularSaldoTotal = useCallback(() => {
    return clientes.reduce((total, cliente) => {
      return total + calcularSaldoCliente(cliente.id);
    }, 0);
  }, [clientes, calcularSaldoCliente]);

  const value: CentralizedStoreContextType = {
    // Estado
    usuarios,
    clientes,
    lancamentos,
    configuracoes,
    ultimaSincronizacao,
    statusConexao,
    isConnected,

    // Operações de clientes
    adicionarCliente,
    atualizarCliente,
    deletarCliente,

    // Operações de transações
    adicionarLancamento,
    deletarLancamento,

    // Utilitários
    obterClientePorId,
    obterLancamentosDoCliente,
    calcularSaldoCliente,
    calcularSaldoTotal,
  };

  return (
    <CentralizedStoreContext.Provider value={value}>
      {children}
    </CentralizedStoreContext.Provider>
  );
}

export function useCentralizedStore(): CentralizedStoreContextType {
  const context = useContext(CentralizedStoreContext);
  if (!context) {
    throw new Error('useCentralizedStore deve ser usado dentro de CentralizedStoreProvider');
  }
  return context;
}

/**
 * Hook para dados de clientes
 */
export function useClientes() {
  const { clientes, adicionarCliente, atualizarCliente, deletarCliente, isConnected } =
    useCentralizedStore();

  return {
    clientes,
    adicionarCliente,
    atualizarCliente,
    deletarCliente,
    isConnected,
  };
}

/**
 * Hook para dados de transações
 */
export function useLancamentos(clienteId?: string) {
  const { lancamentos, adicionarLancamento, deletarLancamento, isConnected } =
    useCentralizedStore();

  const lancamentosDoCliente = clienteId
    ? lancamentos.filter((l) => l.clienteId === clienteId)
    : lancamentos;

  return {
    lancamentos: lancamentosDoCliente,
    adicionarLancamento,
    deletarLancamento,
    isConnected,
  };
}

/**
 * Hook para status de conexão
 */
export function useConnectionStatus() {
  const { statusConexao, isConnected, ultimaSincronizacao } = useCentralizedStore();

  return {
    statusConexao,
    isConnected,
    ultimaSincronizacao,
  };
}

/**
 * Hook para saldos
 */
export function useSaldos() {
  const { clientes, calcularSaldoCliente, calcularSaldoTotal } = useCentralizedStore();

  const saldosPorCliente = clientes.map((cliente) => ({
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    saldo: calcularSaldoCliente(cliente.id),
  }));

  const saldoTotal = calcularSaldoTotal();

  return {
    saldosPorCliente,
    saldoTotal,
  };
}
