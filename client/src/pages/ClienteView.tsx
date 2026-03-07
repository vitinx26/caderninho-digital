/**
 * ClienteView - Visualização do cliente logado
 * Mostra apenas seus gastos pessoais
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React from 'react';
import { LogOut, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLancamentos } from '@/hooks/useDB';
import { Button } from '@/components/ui/button';

export default function ClienteView() {
  const { usuarioLogado, fazer_logout } = useAuth();
  const { lancamentos } = useLancamentos();

  // Filtrar lançamentos do cliente logado
  const lancamentosCliente = lancamentos.filter((l) => l.clienteId === usuarioLogado?.id);

  // Calcular saldo
  let saldoTotal = 0;
  for (const lancamento of lancamentosCliente) {
    if (lancamento.tipo === 'debito') {
      saldoTotal += lancamento.valor;
    } else {
      saldoTotal -= lancamento.valor;
    }
  }

  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meus Gastos</h1>
            <p className="text-muted-foreground mt-1">Olá, {usuarioLogado?.nome}</p>
          </div>
          <Button
            onClick={fazer_logout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={20} />
            Sair
          </Button>
        </div>

        {/* Saldo */}
        <div className="card-minimal p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Seu Saldo</p>
              <p className="text-4xl font-bold text-foreground mt-2 currency">
                R$ {saldoTotal.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              saldoTotal > 0
                ? 'bg-red-100 dark:bg-red-900'
                : 'bg-green-100 dark:bg-green-900'
            }`}>
              <TrendingDown size={32} className={
                saldoTotal > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              } />
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Histórico de Compras</h2>

          {lancamentosCliente.length === 0 ? (
            <div className="card-minimal p-8 text-center">
              <p className="text-muted-foreground">Nenhuma compra registrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lancamentosCliente.map((lancamento) => (
                <div
                  key={lancamento.id}
                  className="card-minimal p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{lancamento.descricao}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatarData(lancamento.data)}
                    </p>
                  </div>
                  <p className={`font-semibold currency ${
                    lancamento.tipo === 'debito'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {lancamento.tipo === 'debito' ? '+' : '-'} R$ {lancamento.valor.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="card-minimal p-4 text-sm text-muted-foreground">
          <p>
            <strong>Nota:</strong> Este é seu histórico de compras. Você pode ver todos os seus gastos registrados aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
