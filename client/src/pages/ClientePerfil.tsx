/**
 * ClientePerfil - Página de detalhes do cliente
 * Mostra extrato, débitos, pagamentos e ações
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React from 'react';
import { ArrowLeft, Plus, DollarSign, MessageCircle, Trash2 } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useLancamentos, useSaldos } from '@/hooks/useDB';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ClientePerfil() {
  const { clienteSelecionado, irPara, voltar } = useNavigation();
  const { usuarioLogado } = useAuth();
  const { clientes } = useClientes();
  const { lancamentos, deletarLancamento } = useLancamentos(clienteSelecionado || undefined);
  const saldos = useSaldos(clientes, lancamentos);
  const isAdmin = usuarioLogado?.tipo === 'admin';

  const cliente = clientes.find((c) => c.id === clienteSelecionado);
  const saldo = saldos.get(clienteSelecionado || '');

  if (!cliente || !saldo) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Cliente não encontrado</p>
      </div>
    );
  }

  const lancamentosCliente = lancamentos.filter((l) => l.clienteId === cliente.id);

  const handleWhatsApp = () => {
    if (!cliente.telefone) {
      toast.error('Cliente sem telefone cadastrado');
      return;
    }
    const mensagem = `Olá, ${cliente.nome}! Passando para lembrar do seu saldo de R$ ${saldo.saldoTotal.toFixed(2).replace('.', ',')} no meu caderno.`;
    const telefone = cliente.telefone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRegistrarPagamento = () => {
    irPara('novo-lancamento');
    toast.info('Selecione "Pagamento" para registrar o recebimento');
  };

  const handleDeletarLancamento = async (id: string) => {
    try {
      await deletarLancamento(id);
      toast.success('Lançamento deletado');
    } catch (error) {
      toast.error('Erro ao deletar lançamento');
    }
  };

  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
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
        <div className="card-minimal p-6 md:col-span-2">
          <p className="text-muted-foreground text-sm font-medium">Saldo Atual</p>
          <p className="text-4xl font-bold text-foreground mt-2 currency">
            R$ {saldo.saldoTotal.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Status: <span className={`badge-status ${
              saldo.status === 'pago' ? 'badge-paid' :
              saldo.status === 'pendente' ? 'badge-pending' :
              'badge-overdue'
            }`}>
              {saldo.status === 'pago' ? 'Pago' : saldo.status === 'pendente' ? 'Pendente' : 'Vencido'}
            </span>
          </p>
        </div>

        {/* Botão WhatsApp */}
        <Button
          onClick={handleWhatsApp}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white h-auto py-6"
        >
          <MessageCircle size={20} />
          <span>Cobrar via WhatsApp</span>
        </Button>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => irPara('novo-lancamento')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus size={20} />
          Adicionar Débito
        </Button>
        <Button
          onClick={handleRegistrarPagamento}
          variant="outline"
          className="flex items-center gap-2"
        >
          <DollarSign size={20} />
          Registrar Pagamento
        </Button>
      </div>

      {/* Extrato */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Extrato</h2>

        {lancamentosCliente.length === 0 ? (
          <div className="card-minimal p-8 text-center">
            <p className="text-muted-foreground">Nenhum lançamento</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lancamentosCliente.map((lancamento) => (
              <div
                key={lancamento.id}
                className="card-minimal p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{lancamento.descricao}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      lancamento.tipo === 'debito'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    }`}>
                      {lancamento.tipo === 'debito' ? 'Débito' : 'Pagamento'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatarData(lancamento.data)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-semibold currency ${
                    lancamento.tipo === 'debito'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {lancamento.tipo === 'debito' ? '+' : '-'} R$ {lancamento.valor.toFixed(2).replace('.', ',')}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeletarLancamento(lancamento.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                      title="Apenas admins podem deletar lançamentos"
                    >
                      <Trash2 size={18} className="text-red-600 dark:text-red-400" />
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
