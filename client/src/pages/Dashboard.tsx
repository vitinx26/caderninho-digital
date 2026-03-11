/**
 * Dashboard - Tela inicial do Caderninho Digital
 * Mostra resumo de saldo e lista de devedores
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertCircle, MessageCircle } from 'lucide-react';
import { useClientes } from '@/hooks/useDB';
import { useLancamentos } from '@/hooks/useDB';
import { useSaldos } from '@/hooks/useDB';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as db from '@/lib/db';

type FiltroType = 'todos' | 'vencidos' | 'pagos' | 'alfabetico';

export default function Dashboard() {
  const { clientes, carregando, recarregar: recarregarClientes } = useClientes();
  const { lancamentos, recarregar: recarregarLancamentos } = useLancamentos();
  const saldos = useSaldos(clientes, lancamentos);
  const { irPara } = useNavigation();
  const { usuarioLogado } = useAuth();
  const [filtro, setFiltro] = useState<FiltroType>('todos');
  const [numeroWhatsAppAdmin, setNumeroWhatsAppAdmin] = useState('');

  // Carregar número WhatsApp do admin
  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const config = await db.obterConfiguracao();
        if (config?.numeroWhatsAppAdmin) {
          setNumeroWhatsAppAdmin(config.numeroWhatsAppAdmin);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    };
    carregarConfig();
  }, []);

  // Recarregar dados a cada 5 segundos para sincronizar com Conta Geral
  useEffect(() => {
    const intervalo = setInterval(() => {
      recarregarClientes();
      recarregarLancamentos();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [recarregarClientes, recarregarLancamentos]);

  // Calcular total a receber (filtrando apenas clientes com saldo > 0)
  const totalReceber = Array.from(saldos.values()).reduce((acc, s) => acc + s.saldoTotal, 0);

  // Filtrar e ordenar devedores
  const devedoresFiltrados = Array.from(saldos.values()).filter((saldo) => {
    // Sempre filtrar para mostrar apenas clientes com saldo > 0
    if (saldo.saldoTotal === 0) return false;
    if (filtro === 'vencidos') return saldo.status === 'vencido';
    if (filtro === 'pagos') return saldo.status === 'pago';
    return true;
  });

  if (filtro === 'alfabetico') {
    devedoresFiltrados.sort((a, b) => a.nomeCliente.localeCompare(b.nomeCliente));
  } else {
    // Ordenar por saldo (maior primeiro)
    devedoresFiltrados.sort((a, b) => b.saldoTotal - a.saldoTotal);
  }

  // Filtrar devedores com saldo > 0 para exibição
  const devedoresComSaldo = devedoresFiltrados.filter((s) => s.saldoTotal > 0);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{usuarioLogado?.nomeEstabelecimento || 'Caderninho Digital'}</h1>
          <p className="text-muted-foreground mt-1">Resumo do seu caderninho</p>
        </div>
        <Button
          onClick={() => irPara('novo-lancamento')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus size={20} />
          Novo Lançamento
        </Button>
      </div>

      {/* Card de Saldo Total */}
      <div className="card-minimal p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Valor Total a Receber</p>
            <p className="text-4xl font-bold text-foreground mt-2 currency">
              R$ {totalReceber.toFixed(2).replace('.', ',')}
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
            {devedoresComSaldo.map((saldo) => (
              <button
                key={saldo.clienteId}
                onClick={() => irPara('cliente', saldo.clienteId)}
                className="w-full card-minimal p-4 flex items-center justify-between hover:bg-muted transition-colors text-left"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{saldo.nomeCliente}</p>
                  <p className="text-sm text-muted-foreground">
                    {saldo.saldoTotal > 0 ? `Deve R$ ${saldo.saldoTotal.toFixed(2).replace('.', ',')}` : 'Sem débitos'}
                  </p>
                  {/* Últimas compras */}
                  {lancamentos.filter((l) => l.clienteId === saldo.clienteId && l.tipo === 'debito').slice(-2).map((l) => (
                    <p key={l.id} className="text-xs text-muted-foreground mt-1">
                      • {l.descricao || 'Sem descrição'} - R$ {l.valor.toFixed(2).replace('.', ',')}
                    </p>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge-status ${statusBadgeClass(saldo.status)}`}>
                    {statusLabel(saldo.status)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const cliente = clientes.find((c) => c.id === saldo.clienteId);
                      if (numeroWhatsAppAdmin) {
                        const mensagem = `Olá, ${cliente?.nome}! Passando para lembrar do seu saldo de R$ ${saldo.saldoTotal.toFixed(2).replace('.', ',')} no meu caderno.`;
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
