/**
 * Dashboard - Tela inicial do Caderninho Digital
 * Mostra resumo de saldo e lista de devedores
 * Design: Minimalismo Funcional com Tipografia Forte
 * 
 * ✅ MIGRADO PARA: CentralizedStoreContext
 * - Sincronização em tempo real via WebSocket
 * - Sem polling (eliminado intervalo de 5 segundos)
 * - Atualização automática quando outro admin faz mudanças
 * - Atualização automática quando cliente faz cadastro na página inicial
 */

import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertCircle, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { useCentralizedStore, useClientes, useLancamentos, useSaldos, useConnectionStatus } from '@/contexts/CentralizedStoreContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type FiltroType = 'todos' | 'vencidos' | 'pagos' | 'alfabetico';

export default function Dashboard() {
  // ✅ NOVO: Usar CentralizedStoreContext para sincronização em tempo real
  const { clientes, isConnected } = useClientes();
  const { lancamentos } = useLancamentos();
  const { saldosPorCliente, saldoTotal } = useSaldos();
  const { statusConexao } = useConnectionStatus();

  const { irPara } = useNavigation();
  const { usuarioLogado } = useAuth();
  const [filtro, setFiltro] = useState<FiltroType>('todos');
  const [numeroWhatsAppAdmin, setNumeroWhatsAppAdmin] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Carregar número WhatsApp do admin
  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const response = await fetch('/api/users/config');
        if (response.ok) {
          const config = await response.json();
          if (config?.numeroWhatsAppAdmin) {
            setNumeroWhatsAppAdmin(config.numeroWhatsAppAdmin);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      } finally {
        setCarregando(false);
      }
    };
    carregarConfig();
  }, []);

  // ✅ REMOVIDO: Intervalo de polling (5 segundos)
  // Agora a sincronização é em tempo real via WebSocket

  // Filtrar e ordenar devedores
  const devedoresFiltrados = saldosPorCliente.filter((saldo) => {
    // Sempre filtrar para mostrar apenas clientes com saldo > 0
    if (saldo.saldo === 0) return false;
    // TODO: Adicionar status de vencimento quando implementado
    return true;
  });

  if (filtro === 'alfabetico') {
    devedoresFiltrados.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome));
  } else {
    // Ordenar por saldo (maior primeiro)
    devedoresFiltrados.sort((a, b) => b.saldo - a.saldo);
  }

  // Filtrar devedores com saldo > 0 para exibição
  const devedoresComSaldo = devedoresFiltrados.filter((s) => s.saldo > 0);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'pago':
        return 'badge-paid';
      case 'pendente':
        return 'badge-pending';
      case 'vencido':
        return 'badge-overdue';
      default:
        return '';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'pendente':
        return 'Pendente';
      case 'vencido':
        return 'Vencido';
      default:
        return '';
    }
  };

  // Indicador de status de conexão
  const statusConexaoClass = isConnected
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  const statusConexaoLabel = isConnected ? 'Conectado' : 'Desconectado';

  return (
    <div className="p-6 space-y-6">
      {/* Header com Status de Conexão */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{usuarioLogado?.nome || 'Caderninho Digital'}</h1>
          <p className="text-muted-foreground mt-1">
            {usuarioLogado?.tipo === 'admin' ? 'Resumo do seu caderninho' : 'Acompanhe seus gastos'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Status de Conexão */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isConnected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {isConnected ? (
              <Wifi size={18} className={statusConexaoClass} />
            ) : (
              <WifiOff size={18} className={statusConexaoClass} />
            )}
            <span className={`text-sm font-medium ${statusConexaoClass}`}>
              {statusConexaoLabel}
            </span>
          </div>

          <Button
            onClick={() => irPara('novo-lancamento')}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus size={20} />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Card de Saldo Total */}
      <div className="card-minimal p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Valor Total a Receber</p>
            <p className="text-4xl font-bold text-foreground mt-2 currency">
              R$ {saldoTotal.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ✅ Sincronizado em tempo real
            </p>
          </div>
          <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
            <TrendingUp size={32} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'vencidos', label: 'Vencidos' },
          { id: 'pagos', label: 'Pagos' },
          { id: 'alfabetico', label: 'Ordem Alfabética' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id as FiltroType)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Aviso de Desconexão */}
      {!isConnected && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-medium">
            ⚠️ Sem conexão com o servidor. Os dados podem estar desatualizados.
          </p>
        </div>
      )}

      {/* Lista de Devedores */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Devedores</h2>

        {carregando ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : devedoresComSaldo.length === 0 ? (
          <div className="card-minimal p-8 text-center">
            <AlertCircle size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum devedor encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {devedoresComSaldo.map((saldo) => {
              const lancamentosCliente = lancamentos.filter(
                (l) => l.clienteId === saldo.clienteId && l.tipo === 'debito'
              );

              return (
                <button
                  key={saldo.clienteId}
                  onClick={() => irPara('cliente', saldo.clienteId)}
                  className="w-full card-minimal p-4 flex items-center justify-between hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{saldo.clienteNome}</p>
                    <p className="text-sm text-muted-foreground">
                      {saldo.saldo > 0 ? `Deve R$ ${saldo.saldo.toFixed(2).replace('.', ',')}` : 'Sem débitos'}
                    </p>
                    {/* Últimas compras */}
                    {lancamentosCliente.slice(-2).map((l) => (
                      <p key={l.id} className="text-xs text-muted-foreground mt-1">
                        • {l.descricao || 'Sem descrição'} - R$ {l.valor.toFixed(2).replace('.', ',')}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge-status ${statusBadgeClass('pendente')}`}>
                      {statusLabel('pendente')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const cliente = clientes.find((c) => c.id === saldo.clienteId);
                        if (numeroWhatsAppAdmin) {
                          const mensagem = `Olá, ${cliente?.nome}! Passando para lembrar do seu saldo de R$ ${saldo.saldo.toFixed(2).replace('.', ',')} no meu caderno.`;
                          const url = `https://wa.me/${numeroWhatsAppAdmin}?text=${encodeURIComponent(mensagem)}`;
                          window.open(url, '_blank');
                        } else {
                          toast.error('Configure seu número de WhatsApp nas Configurações');
                        }
                      }}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                      title="Enviar mensagem WhatsApp"
                    >
                      <MessageCircle size={18} className="text-green-600 dark:text-green-400" />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Informações de Sincronização */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
        <p>
          {isConnected
            ? '✅ Sincronização em tempo real ativa'
            : '⏸️ Aguardando reconexão...'}
        </p>
      </div>
    </div>
  );
}
