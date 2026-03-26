/**
 * NovoLancamento - Tela para adicionar débito ou pagamento
 * Formulário rápido com teclado numérico
 * Design: Minimalismo Funcional com Tipografia Forte
 * 
 * ✅ MIGRADO PARA: React Query
 * - Sem CentralizedStoreContext
 * - Sincronização automática
 */

import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Wifi, WifiOff } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes, useMenus, useAdicionarLancamento } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CardapioAdminSelector from '@/components/CardapioAdminSelector';
import CardapioClienteView from '@/components/CardapioClienteView';
import { toast } from 'sonner';
import { obterTimestampBrasilia } from '@/lib/brasiliaTime';

interface NovoLancamentoProps {
  onVoltar?: () => void;
}

export default function NovoLancamento({ onVoltar: onVoltarProp }: NovoLancamentoProps) {
  const { voltar, clienteSelecionado } = useNavigation();
  const { usuarioLogado } = useAuth();

  // React Query hooks
  const clientesQuery = useClientes();
  const menusQuery = useMenus();
  const adicionarLancamento = useAdicionarLancamento();

  // Dados
  const clientes = clientesQuery.data || [];
  const menus = menusQuery.data || [];
  const isConnected = !clientesQuery.isError && !menusQuery.isError;

  // Se for cliente logado, usar seu próprio ID
  const isClienteLogado = usuarioLogado?.tipo === 'cliente';
  const clienteIdFixo = isClienteLogado ? Number(usuarioLogado?.id) : undefined;

  // Estado do formulário
  const [tipo, setTipo] = useState<'debito' | 'pagamento'>('debito');
  const [clienteId, setClienteId] = useState<number | null>(
    clienteIdFixo || (typeof clienteSelecionado === 'number' ? clienteSelecionado : null) || null
  );
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');

  const handleVoltar = () => {
    if (onVoltarProp) {
      onVoltarProp();
    } else {
      voltar();
    }
  };

  const handleSalvarLancamento = async () => {
    if (!clienteId || !valor || parseFloat(valor) <= 0) {
      toast.error('Selecione um cliente e informe um valor válido');
      return;
    }

    if (!isConnected) {
      toast.error('Sem conexão com o servidor');
      return;
    }

    setCarregando(true);
    try {
      const timestamp = obterTimestampBrasilia();
      
      await adicionarLancamento.mutateAsync({
        clienteId,
        tipo,
        valor: Math.round(parseFloat(valor) * 100), // Converter reais para centavos
        descricao: descricao || undefined,
      });

      toast.success(`✓ ${tipo === 'debito' ? 'Débito' : 'Pagamento'} registrado com sucesso!`);
      
      // Limpar formulário
      setClienteId(clienteIdFixo ?? null);
      setValor('');
      setDescricao('');
      
      // Voltar se não for cliente logado
      if (!isClienteLogado) {
        handleVoltar();
      }
    } catch (error) {
      console.error('Erro ao registrar lançamento:', error);
      toast.error('Erro ao registrar lançamento');
    } finally {
      setCarregando(false);
    }
  };

  // Removido - agora usando onSelectionChange dos componentes de cardápio

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleVoltar}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-foreground" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Novo Lançamento</h1>
              <p className="text-muted-foreground mt-1">Registre débito ou pagamento</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            {isConnected ? (
              <>
                <Wifi size={18} className="text-green-600" />
                <span className="text-sm font-medium text-green-600">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff size={18} className="text-red-600" />
                <span className="text-sm font-medium text-red-600">Desconectado</span>
              </>
            )}
          </div>
        </div>

        {/* Aviso de Desconexão */}
        {!isConnected && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-medium">
              ⚠️ Sem conexão com o servidor
            </p>
          </div>
        )}

        {/* Formulário */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Tipo de Lançamento */}
          <div className="flex gap-4">
            {[
              { id: 'debito', label: 'Débito (Consumo)', color: 'bg-red-100 text-red-700' },
              { id: 'pagamento', label: 'Pagamento', color: 'bg-green-100 text-green-700' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id as any)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  tipo === t.id
                    ? `${t.color} border-2 border-current`
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Seleção de Cliente */}
          {!isClienteLogado && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cliente</label>
              <select
                value={String(clienteId || '')}
                onChange={(e) => setClienteId(Number(e.target.value) || null)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((cliente: any) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cardápio */}
          {tipo === 'debito' && menus.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {isClienteLogado ? 'Itens Disponíveis' : 'Selecionar do Cardápio'}
              </label>
              {isClienteLogado ? (
                <CardapioClienteView
                  menus={menus}
                  onSelectionChange={(items, total) => {
                    if (total > 0) {
                      setValor(total.toString());
                      const descricao = items
                        .map((i) => `${i.item.name} x${i.quantity}`)
                        .join(', ');
                      setDescricao(descricao);
                    }
                  }}
                />
              ) : (
                <CardapioAdminSelector
                  menus={menus}
                  onSelectionChange={(items, total) => {
                    if (total > 0) {
                      setValor(total.toString());
                      const descricao = items
                        .map((i) => `${i.item.name} x${i.quantity}`)
                        .join(', ');
                      setDescricao(descricao);
                    }
                  }}
                />
              )}
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
              placeholder="0,00"
              className="bg-background border-border text-lg"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
            <Input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Bebidas, Comida..."
              className="bg-background border-border"
            />
          </div>

          {/* Botão Salvar */}
          <Button
            onClick={handleSalvarLancamento}
            disabled={carregando || adicionarLancamento.isPending || !isConnected}
            className="w-full"
            size="lg"
          >
            {carregando || adicionarLancamento.isPending ? 'Salvando...' : 'Salvar Lançamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}
