/**
 * NovoLancamentoCardapio.tsx - Página de novo lançamento com cardápio integrado
 * 
 * Disponível para admin, cliente logado e conta geral
 * Interface clean sem calculadora
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useClientes } from '@/hooks/useDB';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import CardapioSelector, { MenuItem, MenuCategory } from '@/components/CardapioSelector';
import { toast } from 'sonner';
import * as db from '@/lib/db';
import { Lancamento } from '@/types';

export default function NovoLancamentoCardapio() {
  const { usuarioLogado, usuarioGeral } = useAuth();
  const isOnline = useOnlineStatus();
  const { clientes } = useClientes();

  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [categorias, setCategorias] = useState<MenuCategory[]>([]);
  const [carregandoCardapio, setCarregandoCardapio] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Verificar acesso
  const temAcesso = usuarioLogado || usuarioGeral;
  const isAdmin = usuarioLogado?.tipo === 'admin';

  // Carregar cardápio
  useEffect(() => {
    carregarCardapio();
  }, []);

    const carregarCardapio = async () => {
    try {
      setCarregandoCardapio(true);
      // TODO: Implementar API para carregar cardápio ativo
      // const response = await fetch('/api/menus/active');
      // const data = await response.json();

      // Mock data para teste
      const mockCategorias: MenuCategory[] = [
        {
          id: '1',
          nome: 'CERVEJA 350ML',
          items: [
            { id: '1-1', nome: 'Itaipava', valor: 350 },
            { id: '1-2', nome: 'Skol', valor: 400 },
            { id: '1-3', nome: 'Amstel', valor: 450 },
            { id: '1-4', nome: 'Duplo Malte', valor: 500 },
            { id: '1-5', nome: 'Heineken', valor: 600 },
            { id: '1-6', nome: 'Budweiser ZERO', valor: 600 },
          ],
        },
        {
          id: '2',
          nome: 'DRINKS',
          items: [
            { id: '2-1', nome: 'Gin Flowers', valor: 800 },
            { id: '2-2', nome: 'Skol BEATS', valor: 800 },
            { id: '2-3', nome: '51 Ice', valor: 900 },
            { id: '2-4', nome: 'Smirnoff Ice', valor: 1000 },
          ],
        },
        {
          id: '3',
          nome: 'ENERGÉTICOS',
          items: [
            { id: '3-1', nome: 'Baly 2L', valor: 1500 },
            { id: '3-2', nome: 'Vibe 2L', valor: 1200 },
            { id: '3-3', nome: 'Redbull', valor: 1200 },
            { id: '3-4', nome: 'Monster', valor: 1300 },
          ],
        },
      ];

      setCategorias(mockCategorias);
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
      toast.error('Erro ao carregar cardápio');
    } finally {
      setCarregandoCardapio(false);
    }
  };

  // Submeter novo lançamento
  const handleSubmit = async (itens: MenuItem[], total: number) => {
    if (!temAcesso) {
      toast.error('Acesso negado');
      return;
    }

    if (!isOnline) {
      toast.error('Chama o proprietário');
      return;
    }

    // Validar cliente
    let clienteId = clienteSelecionado;
    if (!clienteId) {
      if (isAdmin) {
        toast.error('Selecione um cliente');
        return;
      }
      // Para cliente logado, usar seu próprio ID
      if (usuarioLogado?.tipo === 'cliente') {
        clienteId = usuarioLogado.id;
      }
    }

    if (!clienteId) {
      toast.error('Cliente não identificado');
      return;
    }

    try {
      setEnviando(true);

      // Criar descrição com itens selecionados
      const descricao = itens
        .map(item => `${item.nome} × ${(item as any).quantidade || 1}`)
        .join(', ');



      // Registrar no banco de dados local
      const lancamento: Lancamento = {
        id: crypto.randomUUID(),
        clienteId,
        tipo: 'debito',
        valor: total,
        descricao,
        data: Date.now(),
        dataCriacao: Date.now(),
      };
      await db.adicionarLancamento(lancamento);

      toast.success('Consumo registrado com sucesso!');
      setClienteSelecionado('');
    } catch (error) {
      console.error('Erro ao registrar lançamento:', error);
      toast.error('Erro ao registrar consumo');
    } finally {
      setEnviando(false);
    }
  };

  if (!temAcesso) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Você precisa estar logado ou acessar via Conta Geral para registrar consumo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Novo Consumo</h1>
        <p className="text-muted-foreground">
          Selecione os itens do cardápio para registrar um novo consumo
        </p>
      </div>

      {/* Status de conectividade */}
      {!isOnline && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Você está offline. Chama o proprietário para registrar consumo.
          </AlertDescription>
        </Alert>
      )}

      {isOnline && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Conectado e pronto para registrar consumo
          </AlertDescription>
        </Alert>
      )}

      {/* Seleção de cliente (apenas para admin) */}
      {isAdmin && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Selecione o Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(cliente => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Cardápio */}
      <Card>
        <CardHeader>
          <CardTitle>Cardápio</CardTitle>
          <CardDescription>
            Selecione os itens que deseja registrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CardapioSelector
            categorias={categorias}
            carregando={carregandoCardapio}
            onSubmit={handleSubmit}
            submitLabel={enviando ? 'Registrando...' : 'Registrar Consumo'}
            permitirMultiplos={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
