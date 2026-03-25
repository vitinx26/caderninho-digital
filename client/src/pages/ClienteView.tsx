/**
 * ClienteView - Visualização do cliente logado
 * Mostra apenas seus gastos pessoais
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React from 'react';
import { LogOut, TrendingDown, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useCentralizedStore } from '@/contexts/CentralizedStoreContext';
import { Button } from '@/components/ui/button';

interface ClienteViewProps {
  onNovoLancamento?: () => void;
}

export default function ClienteView({ onNovoLancamento }: ClienteViewProps) {
  const { usuarioLogado, fazer_logout } = useAuth();
  const { irPara } = useNavigation();
  const { lancamentos, calcularSaldoCliente } = useCentralizedStore();

  const handleNovoLancamento = () => {
    if (onNovoLancamento) {
      onNovoLancamento();
    } else {
      irPara('novo-lancamento');
    }
  };

  // Filtrar lancamentos do cliente logado
  const lancamentosCliente = lancamentos.filter((l) => (l.cliente_id === String(usuarioLogado?.id) || l.clienteId === usuarioLogado?.id));

  // Calcular saldo
  const saldoTotal = calcularSaldoCliente(String(usuarioLogado?.id || ''));

  const formatarData = (timestamp: number | string) => {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(ts).toLocaleDateString('pt-BR');
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
          <div className="flex gap-2">
            <Button
              onClick={handleNovoLancamento}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={20} />
              Novo Lançamento
            </Button>
            <Button
              onClick={fazer_logout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={20} />
              Sair
            </Button>
          </div>
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
