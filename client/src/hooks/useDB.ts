/**
 * Hook customizado para gerenciar dados com IndexedDB
 * Fornece interface reativa para CRUD de clientes e lançamentos
 */

import { useState, useEffect, useCallback } from 'react';
import { Cliente, Lancamento, Saldo } from '@/types';
import * as db from '@/lib/db';
import { nanoid } from 'nanoid';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      const dados = await db.obterClientes();
      // Filtrar apenas clientes ativos e ordenar por nome
      const clientesAtivos = dados.filter((c) => c.ativo !== false);
      clientesAtivos.sort((a, b) => a.nome.localeCompare(b.nome));
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
  }, [carregar]);

  const adicionarCliente = useCallback(async (nome: string, telefone?: string, email?: string) => {
    try {
      const novoCliente: Cliente = {
        id: nanoid(),
        nome,
        telefone,
        email,
        dataCriacao: Date.now(),
        ativo: true, // Sempre garantir que ativo seja true
      };
      const clienteSalvo = await db.adicionarCliente(novoCliente);
      setClientes((prev) => [...prev, clienteSalvo].sort((a, b) => a.nome.localeCompare(b.nome)));
      return clienteSalvo;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar cliente');
      throw e;
    }
  }, []);

  const atualizarCliente = useCallback(async (cliente: Cliente) => {
    try {
      const clienteAtualizado = { ...cliente, ativo: cliente.ativo ?? true };
      await db.atualizarCliente(clienteAtualizado);
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
      let dados: Lancamento[];
      if (clienteId) {
        dados = await db.obterLancamentosDoCliente(clienteId);
      } else {
        dados = await db.obterTodosLancamentos();
      }
      // Ordenar por data (mais recente primeiro)
      dados.sort((a, b) => b.data - a.data);
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
        const novoLancamento: Lancamento = {
          id: nanoid(),
          clienteId,
          tipo,
          valor,
          descricao,
          data,
          dataCriacao: Date.now(),
        };
        await db.adicionarLancamento(novoLancamento);
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
      await db.deletarLancamento(id);
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
