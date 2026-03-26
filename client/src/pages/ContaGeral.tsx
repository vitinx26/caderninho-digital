/**
 * ContaGeral.tsx - Página de Conta Geral (Compras Rápidas)
 * 
 * ✅ MIGRADO PARA: React Query (useClientes, useLancamentos, useMenus)
 * ✅ SEM SSE/Polling - Simples e confiável
 * 
 * Características:
 * - Registrar compras rápidas sem login
 * - Selecionar cliente
 * - Selecionar itens do cardápio
 * - Sincronização automática via React Query
 */

import { useState } from 'react';
import { LogOut, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useLancamentos, useMenus, useAdicionarLancamento } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import CardapioClienteView from '@/components/CardapioClienteView';

type AbaType = 'nova-compra' | 'novo-cliente';

export default function ContaGeral() {
  const { fazer_logout } = useAuth();
  
  // React Query hooks
  const clientesQuery = useClientes();
  const lancamentosQuery = useLancamentos();
  const menusQuery = useMenus();
  const adicionarLancamento = useAdicionarLancamento();

  // Estado do formulário
  const [aba, setAba] = useState<AbaType>('nova-compra');
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null);
  const [valor, setValor] = useState('');
  const [busca, setBusca] = useState('');
  const [carregandoCompra, setCarregandoCompra] = useState(false);

  // Novo cliente
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [carregandoNovoCliente, setCarregandoNovoCliente] = useState(false);

  // Dados
  const clientes = clientesQuery.data || [];
  const menus = menusQuery.data || [];
  const isLoading = clientesQuery.isLoading || menusQuery.isLoading;
  const isError = clientesQuery.isError || menusQuery.isError;
  const isConnected = !isError;

  // Filtrar clientes por busca
  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.email?.toLowerCase().includes(busca.toLowerCase())
  );

  // Handlers
  const handleSalvarCompra = async () => {
    if (!clienteSelecionado) {
      toast.error('Selecione um cliente');
      return;
    }
    
    if (!valor || parseFloat(valor) <= 0) {
      toast.error('Selecione itens do cardápio ou informe um valor');
      return;
    }

    if (!isConnected) {
      toast.error('Sem conexão com o servidor. Chama o proprietário.');
      return;
    }

    setCarregandoCompra(true);
    try {
      await adicionarLancamento.mutateAsync({
        clienteId: clienteSelecionado,
        tipo: 'debito',
        valor: parseFloat(valor),
      });

      toast.success(`✓ Compra de R$ ${parseFloat(valor).toFixed(2).replace('.', ',')} registrada!`);
      
      // Limpar formulário
      setClienteSelecionado(null);
      setValor('');
      setBusca('');
    } catch (error) {
      console.error('Erro ao registrar compra:', error);
      toast.error('Erro ao registrar compra');
    } finally {
      setCarregandoCompra(false);
    }
  };

  const handleCriarCliente = async () => {
    if (!novoClienteNome.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    if (!isConnected) {
      toast.error('Sem conexão com o servidor. Chama o proprietário.');
      return;
    }

    setCarregandoNovoCliente(true);
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoClienteNome,
          email: novoClienteEmail || `${novoClienteNome.toLowerCase().replace(/\s+/g, '')}@caderninho.local`,
          telefone: novoClienteTelefone,
        }),
      });

      if (response.ok) {
        toast.success(`✓ Cliente "${novoClienteNome}" criado com sucesso!`);
        
        // Limpar formulário
        setNovoClienteNome('');
        setNovoClienteTelefone('');
        setNovoClienteEmail('');
        setAba('nova-compra');
        
        // Refetch clientes
        clientesQuery.refetch();
      } else {
        const erro = await response.json();
        toast.error(`Erro: ${erro.message || 'Falha ao criar cliente'}`);
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente');
    } finally {
      setCarregandoNovoCliente(false);
    }
  };

  // Removido - agora usando onSelectionChange do CardapioClienteView

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header com Status de Conexão */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Conta Geral</h1>
            <p className="text-muted-foreground mt-1">Registre compras rápidas sem login</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Status de Conexão */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
              }`}
            >
              {isConnected ? (
                <Wifi size={18} className="text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff size={18} className="text-red-600 dark:text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <Button
              onClick={() => fazer_logout()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={18} />
              Sair
            </Button>
          </div>
        </div>

        {/* Aviso de Desconexão */}
        {!isConnected && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">
              ⚠️ Sem conexão com o servidor. Chama o proprietário.
            </p>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2">
          {[
            { id: 'nova-compra', label: 'Nova Compra' },
            { id: 'novo-cliente', label: 'Novo Cliente' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id as AbaType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                aba === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das Abas */}
        <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 space-y-4">
          {aba === 'nova-compra' ? (
            <>
              <h2 className="text-xl font-semibold text-foreground">Registrar Compra</h2>

              {/* Seleção de Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cliente</label>
                <Input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="bg-background border-border"
                />

                {busca && clientesFiltrados.length > 0 ? (
                  <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                    {clientesFiltrados.map((cliente) => (
                      <button
                        key={cliente.id}
                        onClick={() => {
                          setClienteSelecionado(cliente.id);
                          setBusca('');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      >
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        {cliente.email && (
                          <p className="text-xs text-muted-foreground">{cliente.email}</p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : busca ? (
                  <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                ) : null}

                {clienteSelecionado && (
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      ✓ Cliente selecionado: {clientes.find((c) => c.id === clienteSelecionado)?.nome}
                    </p>
                  </div>
                )}
              </div>

              {/* Seleção de Cardápio - Cliente */}
              {menus.length > 0 ? (
                <CardapioClienteView
                  menus={menus}
                  onSelectionChange={(items, total) => {
                    // Se houver itens selecionados, usar o total
                    if (total > 0) {
                      setValor(total.toString());
                    }
                  }}
                />
              ) : (
                <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 p-4 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200">⚠️ Nenhum cardápio disponível</p>
                </div>
              )}

              {/* Valor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="bg-background border-border"
                  placeholder="0,00"
                />
              </div>

              {/* Botão Salvar */}
              <Button
                onClick={handleSalvarCompra}
                disabled={carregandoCompra || adicionarLancamento.isPending}
                className="w-full"
              >
                {carregandoCompra || adicionarLancamento.isPending ? 'Salvando...' : 'Salvar Compra'}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground">Novo Cliente</h2>

              {/* Nome */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome</label>
                <Input
                  type="text"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  placeholder="Nome do cliente"
                  className="bg-background border-border"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email (opcional)</label>
                <Input
                  type="email"
                  value={novoClienteEmail}
                  onChange={(e) => setNovoClienteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-background border-border"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Telefone (opcional)</label>
                <Input
                  type="tel"
                  value={novoClienteTelefone}
                  onChange={(e) => setNovoClienteTelefone(e.target.value)}
                  placeholder="11999999999"
                  className="bg-background border-border"
                />
              </div>

              {/* Botão Criar */}
              <Button
                onClick={handleCriarCliente}
                disabled={carregandoNovoCliente}
                className="w-full"
              >
                {carregandoNovoCliente ? 'Criando...' : 'Criar Cliente'}
              </Button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>{clientes.length}</strong> clientes cadastrados
          </p>
        </div>
      </div>
    </div>
  );
}
