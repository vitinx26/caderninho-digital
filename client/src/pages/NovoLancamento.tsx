/**
 * NovoLancamento - Tela para adicionar débito ou pagamento
 * Formulário rápido com teclado numérico
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useClientes, useLancamentos } from '@/hooks/useDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function NovoLancamento() {
  const { voltar, clienteSelecionado } = useNavigation();
  const { clientes, adicionarCliente } = useClientes();
  const { adicionarLancamento } = useLancamentos();

  const [tipo, setTipo] = useState<'debito' | 'pagamento'>('debito');
  const [clienteId, setClienteId] = useState(clienteSelecionado || '');
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);

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
          <h1 className="text-3xl font-bold text-foreground">Novo Lançamento</h1>
          <p className="text-muted-foreground">Registre um débito ou pagamento</p>
        </div>
      </div>

      {/* Tipo de Lançamento */}
      <div className="flex gap-3">
        <button
          onClick={() => setTipo('debito')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            tipo === 'debito'
              ? 'bg-red-600 text-white'
              : 'bg-secondary text-secondary-foreground hover:bg-muted'
          }`}
        >
          <Plus size={20} />
          Débito
        </button>
        <button
          onClick={() => setTipo('pagamento')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            tipo === 'pagamento'
              ? 'bg-green-600 text-white'
              : 'bg-secondary text-secondary-foreground hover:bg-muted'
          }`}
        >
          <Minus size={20} />
          Pagamento
        </button>
      </div>

      {/* Seleção de Cliente */}
      <div className="card-minimal p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Cliente
        </label>
        {!mostrarNovoCliente ? (
          <div className="space-y-2">
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione um cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <button
              onClick={() => setMostrarNovoCliente(true)}
              className="text-sm text-primary hover:underline"
            >
              + Criar novo cliente
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Nome do cliente"
              value={novoClienteNome}
              onChange={(e) => setNovoClienteNome(e.target.value)}
              className="w-full"
            />
            <button
              onClick={() => setMostrarNovoCliente(false)}
              className="text-sm text-primary hover:underline"
            >
              ← Selecionar cliente existente
            </button>
          </div>
        )}
      </div>

      {/* Valor com Teclado Numérico */}
      <div className="card-minimal p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Valor
        </label>
        <div className="text-4xl font-bold text-foreground mb-4 currency text-right">
          R$ {valor || '0'}
        </div>

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleAdicionarNumero(num)}
              className="py-3 bg-secondary hover:bg-muted rounded-lg font-semibold text-foreground transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleAdicionarNumero('0')}
            className="col-span-2 py-3 bg-secondary hover:bg-muted rounded-lg font-semibold text-foreground transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="py-3 bg-secondary hover:bg-muted rounded-lg font-semibold text-foreground transition-colors"
          >
            .
          </button>
        </div>

        {/* Botão Backspace */}
        <button
          onClick={handleBackspace}
          className="w-full mt-2 py-3 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold text-red-700 dark:text-red-300 transition-colors"
        >
          Apagar
        </button>
      </div>

      {/* Descrição */}
      <div className="card-minimal p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Descrição
        </label>
        <Input
          type="text"
          placeholder="Ex: 2 pães e 1 leite"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Data */}
      <div className="card-minimal p-4">
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

      {/* Botão Salvar */}
      <Button
        onClick={handleSubmit}
        disabled={carregando}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        {carregando ? 'Salvando...' : 'Registrar Lançamento'}
      </Button>
    </div>
  );
}
