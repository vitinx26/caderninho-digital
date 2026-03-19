/**
 * NovoLancamento - Tela para adicionar débito ou pagamento
 * Formulário rápido com teclado numérico
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, MessageCircle } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useLancamentos } from '@/hooks/useDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { gerarMensagemWhatsApp, gerarUrlWhatsApp } from '@/lib/whatsappTemplate';
import { ConsumptionPopup, useConsumptionPopup } from '@/components/ConsumptionPopup';

interface NovoLancamentoProps {
  onVoltar?: () => void;
}

export default function NovoLancamento({ onVoltar: onVoltarProp }: NovoLancamentoProps) {
  const { voltar, clienteSelecionado } = useNavigation();
  const { usuarioLogado } = useAuth();
  const { clientes, adicionarCliente } = useClientes();
  const { adicionarLancamento } = useLancamentos();

  // Se for cliente logado, usar seu próprio ID
  const isClienteLogado = usuarioLogado?.tipo === 'cliente';
  const clienteIdFixo = isClienteLogado ? usuarioLogado?.id : undefined;

  const handleVoltar = () => {
    if (onVoltarProp) {
      onVoltarProp();
    } else {
      voltar();
    }
  };

  const [tipo, setTipo] = useState<'debito' | 'pagamento'>('debito');
  const [clienteId, setClienteId] = useState(clienteIdFixo || clienteSelecionado || '');
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const { isOpen, data: consumptionData, showPopup, closePopup } = useConsumptionPopup();

  const handleAdicionarNumero = (num: string) => {
    setValor((prev) => {
      const novoValor = prev + num;
      // Limitar a 2 casas decimais
      if (novoValor.includes('.')) {
        const [inteira, decimal] = novoValor.split('.');
        if (decimal.length > 2) return prev;
      }
      return novoValor;
    });
  };

  const handleBackspace = () => {
    setValor((prev) => prev.slice(0, -1));
  };

  const handleDecimal = () => {
    if (!valor.includes('.')) {
      setValor((prev) => (prev ? prev + '.' : '0.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!valor || parseFloat(valor) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (!descricao.trim()) {
      toast.error('Digite uma descrição');
      return;
    }

    try {
      setCarregando(true);

      let id = clienteId;

      // Se for novo cliente, criar primeiro
      if (mostrarNovoCliente && novoClienteNome.trim()) {
        const novoCliente = await adicionarCliente(novoClienteNome.trim());
        id = novoCliente.id;
      }

      if (!id) {
        toast.error('Selecione ou crie um cliente');
        return;
      }

      const timestamp = new Date(data).getTime();
      await adicionarLancamento(id, tipo, parseFloat(valor), descricao.trim(), timestamp);

      // Calcular consumo total do cliente
      const clienteAtual = clientes.find(c => c.id === id);
      if (clienteAtual) {
        // Mostrar popup de consumo
        showPopup({
          descricao: descricao.trim(),
          valor: parseFloat(valor),
          totalConsumo: 0, // Será calculado no backend
          nomeCliente: clienteAtual.nome,
          percentualAumento: 5, // Placeholder - calcular dinamicamente
        });
      }

      toast.success(
        `${tipo === 'debito' ? 'Débito' : 'Pagamento'} registrado com sucesso!`
      );

      // Limpar formulário
      setValor('');
      setDescricao('');
      setNovoClienteNome('');
      setMostrarNovoCliente(false);
      setClienteId('');
      setData(new Date().toISOString().split('T')[0]);
    } catch (error) {
      toast.error('Erro ao registrar lançamento');
    } finally {
      setCarregando(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    try {
      const cliente = clientes.find(c => c.id === clienteId);
      if (!cliente) {
        toast.error('Cliente não encontrado');
        return;
      }
      if (!cliente.telefone) {
        toast.error('Cliente sem telefone registrado');
        return;
      }

      const mensagem = gerarMensagemWhatsApp(
        usuarioLogado?.templateWhatsapp,
        cliente,
        {
          id: '',
          clienteId,
          tipo: 'debito',
          valor: Math.round(parseFloat(valor) * 100),
          descricao: descricao.trim(),
          data: new Date(data).getTime(),
          dataCriacao: Date.now(),
        }
      );

      const urlWhatsApp = gerarUrlWhatsApp(
        cliente.telefone,
        mensagem
      );

      window.open(urlWhatsApp, '_blank');
      toast.success('Abrindo WhatsApp...');
    } catch (error) {
      toast.error('Erro ao gerar mensagem');
      console.error(error);
    }
  };

  return (
    <>
      <ConsumptionPopup isOpen={isOpen} data={consumptionData} onClose={closePopup} />
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleVoltar}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Lançamento</h1>
          <p className="text-muted-foreground">Registre um débito ou pagamento</p>
        </div>
      </div>

      {/* Tipo de Lançamento */}
      <div className="flex gap-3">
        <button
          onClick={() => setTipo('debito')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            tipo === 'debito'
              ? 'bg-red-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Débito
        </button>
        <button
          onClick={() => setTipo('pagamento')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            tipo === 'pagamento'
              ? 'bg-green-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Pagamento
        </button>
      </div>

      {/* Seleção de Cliente */}
      {isClienteLogado ? (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Seus Gastos
          </label>
          <div className="card-minimal p-4 bg-muted">
            <p className="font-medium text-foreground">{usuarioLogado?.nome}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você está adicionando despesas à sua conta
            </p>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cliente
          </label>
          {!mostrarNovoCliente ? (
            <div className="space-y-2">
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setMostrarNovoCliente(true)}
                className="w-full py-2 px-3 border border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Novo Cliente
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Nome do novo cliente"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
                className="w-full"
              />
              <button
                onClick={() => setMostrarNovoCliente(false)}
                className="w-full py-2 px-3 border border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Valor */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Valor (R$)
        </label>
        <div className="text-4xl font-bold text-primary mb-4">
          {valor || '0.00'}
        </div>

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleAdicionarNumero(num.toString())}
              className="py-3 bg-muted hover:bg-muted/80 rounded-lg font-semibold text-foreground transition-colors"
            >
              {num}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAdicionarNumero('0')}
            className="py-3 bg-muted hover:bg-muted/80 rounded-lg font-semibold text-foreground transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="py-3 bg-muted hover:bg-muted/80 rounded-lg font-semibold text-foreground transition-colors"
          >
            ,
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition-colors"
          >
            <Minus size={20} className="mx-auto" />
          </button>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Descrição
        </label>
        <Input
          type="text"
          placeholder="Ex: Venda de produtos"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Data */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Data
        </label>
        <Input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Botões Salvar e WhatsApp */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={carregando}
          className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {carregando ? 'Salvando...' : 'Registrar Lançamento'}
        </Button>
        {tipo === 'debito' && clienteId && valor && descricao && (
          <Button
            onClick={handleEnviarWhatsApp}
            disabled={carregando}
            className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2"
            title="Enviar cobrança via WhatsApp"
          >
            <MessageCircle size={20} />
          </Button>
        )}
      </div>
    </div>
    </>
  );
}
