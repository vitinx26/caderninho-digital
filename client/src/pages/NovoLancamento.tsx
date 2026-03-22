/**
 * NovoLancamento - Tela para adicionar débito ou pagamento
 * Formulário rápido com teclado numérico
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, MessageCircle } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLancamentos } from '@/hooks/useDB';
import { useServerClientes } from '@/hooks/useServerClientes';
import { useConsumptionPopup } from '@/hooks/useConsumptionPopup';
import { useOnlineStatus, getOfflineMessage } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConsumptionPopup from '@/components/ConsumptionPopup';
import OnlineStatusIndicator from '@/components/OnlineStatusIndicator';
import CardapioSelectorSimples from '@/components/CardapioSelectorSimples';
import { toast } from 'sonner';
import { gerarMensagemWhatsApp, gerarUrlWhatsApp } from '@/lib/whatsappTemplate';
import { obterTimestampBrasilia, formatarDataBrasilia } from '@/lib/brasiliaTime';

interface NovoLancamentoProps {
  onVoltar?: () => void;
}

export default function NovoLancamento({ onVoltar: onVoltarProp }: NovoLancamentoProps) {
  const { voltar, clienteSelecionado } = useNavigation();
  const { usuarioLogado } = useAuth();
  const { clientes } = useServerClientes();
  const { adicionarLancamento } = useLancamentos();
  const { isOnline } = useOnlineStatus();

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
  const [carregando, setCarregando] = useState(false);
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  // Abrir cardapio por padrao para usuarios logados (admin ou cliente)
  const [usarCardapio, setUsarCardapio] = useState(!!usuarioLogado);
  const consumptionPopup = useConsumptionPopup();

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

    // Validar conectividade
    if (!isOnline) {
      toast.error(getOfflineMessage());
      return;
    }

    if (!valor || parseFloat(valor) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    // Descrição é gerada automaticamente do cardápio ou padrão

    try {
      setCarregando(true);

      let id = clienteId || clienteIdFixo;

      // Se for novo cliente, criar primeiro via servidor
      if (mostrarNovoCliente && novoClienteNome.trim()) {
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome: novoClienteNome.trim(),
              email: `${novoClienteNome.trim().toLowerCase().replace(/\s+/g, '.')}@clientes.local`,
              tipo: 'user',
              telefone: '',
            }),
          });
          if (response.ok) {
            const data = await response.json();
            id = data.id;
          }
        } catch (error) {
          console.error('Erro ao criar cliente:', error);
        }
      }

      if (!id) {
        toast.error('Selecione ou crie um cliente');
        return;
      }

      // Registrar lançamento localmente
      await adicionarLancamento(id, tipo, parseFloat(valor), descricao.trim(), obterTimestampBrasilia());

      // DEBUG: Logs detalhados
      console.log('🔍 DEBUG - Verificando sincronização:');
      console.log('  usuarioLogado:', usuarioLogado);
      console.log('  usuarioLogado?.tipo:', usuarioLogado?.tipo);
      console.log('  Condição (usuarioLogado && usuarioLogado.tipo === "cliente"):', usuarioLogado && usuarioLogado.tipo === 'cliente');

      // Sincronizar com servidor se usuário está logado (admin ou cliente)
      if (usuarioLogado && (usuarioLogado.tipo === 'cliente' || usuarioLogado.tipo === 'admin')) {
        try {
          console.log('📤 Sincronizando lançamento com servidor...');
          const response = await fetch('/api/lancamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clienteId: clienteIdFixo || clienteSelecionado,
              tipo,
              valor: Math.round(parseFloat(valor) * 100),
              descricao: descricao.trim(),
              data: obterTimestampBrasilia(),
              adminId: usuarioLogado.id, // ✅ Enviar ID do admin autenticado
            }),
          });
          
          const resultado = await response.json();
          console.log('  Status:', response.status);
          console.log('  Resposta:', resultado);
          if (resultado.success) {
            console.log('✅ Lançamento sincronizado com servidor');
            toast.success('✅ Lançamento registrado com sucesso');
          } else {
            console.warn('⚠️ Erro ao sincronizar:', resultado.error);
            toast.error('❌ ' + (resultado.error || 'Erro desconhecido'));
          }
        } catch (error) {
          console.error('❌ Erro ao sincronizar lançamento:', error);
          console.error('  Detalhes:', (error as any)?.message);
          console.error('  Stack:', (error as any)?.stack);
          toast.error('❌ Erro ao sincronizar com servidor. Tente novamente.');
        }
      }

      // Calcular consumo total e percentual de aumento
      const cliente = clientes.find((c: any) => c.id === id);
      if (cliente) {
    // Enviar notificação por email para admins
        if (usuarioLogado?.tipo === 'admin') {
          try {
            if (cliente) {
              console.log('📧 Enviando notificação para admins...');
              const response = await fetch('/api/notificacoes/novo-lancamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clienteId: id,
                  adminId: usuarioLogado.id,
                  tipo,
                  valor: Math.round(parseFloat(valor) * 100),
                  descricao: descricao.trim(),
                }),
              });
              
              const resultado = await response.json();
              if (resultado.success) {
                console.log('✓ Notificação enviada com sucesso');
                toast.success('📧 Notificação enviada para admins');
              } else {
                console.warn('⚠️ Erro ao enviar notificação:', resultado.message);
                toast.warning('⚠️ Notificação não pude ser enviada: ' + resultado.message);
              }
            }
          } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
            toast.error('Erro ao enviar notificação');
          }
        }
      }

      // Mostrar pop-up de consumo
      const clientePopup = clientes.find((c: any) => c.id === id);
      if (clientePopup) {
        const valorCentavos = Math.round(parseFloat(valor) * 100);
        const consumoAdicional = tipo === 'debito' ? valorCentavos : -valorCentavos;
        const totalNovo = Math.max(0, consumoAdicional);
        const percentualAumento = 0;

        consumptionPopup.showPopup({
          clienteName: clientePopup.nome,
          description: descricao.trim(),
          value: valorCentavos,
          totalConsumption: totalNovo,
          percentageIncrease: percentualAumento,
        });
      }

      setCarregando(false);
      setClienteId('');
      setValor('');
      setDescricao('');
      setMostrarNovoCliente(false);
      setNovoClienteNome('');
    } catch (error) {
      console.error('Erro ao registrar lançamento:', error);
      toast.error('Erro ao registrar lançamento');
    } finally {
      setCarregando(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    try {
      const cliente = clientes.find((c: any) => c.id === clienteId);
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
          data: obterTimestampBrasilia(),
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
      <ConsumptionPopup
        isOpen={consumptionPopup.isOpen}
        onClose={consumptionPopup.closePopup}
        clienteName={consumptionPopup.data?.clienteName || ''}
        description={consumptionPopup.data?.description || ''}
        value={consumptionPopup.data?.value || 0}
      />

      <div className="p-6 space-y-6 pb-24">
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

      {/* Modo: Cardápio ou Valor Manual */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setUsarCardapio(false)}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-colors ${
            !usarCardapio
              ? 'bg-blue-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Valor Manual
        </button>
        <button
          onClick={() => setUsarCardapio(true)}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-colors ${
            usarCardapio
              ? 'bg-blue-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Cardápio
        </button>
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

      {/* Valor ou Cardápio */}
      {usarCardapio ? (
        <CardapioSelectorSimples
          onItemsSelected={(items, total) => {
            setValor((total / 100).toFixed(2));
            setDescricao(items.map(i => i.name).join(', '));
          }}
          onCancel={() => setUsarCardapio(false)}
        />
      ) : (
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
      )}

      {/* Descrição gerada automaticamente do cardápio ou padrão */}

      {/* Data - Oculta mas gravada automaticamente com fuso Brasília */}
      {/* A data é gravada automaticamente ao registrar o lançamento */}
      {/* Não é exibida para não poluir o visual do formulário */}

      </div>

      {/* Botões Salvar e WhatsApp - Fixo na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex gap-3 z-50">
        <Button
        onClick={handleSubmit}
        disabled={carregando}
        className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
          {carregando ? 'Salvando...' : 'Registrar Lançamento'}
        </Button>
        {tipo === 'debito' && clienteId && valor && (
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
    </>
  );
}
