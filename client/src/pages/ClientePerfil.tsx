/**
 * ClientePerfil - Página de detalhes do cliente
 * Mostra extrato, débitos, pagamentos e ações
 * Design: Minimalismo Funcional com Tipografia Forte
 * ✅ MIGRADO PARA: React Query
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, DollarSign, MessageCircle, Trash2 } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useLancamentos, useDeletarLancamento } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ClientePerfil() {
  const { irPara, voltar } = useNavigation();
  const { usuarioLogado } = useAuth();
  const clientesQuery = useClientes();
  const lancamentosQuery = useLancamentos();
  const deletarMutation = useDeletarLancamento();
  
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<number | null>(null);

  // Recuperar clienteId do sessionStorage
  useEffect(() => {
    const id = sessionStorage.getItem('clienteSelecionadoId');
    if (id) {
      setClienteSelecionadoId(parseInt(id, 10));
    }
  }, []);

  const isAdmin = usuarioLogado?.tipo === 'admin';
  const clientes = clientesQuery.data || [];
  const lancamentos = lancamentosQuery.data || [];

  // Encontrar cliente selecionado
  const cliente = clientes.find((c: any) => c.id === clienteSelecionadoId);

  // Calcular saldo do cliente
  const calcularSaldoCliente = (clienteId: number) => {
    return lancamentos
      .filter((l: any) => l.clienteId === clienteId || l.cliente_id === clienteId)
      .reduce((acc: number, l: any) => {
        const valor = typeof l.valor === 'string' ? parseFloat(l.valor) : l.valor;
        return l.tipo === 'debito' ? acc + (valor / 100) : acc - (valor / 100);
      }, 0);
  };

  const saldo = clienteSelecionadoId ? calcularSaldoCliente(clienteSelecionadoId) : 0;

  if (clientesQuery.isLoading || lancamentosQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={voltar}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Cliente não encontrado</h1>
        </div>
        <Button onClick={voltar} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const lancamentosCliente = lancamentos.filter(
    (l: any) => l.clienteId === cliente.id || l.cliente_id === cliente.id
  );

  const handleWhatsApp = () => {
    if (!cliente.telefone) {
      toast.error('Cliente sem telefone cadastrado');
      return;
    }
    const mensagem = `Olá, ${cliente.nome}! Passando para lembrar do seu saldo de R$ ${saldo.toFixed(2).replace('.', ',')} no meu caderno.`;
    const telefone = cliente.telefone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRegistrarPagamento = () => {
    sessionStorage.setItem('clienteSelecionadoId', cliente.id.toString());
    irPara('novo-lancamento');
    toast.info('Selecione "Pagamento" para registrar o recebimento');
  };

  const handleDeletarLancamento = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este lançamento?')) {
      return;
    }
    try {
      await deletarMutation.mutateAsync(id);
      toast.success('Lançamento deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar lançamento:', error);
      toast.error('Erro ao deletar lançamento');
    }
  };

  const formatarData = (data: string | number) => {
    if (!data) return 'Data não disponível';
    try {
      const date = typeof data === 'string' ? new Date(data) : new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={voltar}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{cliente.nome}</h1>
          {cliente.telefone && (
            <p className="text-muted-foreground">{cliente.telefone}</p>
          )}
        </div>
      </div>

      {/* Saldo e Ações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Saldo */}
        <div className="bg-card border border-border rounded-lg p-6 md:col-span-2">
          <p className="text-muted-foreground text-sm font-medium">Saldo Atual</p>
          <p className="text-4xl font-bold text-foreground mt-2">
            R$ {saldo.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Status: <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              saldo > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {saldo > 0 ? 'Pendente' : 'Pago'}
            </span>
          </p>
        </div>

        {/* Botão WhatsApp */}
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="gap-2 h-fit"
        >
          <MessageCircle size={18} />
          WhatsApp
        </Button>
      </div>

      {/* Ações */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleRegistrarPagamento}
          className="gap-2"
        >
          <Plus size={18} />
          Registrar Pagamento
        </Button>
      </div>

      {/* Extrato */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Extrato ({lancamentosCliente.length})</h2>
        </div>

        {lancamentosCliente.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum lançamento registrado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lancamentosCliente.map((lancamento: any) => (
              <div
                key={lancamento.id}
                className="p-6 flex items-center justify-between hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${
                    lancamento.tipo === 'debito'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <DollarSign size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {lancamento.tipo === 'debito' ? 'Débito' : 'Pagamento'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatarData(lancamento.data)}
                    </p>
                    {lancamento.descricao && (
                      <p className="text-sm text-muted-foreground">{lancamento.descricao}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-semibold text-lg ${
                    lancamento.tipo === 'debito' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {lancamento.tipo === 'debito' ? '+' : '-'} R$ {(lancamento.valor / 100).toFixed(2).replace('.', ',')}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeletarLancamento(lancamento.id)}
                      className="p-2 hover:bg-red-500/10 hover:text-red-600 rounded-lg transition-colors"
                      title="Deletar lançamento"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
