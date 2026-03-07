/**
 * Relatórios - Análise financeira e exportação de dados
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useMemo } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useClientes, useLancamentos, useSaldos } from '@/hooks/useDB';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import * as db from '@/lib/db';

export default function Relatorios() {
  const { clientes } = useClientes();
  const { lancamentos } = useLancamentos();
  const saldos = useSaldos(clientes, lancamentos);

  // Calcular dados do gráfico
  const dadosGrafico = useMemo(() => {
    const meses: Record<string, { recebido: number; pendente: number; vencido: number }> = {};

    for (const lancamento of lancamentos) {
      const data = new Date(lancamento.data);
      const chave = `${data.getMonth() + 1}/${data.getFullYear()}`;

      if (!meses[chave]) {
        meses[chave] = { recebido: 0, pendente: 0, vencido: 0 };
      }

      if (lancamento.tipo === 'pagamento') {
        meses[chave].recebido += lancamento.valor;
      } else {
        meses[chave].pendente += lancamento.valor;
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
    let totalVencido = 0;

    for (const saldo of Array.from(saldos.values())) {
      if (saldo.status === 'pago') {
        totalRecebido += saldo.saldoTotal;
      } else if (saldo.status === 'vencido') {
        totalVencido += saldo.saldoTotal;
      } else {
        totalPendente += saldo.saldoTotal;
      }
    }

    return {
      totalRecebido,
      totalPendente,
      totalVencido,
      totalGeral: totalRecebido + totalPendente + totalVencido,
      clientesAtivos: clientes.filter((c) => c.ativo).length,
    };
  }, [saldos, clientes]);

  const handleExportarPDF = async () => {
    try {
      const dados = await db.exportarDados();
      const blob = new Blob([dados], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caderninho-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const conteudo = await file.text();
      await db.importarDados(conteudo);
      toast.success('Dados importados com sucesso!');
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao importar dados');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análise financeira e saúde do negócio</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-minimal p-4">
          <p className="text-muted-foreground text-sm font-medium">Total a Receber</p>
          <p className="text-2xl font-bold text-foreground mt-2 currency">
            R$ {resumo.totalGeral.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="card-minimal p-4">
          <p className="text-muted-foreground text-sm font-medium">Recebido</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2 currency">
            R$ {resumo.totalRecebido.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="card-minimal p-4">
          <p className="text-muted-foreground text-sm font-medium">Pendente</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2 currency">
            R$ {resumo.totalPendente.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="card-minimal p-4">
          <p className="text-muted-foreground text-sm font-medium">Vencido</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2 currency">
            R$ {resumo.totalVencido.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="card-minimal p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Evolução Mensal</h2>
        </div>

        {dadosGrafico.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Bar dataKey="recebido" fill="#10B981" name="Recebido" />
              <Bar dataKey="pendente" fill="#F97316" name="Pendente" />
              <Bar dataKey="vencido" fill="#EF4444" name="Vencido" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum dado para exibir</p>
        )}
      </div>

      {/* Clientes Ativos */}
      <div className="card-minimal p-4">
        <p className="text-muted-foreground text-sm font-medium">Clientes Ativos</p>
        <p className="text-3xl font-bold text-foreground mt-2">{resumo.clientesAtivos}</p>
      </div>

      {/* Exportar/Importar */}
      <div className="card-minimal p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Backup e Dados</h2>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleExportarPDF}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download size={20} />
            Exportar Dados (JSON)
          </Button>

          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted text-secondary-foreground font-medium transition-colors cursor-pointer">
            <Download size={20} />
            Importar Dados
            <input
              type="file"
              accept=".json"
              onChange={handleImportar}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Faça backup regularmente para não perder seus dados. O arquivo será salvo no seu dispositivo.
        </p>
      </div>
    </div>
  );
}
