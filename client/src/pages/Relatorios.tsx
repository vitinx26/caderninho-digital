/**
 * Relatórios - Análise financeira e exportação de dados
 * Design: Minimalismo Funcional com Tipografia Forte
 * 
 * ✅ MIGRADO PARA: React Query
 * - Sincronização automática a cada 10s
 * - Sem SSE/Polling complexo
 * - Sem CentralizedStoreContext
 */

import React, { useMemo } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useClientes, useLancamentos } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function Relatorios() {
  const clientesQuery = useClientes();
  const lancamentosQuery = useLancamentos();

  const clientes = clientesQuery.data || [];
  const lancamentos = lancamentosQuery.data || [];
  const isLoading = clientesQuery.isLoading || lancamentosQuery.isLoading;
  const isError = clientesQuery.isError || lancamentosQuery.isError;

  // Calcular dados do gráfico
  const dadosGrafico = useMemo(() => {
    const meses: Record<string, { recebido: number; pendente: number; vencido: number }> = {};

    for (const lancamento of lancamentos) {
      const ts = typeof lancamento.data === 'string' ? parseInt(lancamento.data) : (lancamento.data || 0);
      const data = new Date(ts);
      const chave = `${data.getMonth() + 1}/${data.getFullYear()}`;

      if (!meses[chave]) {
        meses[chave] = { recebido: 0, pendente: 0, vencido: 0 };
      }

      const valor = (typeof lancamento.valor === 'string' ? parseFloat(lancamento.valor) : lancamento.valor) / 100;
      if (lancamento.tipo === 'pagamento') {
        meses[chave].recebido += valor;
      } else {
        meses[chave].pendente += valor;
      }
    }

    return Object.entries(meses)
      .sort()
      .map(([mes, dados]) => ({
        mes,
        ...dados,
      }));
  }, [lancamentos]);

  // Calcular resumo
  const resumo = useMemo(() => {
    let totalRecebido = 0;
    let totalPendente = 0;

    for (const lancamento of lancamentos) {
      const valor = (typeof lancamento.valor === 'string' ? parseFloat(lancamento.valor) : lancamento.valor) / 100;
      if (lancamento.tipo === 'pagamento') {
        totalRecebido += valor;
      } else {
        totalPendente += valor;
      }
    }

    return {
      totalRecebido,
      totalPendente,
      saldoTotal: totalPendente - totalRecebido,
    };
  }, [lancamentos]);

  // Calcular devedores
  const devedores = useMemo(() => {
    const devedoresPorCliente: Record<number, { nome: string; saldo: number }> = {};

    for (const lancamento of lancamentos) {
      const clienteId = lancamento.clienteId;
      const cliente = clientes.find((c: any) => c.id === clienteId);
      const valor = (typeof lancamento.valor === 'string' ? parseFloat(lancamento.valor) : lancamento.valor) / 100;

      if (!devedoresPorCliente[clienteId]) {
        devedoresPorCliente[clienteId] = {
          nome: cliente?.nome || `Cliente ${clienteId}`,
          saldo: 0,
        };
      }

      if (lancamento.tipo === 'debito') {
        devedoresPorCliente[clienteId].saldo += valor;
      } else {
        devedoresPorCliente[clienteId].saldo -= valor;
      }
    }

    return Object.values(devedoresPorCliente)
      .filter((d) => d.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo);
  }, [lancamentos, clientes]);

  const exportarPDF = () => {
    toast.info('Exportação em PDF em desenvolvimento');
  };

  const exportarCSV = () => {
    toast.info('Exportação em CSV em desenvolvimento');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <div className="flex gap-2">
          <Button onClick={exportarPDF} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            PDF
          </Button>
          <Button onClick={exportarCSV} variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Recebido</p>
          <p className="text-2xl font-bold text-green-600">R$ {resumo.totalRecebido.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Pendente</p>
          <p className="text-2xl font-bold text-red-600">R$ {resumo.totalPendente.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Saldo Total</p>
          <p className={`text-2xl font-bold ${resumo.saldoTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
            R$ {resumo.saldoTotal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráfico de Movimentação */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Movimentação Mensal
        </h2>
        {dadosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="recebido" fill="#10b981" name="Recebido" />
              <Bar dataKey="pendente" fill="#ef4444" name="Pendente" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-center py-8">Sem dados para exibir</p>
        )}
      </div>

      {/* Devedores */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Maiores Devedores</h2>
        {devedores.length > 0 ? (
          <div className="space-y-2">
            {devedores.map((devedor, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-foreground">{devedor.nome}</span>
                <span className="font-semibold text-red-600">R$ {devedor.saldo.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum devedor no momento</p>
        )}
      </div>
    </div>
  );
}
