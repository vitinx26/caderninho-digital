/**
 * Dashboard - Tela inicial do Caderninho Digital
 * Mostra resumo de saldo e lista de devedores
 * Design: Minimalismo Funcional com Tipografia Forte
 * 
 * ✅ MIGRADO PARA: React Query
 * - Sincronização automática a cada 10s
 * - Sem SSE/Polling complexo
 * - Sem CentralizedStoreContext
 */

import { useState } from 'react';
import { Plus, TrendingUp, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useClientes, useLancamentos } from '@/hooks/useData';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type FiltroType = 'todos' | 'vencidos' | 'pagos' | 'alfabetico';

export default function Dashboard() {
  // React Query hooks
  const clientesQuery = useClientes();
  const lancamentosQuery = useLancamentos();

  const { irPara } = useNavigation();
  const { usuarioLogado } = useAuth();
  const [filtro, setFiltro] = useState<FiltroType>('todos');

  // Dados
  const clientes = clientesQuery.data || [];
  const lancamentos = lancamentosQuery.data || [];
  const isLoading = clientesQuery.isLoading || lancamentosQuery.isLoading;
  const isError = clientesQuery.isError || lancamentosQuery.isError;
  const isConnected = !isError;

  // Calcular saldos (converter de centavos para reais)
  const calcularSaldoCliente = (clienteId: number) => {
    return lancamentos
      .filter((l: any) => l.clienteId === clienteId || l.cliente_id === clienteId)
      .reduce((acc: number, l: any) => {
        const valor = typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor;
        return l.tipo === 'debito' ? acc + (valor / 100) : acc - (valor / 100);
      }, 0);
  };

  const calcularSaldoTotal = () => {
    return lancamentos.reduce((acc: number, l: any) => {
      const valor = typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor;
      return l.tipo === 'debito' ? acc + (valor / 100) : acc - (valor / 100);
    }, 0);
  };

  // Preparar dados de saldos
  const saldosPorCliente = clientes
    .map((cliente: any) => ({
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      saldo: calcularSaldoCliente(cliente.id),
    }))
    .filter((s: any) => s.saldo > 0) // Mostrar apenas devedores
    .sort((a: any, b: any) => {
      if (filtro === 'alfabetico') {
        return a.clienteNome.localeCompare(b.clienteNome);
      }
      return b.saldo - a.saldo; // Maior saldo primeiro
    });

  const saldoTotal = calcularSaldoTotal();

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumo de saldos e devedores</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
          {isConnected ? (
            <>
              <Wifi size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-600">Conectado</span>
            </>
          ) : (
            <>
              <WifiOff size={18} className="text-red-600" />
              <span className="text-sm font-medium text-red-600">Desconectado</span>
            </>
          )}
        </div>
      </div>

      {/* Aviso de Desconexão */}
      {!isConnected && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-medium">
            ⚠️ Sem conexão com o servidor
          </p>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Devedores */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total de Devedores</p>
              <p className="text-3xl font-bold text-foreground mt-2">{saldosPorCliente.length}</p>
            </div>
            <AlertCircle size={32} className="text-yellow-600" />
          </div>
        </div>

        {/* Saldo Total */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Saldo Total</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                R$ {saldoTotal.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <TrendingUp size={32} className="text-blue-600" />
          </div>
        </div>

        {/* Total de Clientes */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total de Clientes</p>
              <p className="text-3xl font-bold text-foreground mt-2">{clientes.length}</p>
            </div>
            <Plus size={32} className="text-green-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'vencidos', label: 'Vencidos' },
          { id: 'pagos', label: 'Pagos' },
          { id: 'alfabetico', label: 'Alfabético' },
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
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Devedores</h2>
        </div>

        {saldosPorCliente.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum devedor no momento 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {saldosPorCliente.map((saldo: any) => (
              <button
                key={saldo.clienteId}
                onClick={() => {
                  irPara('cliente');
                  // Passar clienteId para ClientePerfil
                  sessionStorage.setItem('clienteSelecionadoId', saldo.clienteId);
                }}
                className="w-full px-6 py-4 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{saldo.clienteNome}</p>
                    <p className="text-sm text-muted-foreground">
                      {lancamentos.filter(
                        (l: any) => l.clienteId === saldo.clienteId || l.cliente_id === saldo.clienteId
                      ).length}{' '}
                      lançamentos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      R$ {saldo.saldo.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Botão Novo Lançamento */}
      <div className="flex justify-center">
        <Button
          onClick={() => irPara('novo-lancamento')}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Lançamento
        </Button>
      </div>
    </div>
  );
}
