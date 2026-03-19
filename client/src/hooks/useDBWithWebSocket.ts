/**
 * useDBWithWebSocket.ts - Hook que integra WebSocket com operações de banco de dados
 * 
 * Emite eventos WebSocket quando clientes/lançamentos são criados/atualizados
 * Sincroniza dados em tempo real entre múltiplos admins
 */

import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from './useWebSocket';
import { useClientes, useLancamentos } from './useDB';
import * as db from '@/lib/db';

export function useDBWithWebSocket() {
  const { usuarioLogado } = useAuth();
  const {
    clientes,
    adicionarCliente: addClienteDB,
    atualizarCliente: updateClienteDB,
    desativarCliente: deactivateClienteDB,
    recarregar: recarregarClientes,
  } = useClientes();

  const {
    lancamentos,
    adicionarLancamento: addLancamentoDB,
    recarregar: recarregarLancamentos,
  } = useLancamentos();

  const { emitClientCreated, emitClientUpdated, emitTransactionCreated } = useWebSocket(usuarioLogado);

  /**
   * Adicionar cliente e emitir evento WebSocket
   */
  const adicionarCliente = useCallback(
    async (nome: string, telefone?: string, email?: string) => {
      try {
        const novoCliente = await addClienteDB(nome, telefone, email);

        // Emitir evento WebSocket
        emitClientCreated({
          id: novoCliente.id,
          nome: novoCliente.nome,
          telefone: novoCliente.telefone,
          email: novoCliente.email,
          ativo: novoCliente.ativo,
          dataCriacao: novoCliente.dataCriacao,
        });

        return novoCliente;
      } catch (error) {
        console.error('Erro ao adicionar cliente:', error);
        throw error;
      }
    },
    [addClienteDB, emitClientCreated]
  );

  /**
   * Atualizar cliente e emitir evento WebSocket
   */
  const atualizarCliente = useCallback(
    async (cliente: any) => {
      try {
        await updateClienteDB(cliente);

        // Emitir evento WebSocket
        emitClientUpdated({
          id: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email,
          ativo: cliente.ativo,
        });
      } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        throw error;
      }
    },
    [updateClienteDB, emitClientUpdated]
  );

  /**
   * Desativar cliente e emitir evento WebSocket
   */
  const desativarCliente = useCallback(
    async (id: string) => {
      try {
        await deactivateClienteDB(id);

        const cliente = clientes.find(c => c.id === id);
        if (cliente) {
          emitClientUpdated({
            id: cliente.id,
            nome: cliente.nome,
            telefone: cliente.telefone,
            email: cliente.email,
            ativo: false,
          });
        }
      } catch (error) {
        console.error('Erro ao desativar cliente:', error);
        throw error;
      }
    },
    [deactivateClienteDB, emitClientUpdated, clientes]
  );

  /**
   * Adicionar lançamento e emitir evento WebSocket
   */
  const adicionarLancamento = useCallback(
    async (
      clienteId: string,
      tipo: 'debito' | 'pagamento',
      valor: number,
      descricao: string,
      data?: number
    ) => {
      try {
        const novoLancamento = await addLancamentoDB(clienteId, tipo, valor, descricao, data);

        // Emitir evento WebSocket
        emitTransactionCreated({
          id: novoLancamento.id,
          clienteId: novoLancamento.clienteId,
          tipo: novoLancamento.tipo,
          valor: novoLancamento.valor,
          descricao: novoLancamento.descricao,
          data: novoLancamento.data,
          dataCriacao: novoLancamento.dataCriacao,
        });

        return novoLancamento;
      } catch (error) {
        console.error('Erro ao adicionar lançamento:', error);
        throw error;
      }
    },
    [addLancamentoDB, emitTransactionCreated]
  );

  /**
   * Sincronizar dados quando eventos WebSocket são recebidos
   */
  useEffect(() => {
    const handleClientCreated = (event: CustomEvent) => {
      console.log('📥 Sincronizando cliente criado:', event.detail);
      recarregarClientes();
    };

    const handleClientUpdated = (event: CustomEvent) => {
      console.log('📥 Sincronizando cliente atualizado:', event.detail);
      recarregarClientes();
    };

    const handleTransactionCreated = (event: CustomEvent) => {
      console.log('📥 Sincronizando lançamento criado:', event.detail);
      recarregarLancamentos();
    };

    const handleSyncQueue = (event: CustomEvent) => {
      console.log('📥 Sincronizando fila de eventos:', event.detail);
      recarregarClientes();
      recarregarLancamentos();
    };

    window.addEventListener('websocket:client-created', handleClientCreated as EventListener);
    window.addEventListener('websocket:client-updated', handleClientUpdated as EventListener);
    window.addEventListener('websocket:transaction-created', handleTransactionCreated as EventListener);
    window.addEventListener('websocket:sync-queue', handleSyncQueue as EventListener);

    return () => {
      window.removeEventListener('websocket:client-created', handleClientCreated as EventListener);
      window.removeEventListener('websocket:client-updated', handleClientUpdated as EventListener);
      window.removeEventListener('websocket:transaction-created', handleTransactionCreated as EventListener);
      window.removeEventListener('websocket:sync-queue', handleSyncQueue as EventListener);
    };
  }, [recarregarClientes, recarregarLancamentos]);

  return {
    clientes,
    lancamentos,
    adicionarCliente,
    atualizarCliente,
    desativarCliente,
    adicionarLancamento,
  };
}
