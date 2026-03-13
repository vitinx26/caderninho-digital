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
import * as db from '@/lib/db';
import { salvarSenhaSegura } from '@/lib/passwordPersistence';

type AbaType = 'novo-cliente' | 'nova-compra';

export default function ContaGeral() {
  const { fazer_logout, usuarioLogado } = useAuth();
  const { clientes, adicionarCliente } = useClientes();
  const { lancamentos, adicionarLancamento } = useLancamentos();

  const [aba, setAba] = useState<AbaType>('nova-compra');
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<string>('');
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState<string>('');

  // Carregar nome do estabelecimento ao montar
  useEffect(() => {
    const estabelecimento = localStorage.getItem('caderninho_estabelecimento');
    if (estabelecimento) {
      setNomeEstabelecimento(estabelecimento);
    }
  }, []);

  // Novo Cliente
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [novoClienteSenha, setNovoClienteSenha] = useState('');
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
    // Carregar clientes de múltiplas fontes (localStorage + IndexedDB)
    const carregarClientes = () => {
      try {
        const clientesMap = new Map<string, any>();
        
        // Carregar clientes salvos do localStorage
        const salvos = localStorage.getItem('caderninho_clientes_salvos');
        if (salvos) {
          JSON.parse(salvos).forEach((c: any) => {
            clientesMap.set(c.id, c);
          });
        }

        // Carregar clientes principais do localStorage
        const principais = localStorage.getItem('caderninho_clientes');
        if (principais) {
          JSON.parse(principais).forEach((c: any) => {
            if (!clientesMap.has(c.id)) {
              clientesMap.set(c.id, {
                id: c.id,
                nome: c.nome,
                telefone: c.telefone
              });
            }
          });
        }

        // Carregar clientes do IndexedDB (dados migrados)
        if (clientes && Array.isArray(clientes)) {
          clientes.forEach((c: any) => {
            if (!clientesMap.has(c.id)) {
              clientesMap.set(c.id, {
                id: c.id,
                nome: c.nome,
                telefone: c.telefone
              });
            }
          });
        }

        // Converter para array e ordenar
        const clientesOrdenados = Array.from(clientesMap.values()).sort((a, b) => 
          a.nome.localeCompare(b.nome)
        );
        
        setClientesSalvos(clientesOrdenados);
        console.log('Clientes carregados (localStorage + IndexedDB):', clientesOrdenados);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    };

    carregarClientes();
  }, [clientes]);

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

    // Validar email e senha se fornecidos
    if (novoClienteEmail.trim() && !novoClienteSenha.trim()) {
      toast.error('Se informar email, também deve informar senha');
      return;
    }

    if (!novoClienteEmail.trim() && novoClienteSenha.trim()) {
      toast.error('Se informar senha, também deve informar email');
      return;
    }

    // Validar formato de email
    if (novoClienteEmail.trim() && !novoClienteEmail.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    // Validar comprimento de senha
    if (novoClienteSenha.trim() && novoClienteSenha.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setCarregandoNovoCliente(true);
      const novoCliente = await adicionarCliente(novoClienteNome.trim(), novoClienteTelefone || undefined);
      salvarClienteRapido(novoCliente.id, novoCliente.nome, novoCliente.telefone);

      // Se forneceu email e senha, criar usuário automaticamente
      if (novoClienteEmail.trim() && novoClienteSenha.trim()) {
        try {
          const novoUsuario = {
            id: novoCliente.id,
            email: novoClienteEmail.trim(),
            senha: novoClienteSenha,
            nome: novoClienteNome.trim(),
            tipo: 'cliente' as const,
            telefone: novoClienteTelefone || '',
            dataCriacao: Date.now(),
          };
          await db.adicionarUsuario(novoUsuario);
          // Salvar senha com segurança
          await salvarSenhaSegura(novoClienteEmail.trim(), novoClienteSenha);
          toast.success('✅ Cliente e usuário criados! Ele pode fazer login agora.');
        } catch (e) {
          console.warn('Erro ao criar usuário para cliente:', e);
          toast.success('Cliente adicionado, mas não foi possível criar login. Tente novamente.');
        }
      } else {
        toast.success('Cliente adicionado com sucesso!');
      }

      setNovoClienteNome('');
      setNovoClienteTelefone('');
      setNovoClienteEmail('');
      setNovoClienteSenha('');
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
            {(nomeEstabelecimento || usuarioLogado?.nomeEstabelecimento) && (
              <p className="text-sm font-semibold text-primary mt-2">
                📍 Estabelecimento: {nomeEstabelecimento || usuarioLogado?.nomeEstabelecimento}
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
                    {c.nome}
                  </option>
                ))}
              </select>
              {clientesSalvos.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Nenhum cliente cadastrado. Crie um novo cliente primeiro.
                </p>
              )}
            </div>

            {/* Descrição */}
            <div className="card-minimal p-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Descrição
              </label>
              <Input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Compra de bebidas"
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

            {/* Valor */}
            <div className="card-minimal p-4">
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
                    type="button"
                    onClick={() => handleAdicionarNumero(num.toString())}
                    className="p-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAdicionarNumero('0')}
                  className="p-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDecimal}
                  className="p-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="p-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  ← Apagar
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={carregandoCompra}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {carregandoCompra ? 'Salvando...' : 'Registrar Compra'}
            </Button>
          </form>
        )}

        {/* Novo Cliente */}
        {aba === 'novo-cliente' && (
          <form onSubmit={handleNovoCliente} className="card-minimal p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Adicionar Novo Cliente</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome *</label>
              <Input
                type="text"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Telefone (Opcional)</label>
              <Input
                type="tel"
                value={novoClienteTelefone}
                onChange={(e) => setNovoClienteTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full"
              />
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                💡 Para permitir que o cliente faça login e acompanhe seus gastos pelo app, preencha email e senha:
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email (Opcional)</label>
              <Input
                type="email"
                value={novoClienteEmail}
                onChange={(e) => setNovoClienteEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">Necessário para criar login</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Senha (Opcional)</label>
              <Input
                type="password"
                value={novoClienteSenha}
                onChange={(e) => setNovoClienteSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">Necessária para criar login</p>
            </div>

            <Button
              type="submit"
              disabled={carregandoNovoCliente}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {carregandoNovoCliente ? 'Adicionando...' : 'Adicionar Cliente'}
            </Button>
          </form>
        )}


      </div>
    </div>
  );
}
