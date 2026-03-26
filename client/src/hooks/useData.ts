/**
 * useData.ts - Hook simples com React Query para sincronizar dados
 * 
 * Substitui useRealtimeSSE (SSE + Polling complexo)
 * Usa React Query para:
 * - Caching automático
 * - Retry automático
 * - Sincronização simples
 * - Sem timeouts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// TIPOS
// ============================================================================

export interface Usuario {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  ativo?: number;
}

export interface Lancamento {
  id: number;
  clienteId: number;
  tipo: 'debito' | 'pagamento';
  valor: number;
  descricao?: string;
  data?: string;
}

export interface Menu {
  id: string;
  name: string;
  categories: any[];
  is_active: number;
}

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

const getApiUrl = (path: string) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}${path}`;
};

async function fetchUsuarios(): Promise<Usuario[]> {
  const res = await fetch(getApiUrl('/api/users'));
  if (!res.ok) throw new Error('Erro ao buscar usuários');
  return res.json();
}

async function fetchClientes(): Promise<Cliente[]> {
  const res = await fetch(getApiUrl('/api/all-clients'));
  if (!res.ok) throw new Error('Erro ao buscar clientes');
  return res.json();
}

async function fetchLancamentos(): Promise<Lancamento[]> {
  const res = await fetch(getApiUrl('/api/lancamentos'));
  if (!res.ok) throw new Error('Erro ao buscar lançamentos');
  return res.json();
}

async function fetchMenus(): Promise<Menu[]> {
  const res = await fetch(getApiUrl('/api/menus'));
  if (!res.ok) throw new Error('Erro ao buscar cardápios');
  const data = await res.json();
  return data.menus || [];
}

// ============================================================================
// HOOKS PARA CONSULTAS
// ============================================================================

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: fetchUsuarios,
    staleTime: 5000, // Cache válido por 5s
    retry: 2,
    refetchInterval: 10000, // Refetch a cada 10s
  });
}

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: fetchClientes,
    staleTime: 5000,
    retry: 2,
    refetchInterval: 10000,
  });
}

export function useLancamentos() {
  return useQuery({
    queryKey: ['lancamentos'],
    queryFn: fetchLancamentos,
    staleTime: 5000,
    retry: 2,
    refetchInterval: 10000,
  });
}

export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: fetchMenus,
    staleTime: 30000, // Cache válido por 30s (cardápio muda menos)
    retry: 2,
    refetchInterval: 60000, // Refetch a cada 60s
  });
}

// ============================================================================
// HOOKS PARA MUTAÇÕES
// ============================================================================

export function useAdicionarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: { nome: string; telefone?: string; email?: string }) => {
      const res = await fetch(getApiUrl('/api/clientes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error('Erro ao adicionar cliente');
      return res.json();
    },
    onSuccess: () => {
      // Invalidar cache para refetch automático
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useAdicionarLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: {
      cliente_id?: number;
      clienteId?: number;
      tipo: 'debito' | 'pagamento';
      valor: number;
      descricao?: string;
    }) => {
      const res = await fetch(getApiUrl('/api/lancamentos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error('Erro ao adicionar lançamento');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    },
  });
}

export function useDeletarLancamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(getApiUrl(`/api/lancamentos/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao deletar lançamento');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    },
  });
}

// ============================================================================
// HOOK COMBINADO (para compatibilidade com código antigo)
// ============================================================================

export function useAllData() {
  const usuariosQuery = useUsuarios();
  const clientesQuery = useClientes();
  const lancamentosQuery = useLancamentos();
  const menusQuery = useMenus();

  const isLoading =
    usuariosQuery.isLoading ||
    clientesQuery.isLoading ||
    lancamentosQuery.isLoading ||
    menusQuery.isLoading;

  const isError =
    usuariosQuery.isError ||
    clientesQuery.isError ||
    lancamentosQuery.isError ||
    menusQuery.isError;

  return {
    usuarios: usuariosQuery.data || [],
    clientes: clientesQuery.data || [],
    lancamentos: lancamentosQuery.data || [],
    menus: menusQuery.data || [],
    isLoading,
    isError,
    isConnected: !isError,
  };
}
