/**
 * Dashboard - Tela principal do Caderninho Digital
 * Mostra resumo de saldo e lista de devedores
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Settings, MessageCircle, DollarSign } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [estabelecimentoId, setEstabelecimentoId] = useState<number | null>(null);

  // Buscar estabelecimentos do admin
  const { data: estabelecimentos } = trpc.estabelecimentos.listar.useQuery(undefined, {
    enabled: !!user && user.role === 'admin',
  });

  // Buscar clientes do estabelecimento
  const { data: clientes } = trpc.clientes.listar.useQuery(
    { estabelecimentoId: estabelecimentoId || 0 },
    { enabled: !!estabelecimentoId }
  );

  // Buscar lançamentos do estabelecimento
  const { data: lancamentos } = trpc.lancamentos.listarPorEstabelecimento.useQuery(
    { estabelecimentoId: estabelecimentoId || 0 },
    { enabled: !!estabelecimentoId }
  );

  // Selecionar primeiro estabelecimento automaticamente
  useEffect(() => {
    if (estabelecimentos && estabelecimentos.length > 0 && !estabelecimentoId) {
      setEstabelecimentoId(estabelecimentos[0].id);
    }
  }, [estabelecimentos, estabelecimentoId]);

  // Calcular saldos
  const saldos = new Map<number, { nome: string; total: number; compras: number; pagamentos: number }>();
  
  if (clientes && lancamentos) {
    clientes.forEach((cliente) => {
      saldos.set(cliente.id, {
        nome: cliente.nome,
        total: 0,
        compras: 0,
        pagamentos: 0,
      });
    });

    lancamentos.forEach((lancamento) => {
      const saldo = saldos.get(lancamento.clienteId);
      if (saldo) {
        const valor = lancamento.valor / 100; // Converter de centavos
        if (lancamento.tipo === 'debito') {
          saldo.total += valor;
          saldo.compras += 1;
        } else {
          saldo.total -= valor;
          saldo.pagamentos += 1;
        }
      }
    });
  }

  const totalAReceber = Array.from(saldos.values()).reduce((sum, s) => sum + Math.max(0, s.total), 0);
  const clientesComDebito = Array.from(saldos.values()).filter((s) => s.total > 0).length;

  const estabelecimento = estabelecimentos?.find((e) => e.id === estabelecimentoId);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Acesso não autorizado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {estabelecimento?.nome || 'Caderninho Digital'}
            </h1>
            <p className="text-muted-foreground mt-2">Controle de dívidas com agilidade</p>
          </div>
          <Button
            onClick={() => setLocation('/admin/perfil')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings size={20} />
            Perfil
          </Button>
        </div>

        {/* Seletor de Estabelecimento */}
        {estabelecimentos && estabelecimentos.length > 1 && (
          <div className="mb-6">
            <select
              value={estabelecimentoId || ''}
              onChange={(e) => setEstabelecimentoId(Number(e.target.value))}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {estabelecimentos.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total a Receber */}
          <div className="card-minimal p-6">
            <p className="text-muted-foreground text-sm font-medium">Total a Receber</p>
            <p className="text-4xl font-bold text-foreground mt-2">
              R$ {totalAReceber.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {clientesComDebito} cliente{clientesComDebito !== 1 ? 's' : ''} com débito
            </p>
          </div>

          {/* Clientes Cadastrados */}
          <div className="card-minimal p-6">
            <p className="text-muted-foreground text-sm font-medium">Clientes</p>
            <p className="text-4xl font-bold text-foreground mt-2">
              {clientes?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              cadastrados
            </p>
          </div>

          {/* Transações */}
          <div className="card-minimal p-6">
            <p className="text-muted-foreground text-sm font-medium">Transações</p>
            <p className="text-4xl font-bold text-foreground mt-2">
              {lancamentos?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              registradas
            </p>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="card-minimal p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Clientes</h2>
            <Button
              onClick={() => setLocation('/novo-cliente')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={20} />
              Novo Cliente
            </Button>
          </div>

          {saldos.size === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from(saldos.entries()).map(([clienteId, saldo]) => (
                <div
                  key={clienteId}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{saldo.nome}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {saldo.compras} compra{saldo.compras !== 1 ? 's' : ''} • {saldo.pagamentos} pagamento{saldo.pagamentos !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        saldo.total > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        R$ {Math.abs(saldo.total).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {saldo.total > 0 ? 'Deve' : 'Quitado'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
