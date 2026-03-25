/**
 * Relatórios - Análise financeira e exportação de dados
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useMemo } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useCentralizedStore } from '@/contexts/CentralizedStoreContext';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
// Import de armazenamento local removido - aplicativo usa APENAS servidor

export default function Relatorios() {
  const { clientes, lancamentos, calcularSaldoTotal, calcularSaldoCliente } = useCentralizedStore();

  // Calcular dados do gráfico
  const dadosGrafico = useMemo(() => {
    const meses: Record<string, { recebido: number; pendente: number; vencido: number }> = {};

    for (const lancamento of lancamentos) {
      const ts = typeof lancamento.data === 'string' ? parseInt(lancamento.data) : lancamento.data;
      const data = new Date(ts);
      const chave = `${data.getMonth() + 1}/${data.getFullYear()}`;

      if (!meses[chave]) {
        meses[chave] = { recebido: 0, pendente: 0, vencido: 0 };
      }

      const valor = typeof lancamento.valor === 'string' ? parseFloat(lancamento.valor) : lancamento.valor;
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

    for (const cliente of clientes) {
      const saldo = calcularSaldoCliente(cliente.id);
      if (saldo === 0) {
        totalRecebido += 0;
      } else if (saldo > 0) {
        totalPendente += saldo;
      }
    }

    return {
      totalRecebido,
      totalPendente,
      totalVencido: 0,
      totalGeral: totalRecebido + totalPendente,
      clientesAtivos: clientes.filter((c) => c.ativo).length,
    };
  }, [clientes, calcularSaldoCliente, lancamentos]);

  const handleExportarJSON = async () => {
    try {
      // Exportar dados locais
      const dataStr = JSON.stringify({ clientes, lancamentos }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
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
    toast.info('Importação não suportada - dados apenas no servidor');
    return;
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

      {/* Lista de Clientes com Detalhes */}
      <div className="card-minimal p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Detalhamento por Cliente</h2>
        <div className="space-y-2">
          {clientes.map((cliente) => {
            const saldo = calcularSaldoCliente(cliente.id);
            const lancamentosCliente = lancamentos.filter((l) => (l.cliente_id === cliente.id || l.clienteId === cliente.id));
            return (
              <div key={cliente.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{cliente.name || cliente.nome}</p>
                    {cliente.telefone && <p className="text-sm text-muted-foreground">{cliente.telefone}</p>}
                  </div>
                  <p className="font-bold text-lg currency">R$ {saldo.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Compras: {lancamentosCliente.filter((l) => l.tipo === 'debito').length}</p>
                  <p>Pagamentos: {lancamentosCliente.filter((l) => l.tipo === 'pagamento').length}</p>
                  <p>Status: <span className={`inline-block px-2 py-1 rounded ${
                    saldo === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                    saldo > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}>{saldo === 0 ? 'Pago' : saldo > 0 ? 'Pendente' : 'Vencido'}</span></p>
                </div>
                {/* Detalhes de compras */}
                {lancamentosCliente.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="font-medium text-foreground mb-2 text-sm">Itens:</p>
                    <div className="space-y-1">
                      {lancamentosCliente.map((l) => (
                        <div key={l.id} className="flex justify-between text-xs">
                          <div className="flex-1">
                            <p className="text-foreground">{l.descricao || 'Sem descrição'}</p>
                            <p className="text-muted-foreground">{new Date(l.data).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <p className={`font-semibold ${
                            l.tipo === 'debito' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {l.tipo === 'debito' ? '-' : '+'} R$ {l.valor.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Exportar/Importar */}
      <div className="card-minimal p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Backup e Dados</h2>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleExportarJSON}
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
