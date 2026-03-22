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
  
  // Filtrar clientes por busca e remover teste1
  const clientesFiltrados = clientesSalvos.filter(c => 
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) &&
    c.nome.toLowerCase() !== 'teste1'
  );

  // Sincronizar dados ao abrir Conta Geral - AGORA TAMBÉM BUSCA DO BACKEND
  useEffect(() => {
    const sincronizarDados = async () => {
      try {
        console.log('🔄 Sincronizando dados em Conta Geral...');
        
        // Primeiro, sincronizar dados locais
        const resultado = await recuperarDadosAutomaticamente();
        console.log('✓ Sincronização local concluída:', resultado);
        
        // Depois, carregar clientes do backend
        try {
          const response = await fetch('/api/all-clients');
          if (response.ok) {
            const data = await response.json();
            console.log('✓ Clientes do backend carregados:', data.count);
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar clientes do backend:', error);
        }
      } catch (error) {
        console.error('Erro ao sincronizar:', error);
      }
    };

    sincronizarDados();
    // Polling desabilitado - carregamento único na montagem
  }, []);

  useEffect(() => {
    // Carregar clientes de múltiplas fontes (Backend API PRIMEIRO, depois localStorage como fallback)
    const carregarClientes = async () => {
      try {
        const clientesMap = new Map<string, any>();
        
        // PRIORIDADE 1: Carregar do Backend API (dados mais atualizados)
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
        
        // PRIORIDADE 2: Carregar clientes do /api/all-clients
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
        
        // PRIORIDADE 3: Carregar clientes salvos do localStorage (apenas como fallback)
        const salvos = localStorage.getItem('caderninho_clientes_salvos');
        if (salvos) {
          JSON.parse(salvos).forEach((c: any) => {
            if (!clientesMap.has(c.id)) {
              clientesMap.set(c.id, c);
            }
          });
        }

        // PRIORIDADE 4: Carregar clientes principais do localStorage
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

        // Carregar clientes do Backend API
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

        // Carregar usuários (clientes) da tabela users
        try {
          const response = await fetch('/api/users?tipo=cliente');
          if (response.ok) {
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
              data.data.forEach((u: any) => {
                if (!clientesMap.has(u.id)) {
                  clientesMap.set(u.id, {
                    id: u.id,
                    nome: u.name || u.nome,
                    telefone: u.telefone || ''
                  });
                }
              });
              console.log('✓ Usuários (clientes) do backend carregados:', data.data.length);
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro ao carregar usuários do backend:', error);
        }

        // Converter para array e ordenar
        const clientesOrdenados = Array.from(clientesMap.values()).sort((a, b) => 
          a.nome.localeCompare(b.nome)
        );
        
        setClientesSalvos(clientesOrdenados);
        console.log('Clientes carregados (localStorage + IndexedDB + Backend):', clientesOrdenados);
        
        // Se não houver clientes, tentar sincronizar novamente
        if (clientesOrdenados.length === 0) {
          console.warn('⚠️ Nenhum cliente encontrado, tentando sincronizar...');
          recuperarDadosAutomaticamente().then(() => {
            carregarClientes();
          });
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    };

    carregarClientes();
  }, []); // Carregamento único na montagem - sem dependências

  // Função para sincronizar manualmente
  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      console.log('🔄 Sincronizando dados manualmente...');
      const resultado = await recuperarDadosAutomaticamente();
      console.log('✓ Sincronização local concluída:', resultado);
      
      // Carregar clientes do backend
      const response = await fetch('/api/all-clients');
      if (response.ok) {
        const data = await response.json();
        console.log('✓ Clientes do backend sincronizados:', data.count);
        toast.success(`✓ Dados sincronizados! ${data.count} clientes encontrados.`);
      } else {
        toast.success(`✓ Dados sincronizados! ${resultado.clientes} clientes encontrados.`);
      }
      
      // Recarregar clientes
      window.location.reload();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSincronizando(false);
    }
  };

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
          // PRIMEIRO: Enviar para servidor
          const responseServidor = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: novoClienteEmail.trim(),
              nome: novoClienteNome.trim(),
              tipo: 'user', // cliente
              telefone: novoClienteTelefone || '',
              senha: novoClienteSenha,
            }),
          });

          if (!responseServidor.ok) {
            const errorData = await responseServidor.json();
            throw new Error(errorData.error || 'Erro ao criar usuário no servidor');
          }

          // DEPOIS: Salvar localmente como backup
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
          toast.error('Erro ao criar cliente: ' + (e instanceof Error ? e.message : 'Erro desconhecido'));
        }
      } else {
        toast.success('Cliente adicionado com sucesso!');
      }

      setNovoClienteNome('');
      setNovoClienteTelefone('');
      setNovoClienteEmail('');
      setNovoClienteSenha('');
      
      // Recarregar lista de clientes para mostrar novo cliente
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      setAba('nova-compra');
    } catch (error) {
      toast.error('Erro ao adicionar cliente');
    } finally {
      setCarregandoNovoCliente(false);
    }
  };

  const handleNovaCompra = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar conectividade
    if (!isOnline) {
      toast.error(getOfflineMessage());
      return;
    }

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
      const timestamp = obterTimestampBrasilia();
      
      // Salvar localmente primeiro
      await adicionarLancamento(clienteSelecionado, 'debito', parseFloat(valor), descricao.trim(), timestamp);
      
      // Sincronizar com servidor
      try {
        const response = await fetch('/api/lancamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: clienteSelecionado,
            tipo: 'debito',
            valor: Math.round(parseFloat(valor) * 100), // Converter para centavos
            descricao: descricao.trim(),
            data: timestamp,
          }),
        });

        if (response.ok) {
          toast.success('✓ Compra registrada e sincronizada!');
        } else {
          toast.warning('⚠️ Compra registrada localmente, mas não sincronizou');
        }
      } catch (syncError) {
        console.error('Erro ao sincronizar:', syncError);
        toast.warning('⚠️ Compra registrada localmente, mas não sincronizou');
      }
      
      setValor('');
      setDescricao('');
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
            <p className="text-muted-foreground mt-1">Registre compras e gerenciar clientes</p>
            <p className="text-xs text-muted-foreground mt-1">
              {clientesSalvos.length} cliente(s) disponível(is)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSincronizar}
              disabled={sincronizando}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw size={20} className={sincronizando ? 'animate-spin' : ''} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button
              onClick={fazer_logout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={20} />
              Sair
            </Button>
          </div>
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
          <form onSubmit={handleNovaCompra} className="space-y-4">            {/* Seleção de Cliente */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cliente ({clientesSalvos.length})
              </label>
              {clientesSalvos.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">⚠️ Nenhum cliente encontrado</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Clique em "Sincronizar" para carregar clientes salvos</p>
                </div>
              ) : (
                <>
                  <Input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    className="w-full mb-2"
                  />
                  
                  <select
                    value={clienteSelecionado}
                    onChange={(e) => setClienteSelecionado(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientesFiltrados.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Cardápio obrigatório */}

            {/* Data Fixa */}
            {/* Data de Registro - Ocultada mas gravada automaticamente com fuso Brasília */}
            {/* A data é gravada automaticamente ao registrar a compra */}
            {/* Não é exibida para não poluir o visual do formulário */}

            {/* Cardápio */}
            <CardapioSelectorSimples
              onItemsSelected={(items, total) => {
                setValor((total / 100).toFixed(2));
                setDescricao(items.map(i => i.name).join(', '));
              }}
              onCancel={() => {}}
            />

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
