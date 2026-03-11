/**
 * ContaGeral - Registro rápido de compras sem login
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useLancamentos } from '@/hooks/useDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type AbaType = 'novo-cliente' | 'nova-compra' | 'historico';

export default function ContaGeral() {
  const { fazer_logout, usuarioLogado } = useAuth();
  const { clientes, adicionarCliente } = useClientes();
  const { lancamentos, adicionarLancamento } = useLancamentos();

  const [aba, setAba] = useState<AbaType>('nova-compra');
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<string>('');

  // Novo Cliente
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [carregandoNovoCliente, setCarregandoNovoCliente] = useState(false);

  // Nova Compra
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [carregandoCompra, setCarregandoCompra] = useState(false);

  // Clientes salvos (para seleção rápida)
  const [clientesSalvos, setClientesSalvos] = useState<Array<{ id: string; nome: string; telefone?: string }>>([]);

  useEffect(() => {
    // Carregar clientes salvos do localStorage
    const salvos = localStorage.getItem('caderninho_clientes_salvos');
    if (salvos) {
      setClientesSalvos(JSON.parse(salvos));
    }
  }, []);

  const salvarClienteRapido = (id: string, nome: string, telefone?: string) => {
    const novosSalvos = clientesSalvos.filter((c) => c.id !== id);
    novosSalvos.push({ id, nome, telefone });
    setClientesSalvos(novosSalvos);
    localStorage.setItem('caderninho_clientes_salvos', JSON.stringify(novosSalvos));
  };

  const handleNovoCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novoClienteNome.trim()) {
      toast.error('Digite o nome do cliente');
      return;
    }

    try {
      setCarregandoNovoCliente(true);
      const novoCliente = await adicionarCliente(novoClienteNome.trim(), novoClienteTelefone || undefined);
      salvarClienteRapido(novoCliente.id, novoCliente.nome, novoCliente.telefone);
      toast.success('Cliente adicionado com sucesso!');
      setNovoClienteNome('');
      setNovoClienteTelefone('');
      setAba('nova-compra');
    } catch (error) {
      toast.error('Erro ao adicionar cliente');
    } finally {
      setCarregandoNovoCliente(false);
    }
  };

  const handleNovaCompra = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteSelecionado) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!valor || parseFloat(valor) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (!descricao.trim()) {
      toast.error('Digite uma descrição');
      return;
    }

    try {
      setCarregandoCompra(true);
      const timestamp = new Date(data).getTime();
      await adicionarLancamento(clienteSelecionado, 'debito', parseFloat(valor), descricao.trim(), timestamp);
      toast.success('Compra registrada com sucesso!');
      setValor('');
      setDescricao('');
      setData(new Date().toISOString().split('T')[0]);
    } catch (error) {
      toast.error('Erro ao registrar compra');
    } finally {
      setCarregandoCompra(false);
    }
  };

  const handleAdicionarNumero = (num: string) => {
    setValor((prev) => {
      const novoValor = prev + num;
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Conta Geral - Compras Rápidas</h1>
            <p className="text-muted-foreground mt-1">Selecione o estabelecimento e registre compras</p>
            {usuarioLogado?.nomeEstabelecimento && (
              <p className="text-sm font-semibold text-primary mt-2">
                Estabelecimento: {usuarioLogado.nomeEstabelecimento}
              </p>
            )}
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

        {/* Abas */}
        <div className="flex gap-2">
          <button
            onClick={() => setAba('nova-compra')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              aba === 'nova-compra'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Nova Compra
          </button>
          <button
            onClick={() => setAba('novo-cliente')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              aba === 'novo-cliente'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Novo Cliente
          </button>
          <button
            onClick={() => setAba('historico')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              aba === 'historico'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Nova Compra */}
        {aba === 'nova-compra' && (
          <form onSubmit={handleNovaCompra} className="space-y-4">
            {/* Seleção de Cliente */}
            <div className="card-minimal p-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Cliente
              </label>
              <select
                value={clienteSelecionado}
                onChange={(e) => setClienteSelecionado(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um cliente...</option>
                {clientesSalvos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.telefone ? `(${c.telefone})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAba('novo-cliente')}
                className="text-sm text-primary hover:underline mt-2"
              >
                + Adicionar novo cliente
              </button>
            </div>

            {/* Valor com Teclado Numérico */}
            <div className="card-minimal p-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Valor
              </label>
              <div className="text-4xl font-bold text-foreground mb-4 currency text-right">
                R$ {valor || '0'}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleAdicionarNumero(num)}
                    className="py-3 bg-secondary hover:bg-muted rounded-lg font-semibold text-foreground transition-colors"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAdicionarNumero('0')}
                  className="col-span-2 py-3 bg-secondary hover:bg-muted rounded-lg font-semibold text-foreground transition-colors"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDecimal}
                  className="py-3 bg-secondary hover:bg-muted rounded-lg font-semibold text-foreground transition-colors"
                >
                  .
                </button>
              </div>

              <button
                type="button"
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

            <Button
              type="submit"
              disabled={carregandoCompra}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {carregandoCompra ? 'Salvando...' : 'Registrar Compra'}
            </Button>
          </form>
        )}

        {/* Novo Cliente */}
        {aba === 'novo-cliente' && (
          <form onSubmit={handleNovoCliente} className="space-y-4">
            <div className="card-minimal p-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome do Cliente
              </label>
              <Input
                type="text"
                placeholder="Digite o nome"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="card-minimal p-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Telefone (opcional)
              </label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={novoClienteTelefone}
                onChange={(e) => setNovoClienteTelefone(e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={carregandoNovoCliente}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {carregandoNovoCliente ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </form>
        )}

        {/* Histórico */}
        {aba === 'historico' && (
          <div className="space-y-3">
            {lancamentos.length === 0 ? (
              <div className="card-minimal p-8 text-center">
                <p className="text-muted-foreground">Nenhuma compra registrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lancamentos.map((lancamento) => {
                  const cliente = clientes.find((c) => c.id === lancamento.clienteId);
                  return (
                    <div
                      key={lancamento.id}
                      className="card-minimal p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{cliente?.nome}</p>
                        <p className="text-sm text-muted-foreground">{lancamento.descricao}</p>
                      </div>
                      <p className="font-semibold currency text-red-600 dark:text-red-400">
                        R$ {lancamento.valor.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
