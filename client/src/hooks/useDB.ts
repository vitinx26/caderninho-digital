/**
 * Hook customizado para gerenciar dados do servidor
 * Fornece interface reativa para CRUD de clientes e lançamentos
 * NOTA: Armazenamento local desabilitado - usa apenas servidor
 */

import { useState, useEffect, useCallback } from 'react';
import { Cliente, Lancamento, Saldo } from '@/types';
import { nanoid } from 'nanoid';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Erro ao buscar clientes do servidor');
      }
      const data = await response.json();
      const dados = data.data || [];
      
      // Filtrar apenas clientes ativos e ordenar por nome
      const clientesAtivos = dados.filter((c: any) => c.ativo !== false);
      clientesAtivos.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
      setClientes(clientesAtivos);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar clientes');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, []); // Carregamento único na montagem

  const adicionarCliente = useCallback(async (nome: string, telefone?: string, email?: string) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          telefone,
          email,
          ativo: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar cliente no servidor');
      }

      const novoCliente = await response.json();
      setClientes((prev) => [...prev, novoCliente].sort((a, b) => a.nome.localeCompare(b.nome)));
      return novoCliente;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar cliente');
      throw e;
    }
  }, []);

  const atualizarCliente = useCallback(async (cliente: Cliente) => {
    try {
      const clienteAtualizado = { ...cliente, ativo: cliente.ativo ?? true };
      const response = await fetch(`/api/clients/${cliente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteAtualizado),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar cliente no servidor');
      }

      setClientes((prev) =>
        prev
          .map((c) => (c.id === cliente.id ? clienteAtualizado : c))
          .sort((a, b) => a.nome.localeCompare(b.nome))
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao atualizar cliente');
      throw e;
    }
  }, []);

  const desativarCliente = useCallback(async (id: string) => {
    try {
      const cliente = clientes.find((c) => c.id === id);
      if (cliente) {
        await atualizarCliente({ ...cliente, ativo: false });
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao desativar cliente');
      throw e;
    }
  }, [clientes, atualizarCliente]);

  return {
    clientes,
    carregando,
    erro,
    adicionarCliente,
    atualizarCliente,
    desativarCliente,
    recarregar: carregar,
  };
}

export function useLancamentos(clienteId?: string) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0); // Força recarregamento

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      let url = '/api/transactions';
      if (clienteId) {
        url += `?client_id=${clienteId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erro ao buscar lançamentos do servidor');
      }

      const data = await response.json();
      let dados = data.data || [];

      // Ordenar por data (mais recente primeiro)
      dados.sort((a: any, b: any) => b.data - a.data);
      setLancamentos(dados);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar lançamentos');
    } finally {
      setCarregando(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregar();
  }, [carregar, versao]);

  const adicionarLancamento = useCallback(
    async (
      clienteId: string,
      tipo: 'debito' | 'pagamento',
      valor: number,
      descricao: string,
      data: number = Date.now()
    ) => {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clienteId,
            tipo,
            valor,
            descricao,
            data,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao adicionar lançamento no servidor');
        }

        const novoLancamento = await response.json();
        setLancamentos((prev) => [novoLancamento, ...prev]);
        // Forçar recarregamento para sincronizar com outros hooks
        setVersao((prev) => prev + 1);
        return novoLancamento;
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao adicionar lançamento');
        throw e;
      }
    },
    []
  );

  const deletarLancamento = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar lançamento no servidor');
      }

      setLancamentos((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao deletar lançamento');
      throw e;
    }
  }, []);

  return {
    lancamentos,
    carregando,
    erro,
    adicionarLancamento,
    deletarLancamento,
    recarregar: carregar,
    forcarRecarregamento: () => setVersao((prev) => prev + 1),
  };
}

export function useSaldos(clientes: Cliente[], lancamentos: Lancamento[]) {
  const [saldos, setSaldos] = useState<Map<string, Saldo>>(new Map());

  useEffect(() => {
    const novosSaldos = new Map<string, Saldo>();

    for (const cliente of clientes) {
      const lancamentosCliente = lancamentos.filter((l) => l.clienteId === cliente.id);

      let saldoTotal = 0;
      let ultimoLancamento = cliente.dataCriacao;

      for (const lancamento of lancamentosCliente) {
        if (lancamento.tipo === 'debito') {
          saldoTotal += lancamento.valor;
        } else {
          saldoTotal -= lancamento.valor;
        }
        ultimoLancamento = Math.max(ultimoLancamento, lancamento.data);
      }

      // Determinar status
      let status: 'pago' | 'pendente' | 'vencido' = 'pago';
      if (saldoTotal > 0) {
        // Verificar se está vencido (mais de 30 dias sem pagamento)
        const diasSemPagamento = (Date.now() - ultimoLancamento) / (1000 * 60 * 60 * 24);
        status = diasSemPagamento > 30 ? 'vencido' : 'pendente';
      }

      novosSaldos.set(cliente.id, {
        clienteId: cliente.id,
        nomeCliente: cliente.nome,
        saldoTotal: Math.max(0, saldoTotal), // Nunca negativo
        ultimoLancamento,
        status,
      });
    }

    setSaldos(novosSaldos);
  }, [clientes, lancamentos]);

  return saldos;
}
