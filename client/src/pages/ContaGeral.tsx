/**
 * ContaGeral - Registro rápido de compras sem login
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Save, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useLancamentos } from '@/hooks/useDB';
import { useOnlineStatus, getOfflineMessage } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as db from '@/lib/db';
import { salvarSenhaSegura } from '@/lib/passwordPersistence';
import { obterTimestampBrasilia, formatarDataBrasilia } from '@/lib/brasiliaTime';
import { recuperarDadosAutomaticamente } from '@/lib/autoRecovery';
import OnlineStatusIndicator from '@/components/OnlineStatusIndicator';
import CardapioSelectorSimples from '@/components/CardapioSelectorSimples';

type AbaType = 'novo-cliente' | 'nova-compra';

export default function ContaGeral() {
  const { fazer_logout, usuarioLogado } = useAuth();
  const { clientes, adicionarCliente } = useClientes();
  const { lancamentos, adicionarLancamento } = useLancamentos();
  const { isOnline } = useOnlineStatus();

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
  const [dataBrasilia] = useState(() => formatarDataBrasilia(new Date()));
  const [usarCardapio, setUsarCardapio] = useState(false);

  // Clientes salvos (para seleção rápida)
  const [clientesSalvos, setClientesSalvos] = useState<Array<{ id: string; nome: string; telefone?: string }>>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');
  
  // Filtrar clientes por busca
  const clientesFiltrados = clientesSalvos.filter(c => 
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  // Carregar clientes apenas uma vez na montagem
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        const clientesMap = new Map<string, any>();
        
        // Carregar usuários (clientes) da tabela users
        try {
          const response = await fetch('/api/users?tipo=cliente');
          if (response.ok) {
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
              data.data.forEach((u: any) => {
                clientesMap.set(u.id, {
                  id: u.id,
                  nome: u.name || u.nome,
                  telefone: u.telefone || ''
                });
              });
              console.log('✓ Usuários (clientes) do backend carregados:', data.data.length);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar usuários do backend:', error);
        }
        
        // Carregar clientes do /api/all-clients
        try {
          const response = await fetch('/api/all-clients');
          if (response.ok) {
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
              data.data.forEach((c: any) => {
                if (!clientesMap.has(c.id)) {
                  clientesMap.set(c.id, {
                    id: c.id,
                    nome: c.nome,
                    telefone: c.telefone
                  });
                }
              });
              console.log('✓ Clientes do backend carregados:', data.count);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar clientes do backend:', error);
        }
        
        // Converter para array e ordenar
        const clientesOrdenados = Array.from(clientesMap.values()).sort((a, b) => 
          a.nome.localeCompare(b.nome)
        );
        
        setClientesSalvos(clientesOrdenados);
        console.log('Clientes carregados:', clientesOrdenados.length);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    };

    carregarClientes();
  }, []);

  // Função para sincronizar manualmente
  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      console.log('🔄 Sincronizando dados manualmente...');
      const resultado = await recuperarDadosAutomaticamente();
      console.log('✓ Sincronização local concluída:', resultado);
      
      // Recarregar clientes do backend
      const clientesMap = new Map<string, any>();
      
      try {
        const response = await fetch('/api/users?tipo=cliente');
        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            data.data.forEach((u: any) => {
              clientesMap.set(u.id, {
                id: u.id,
                nome: u.name || u.nome,
                telefone: u.telefone || ''
              });
            });
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar usuários:', error);
      }

      try {
        const response = await fetch('/api/all-clients');
        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            data.data.forEach((c: any) => {
              if (!clientesMap.has(c.id)) {
                clientesMap.set(c.id, {
                  id: c.id,
                  nome: c.nome,
                  telefone: c.telefone
                });
              }
            });
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar clientes:', error);
      }

      const clientesOrdenados = Array.from(clientesMap.values()).sort((a, b) => 
        a.nome.localeCompare(b.nome)
      );
      
      setClientesSalvos(clientesOrdenados);
      toast.success('Dados sincronizados com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSincronizando(false);
    }
  };

  const handleAdicionarNovoCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novoClienteNome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!novoClienteEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (!novoClienteSenha.trim()) {
      toast.error('Senha é obrigatória');
      return;
    }

    if (novoClienteSenha.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setCarregandoNovoCliente(true);

      // Criar usuário via API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: novoClienteEmail.trim(),
          nome: novoClienteNome.trim(),
          tipo: 'cliente',
          telefone: novoClienteTelefone || '',
          senha: novoClienteSenha,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar usuário');
      }

      const usuarioNovo = await response.json();
      
      // Adicionar à lista local
      const novoCliente = {
        id: usuarioNovo.data.id,
        nome: usuarioNovo.data.name,
        telefone: novoClienteTelefone || ''
      };
      
      setClientesSalvos([...clientesSalvos, novoCliente].sort((a, b) => 
        a.nome.localeCompare(b.nome)
      ));

      // Limpar formulário
      setNovoClienteNome('');
      setNovoClienteEmail('');
      setNovoClienteSenha('');
      setNovoClienteTelefone('');
      setAba('nova-compra');

      toast.success('Cliente criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar cliente');
    } finally {
      setCarregandoNovoCliente(false);
    }
  };

  const handleAdicionarNovaCompra = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteSelecionado) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!valor.trim()) {
      toast.error('Valor é obrigatório');
      return;
    }

    if (!descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    try {
      setCarregandoCompra(true);

      // Salvar localmente
      await adicionarLancamento(
        clienteSelecionado,
        'debito',
        parseFloat(valor),
        descricao.trim()
      );

      // Limpar formulário
      setClienteSelecionado('');
      setValor('');
      setDescricao('');

      toast.success('Compra registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar compra:', error);
      toast.error('Erro ao registrar compra');
    } finally {
      setCarregandoCompra(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Caderninho</h1>
          <OnlineStatusIndicator />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSincronizar}
            disabled={sincronizando}
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fazer_logout}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="bg-card border-b border-border p-4 flex gap-4">
        <button
          onClick={() => setAba('nova-compra')}
          className={`px-4 py-2 rounded font-medium transition ${
            aba === 'nova-compra'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-foreground hover:bg-accent'
          }`}
        >
          Nova Compra
        </button>
        <button
          onClick={() => setAba('novo-cliente')}
          className={`px-4 py-2 rounded font-medium transition ${
            aba === 'novo-cliente'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-foreground hover:bg-accent'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Conteúdo */}
      <div className="p-6 max-w-2xl mx-auto">
        {aba === 'nova-compra' && (
          <form onSubmit={handleAdicionarNovaCompra} className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Registrar Compra</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Cliente</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground"
                />
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded">
                {clientesFiltrados.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => {
                      setClienteSelecionado(cliente.id);
                      setBuscaCliente('');
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-accent transition ${
                      clienteSelecionado === cliente.id ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    <div className="font-medium">{cliente.nome}</div>
                    {cliente.telefone && (
                      <div className="text-sm text-muted-foreground">{cliente.telefone}</div>
                    )}
                  </button>
                ))}
              </div>
              {clienteSelecionado && (
                <div className="mt-2 p-2 bg-accent rounded">
                  Cliente selecionado: <strong>{clientesSalvos.find(c => c.id === clienteSelecionado)?.nome}</strong>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                placeholder="Descrição da compra..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={carregandoCompra}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {carregandoCompra ? 'Registrando...' : 'Registrar Compra'}
            </Button>
          </form>
        )}

        {aba === 'novo-cliente' && (
          <form onSubmit={handleAdicionarNovoCliente} className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Novo Cliente</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <Input
                type="text"
                placeholder="Nome completo"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={novoClienteEmail}
                onChange={(e) => setNovoClienteEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={novoClienteTelefone}
                onChange={(e) => setNovoClienteTelefone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Senha</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={novoClienteSenha}
                onChange={(e) => setNovoClienteSenha(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={carregandoNovoCliente}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {carregandoNovoCliente ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
