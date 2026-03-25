/**
 * ContaGeral - Registro rápido de compras sem login
 * Design: Minimalismo Funcional com Tipografia Forte
 * 
 * ✅ MIGRADO PARA: CentralizedStoreContext
 * - Sincronização em tempo real via WebSocket
 * - Novos lançamentos aparecem no Dashboard instantaneamente
 * - Clientes sincronizados de todos os administradores
 * - Sem localStorage (apenas servidor)
 */

import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Save, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useLancamentos, useConnectionStatus } from '@/contexts/CentralizedStoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { obterTimestampBrasilia } from '@/lib/brasiliaTime';
import OnlineStatusIndicator from '@/components/OnlineStatusIndicator';
import CardapioSelectorSimples from '@/components/CardapioSelectorSimples';

type AbaType = 'novo-cliente' | 'nova-compra';

function ContaGeralContent() {
  const { fazer_logout } = useAuth();
  
  // ✅ NOVO: Usar CentralizedStoreContext para sincronização em tempo real
  const { clientes, isConnected: isConnectedStore } = useClientes();
  const { lancamentos, adicionarLancamento } = useLancamentos();
  const { statusConexao } = useConnectionStatus();

  const [aba, setAba] = useState<AbaType>('nova-compra');

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
  const [carregandoCompra, setCarregandoCompra] = useState(false);

  // Busca de cliente
  const [buscaCliente, setBuscaCliente] = useState('');

  // Filtrar clientes por busca
  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  // ✅ REMOVIDO: Polling e sincronização manual
  // Agora a sincronização é automática via WebSocket

  // Criar novo cliente
  const handleCriarCliente = async () => {
    if (!novoClienteNome.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    if (!isConnectedStore) {
      toast.error('Sem conexão com o servidor. Chama o proprietário.');
      return;
    }

    setCarregandoNovoCliente(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: novoClienteNome,
          email: novoClienteEmail || `${novoClienteNome.toLowerCase().replace(/\s+/g, '')}@caderninho.local`,
          telefone: novoClienteTelefone,
          password: novoClienteSenha || 'senha123',
          tipo: 'cliente',
        }),
      });

      if (response.ok) {
        const novoCliente = await response.json();
        toast.success(`✓ Cliente "${novoClienteNome}" criado com sucesso!`);
        
        // ✅ Novo cliente aparece automaticamente no Dashboard via WebSocket
        
        // Limpar formulário
        setNovoClienteNome('');
        setNovoClienteTelefone('');
        setNovoClienteEmail('');
        setNovoClienteSenha('');
        setAba('nova-compra');
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

  // Adicionar nova compra
  const handleAdicionarCompra = async () => {
    if (!clienteSelecionado) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!valor || parseFloat(valor) <= 0) {
      toast.error('Valor deve ser maior que 0');
      return;
    }

    if (!isConnectedStore) {
      toast.error('Sem conexão com o servidor. Chama o proprietário.');
      return;
    }

    setCarregandoCompra(true);
    try {
      const timestamp = obterTimestampBrasilia();
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSelecionado,
          tipo: 'debito',
          valor: parseFloat(valor),
          descricao: descricao || 'Compra',
          timestamp,
        }),
      });

      if (response.ok) {
        toast.success(`✓ Compra de R$ ${parseFloat(valor).toFixed(2).replace('.', ',')} registrada!`);
        
        // ✅ Nova compra aparece automaticamente no Dashboard via WebSocket
        
        // Limpar formulário
        setClienteSelecionado('');
        setValor('');
        setDescricao('');
        setBuscaCliente('');
      } else {
        const erro = await response.json();
        toast.error(`Erro: ${erro.message || 'Falha ao registrar compra'}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar compra:', error);
      toast.error('Erro ao registrar compra');
    } finally {
      setCarregandoCompra(false);
    }
  };

  // Status de conexão - usar apenas isConnectedStore (SSE/Polling)
  const isConnected = isConnectedStore;
  const statusConexaoClass = isConnected
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

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
                <Wifi size={18} className={statusConexaoClass} />
              ) : (
                <WifiOff size={18} className={statusConexaoClass} />
              )}
              <span className={`text-sm font-medium ${statusConexaoClass}`}>
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
        <div className="card-minimal p-6 space-y-4">
          {aba === 'nova-compra' ? (
            <>
              <h2 className="text-xl font-semibold text-foreground">Registrar Compra</h2>

              {/* Seleção de Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cliente</label>
                <Input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  className="bg-background border-border"
                />

                {buscaCliente && clientesFiltrados.length > 0 ? (
                  <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                    {clientesFiltrados.map((cliente) => (
                      <button
                        key={cliente.id}
                        onClick={() => {
                          setClienteSelecionado(cliente.id);
                          setBuscaCliente('');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      >
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        {cliente.telefone && (
                          <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : buscaCliente ? (
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

              {/* Valor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Valor (R$)</label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  step="0.01"
                  min="0"
                  className="bg-background border-border"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
                <Input
                  type="text"
                  placeholder="Ex: Bebidas, Comida..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Cardápio - FIXADO */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Selecionar do Cardápio</label>
                <CardapioSelectorSimples
                  onItemsSelected={(items, total) => {
                    if (items.length > 0) {
                      const descricoes = items.map((i) => i.name).join(', ');
                      setDescricao(descricoes);
                      setValor(total.toString());
                    }
                  }}
                  onCancel={() => {}}
                />
              </div>

              {/* Botão Salvar */}
              <Button
                onClick={handleAdicionarCompra}
                disabled={carregandoCompra || !isConnected || !clienteSelecionado}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save size={20} />
                {carregandoCompra ? 'Salvando...' : 'Salvar Compra'}
              </Button>

              {/* Info de Sincronização */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                {isConnected
                  ? '✅ Sincronizando em tempo real'
                  : '⏸️ Aguardando conexão...'}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground">Criar Novo Cliente</h2>

              {/* Nome */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome *</label>
                <Input
                  type="text"
                  placeholder="Nome do cliente"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Telefone (opcional)</label>
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={novoClienteTelefone}
                  onChange={(e) => setNovoClienteTelefone(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email (opcional)</label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={novoClienteEmail}
                  onChange={(e) => setNovoClienteEmail(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Senha (opcional)</label>
                <Input
                  type="password"
                  placeholder="Deixe em branco para gerar automaticamente"
                  value={novoClienteSenha}
                  onChange={(e) => setNovoClienteSenha(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Botão Criar */}
              <Button
                onClick={handleCriarCliente}
                disabled={carregandoNovoCliente || !isConnected}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus size={20} />
                {carregandoNovoCliente ? 'Criando...' : 'Criar Cliente'}
              </Button>

              {/* Info de Sincronização */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                {isConnected
                  ? '✅ Novo cliente aparecerá no Dashboard instantaneamente'
                  : '⏸️ Aguardando conexão...'}
              </div>
            </>
          )}
        </div>

        {/* Clientes Disponíveis */}
        {aba === 'nova-compra' && !buscaCliente && (
          <div className="card-minimal p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Clientes Disponíveis</h2>
            {clientesFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clientesFiltrados.slice(0, 10).map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => {
                      setClienteSelecionado(cliente.id);
                      setBuscaCliente('');
                    }}
                    className="p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                  >
                    <p className="font-medium text-foreground">{cliente.nome}</p>
                    {cliente.telefone && (
                      <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum cliente disponível. Crie um novo cliente na aba "Novo Cliente".
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContaGeral() {
  return <ContaGeralContent />;
}
