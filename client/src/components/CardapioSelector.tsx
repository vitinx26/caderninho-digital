/**
 * CardapioSelector.tsx - Componente de seleção de itens do cardápio
 * 
 * Interface clean para seleção de itens com checkboxes (flags)
 * Sem calculadora - apenas seleção e valor total
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface MenuItem {
  id: string;
  nome: string;
  valor: number; // em centavos
  descricao?: string;
}

export interface MenuCategory {
  id: string;
  nome: string;
  items: MenuItem[];
}

export interface CardapioSelectorProps {
  categorias: MenuCategory[];
  carregando?: boolean;
  onSubmit: (itens: MenuItem[], total: number) => void;
  submitLabel?: string;
  permitirMultiplos?: boolean; // Permitir selecionar múltiplos itens
}

interface SelectedItem extends MenuItem {
  quantidade: number;
}

export default function CardapioSelector({
  categorias,
  carregando = false,
  onSubmit,
  submitLabel = 'Registrar Consumo',
  permitirMultiplos = true,
}: CardapioSelectorProps) {
  const [selecionados, setSelecionados] = useState<Map<string, SelectedItem>>(new Map());
  const [enviando, setEnviando] = useState(false);

  // Calcular total
  const total = Array.from(selecionados.values()).reduce(
    (sum, item) => sum + item.valor * item.quantidade,
    0
  );

  // Alternar seleção de item
  const toggleItem = (item: MenuItem) => {
    const novosSelecionados = new Map(selecionados);

    if (novosSelecionados.has(item.id)) {
      novosSelecionados.delete(item.id);
    } else {
      if (!permitirMultiplos && novosSelecionados.size > 0) {
        novosSelecionados.clear();
      }
      novosSelecionados.set(item.id, { ...item, quantidade: 1 });
    }

    setSelecionados(novosSelecionados);
  };

  // Aumentar quantidade
  const aumentarQuantidade = (itemId: string) => {
    const novosSelecionados = new Map(selecionados);
    const item = novosSelecionados.get(itemId);
    if (item) {
      item.quantidade += 1;
      setSelecionados(novosSelecionados);
    }
  };

  // Diminuir quantidade
  const diminuirQuantidade = (itemId: string) => {
    const novosSelecionados = new Map(selecionados);
    const item = novosSelecionados.get(itemId);
    if (item) {
      if (item.quantidade > 1) {
        item.quantidade -= 1;
      } else {
        novosSelecionados.delete(itemId);
      }
      setSelecionados(novosSelecionados);
    }
  };

  // Submeter
  const handleSubmit = async () => {
    if (selecionados.size === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    try {
      setEnviando(true);
      const itens = Array.from(selecionados.values());
      await onSubmit(itens, total);
      setSelecionados(new Map());
    } catch (error) {
      console.error('Erro ao submeter:', error);
      toast.error('Erro ao registrar consumo');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando cardápio...</p>
      </div>
    );
  }

  if (categorias.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={20} />
            <p className="text-sm text-yellow-800">
              Nenhum cardápio disponível. Entre em contato com o administrador.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs de categorias */}
      <Tabs defaultValue={categorias[0]?.id} className="w-full">
        <TabsList className="grid w-full gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 h-auto p-2">
          {categorias.map(categoria => (
            <TabsTrigger
              key={categoria.id}
              value={categoria.id}
              className="text-xs sm:text-sm truncate"
            >
              {categoria.nome.replace(/\*/g, '')}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Conteúdo de cada categoria */}
        {categorias.map(categoria => (
          <TabsContent key={categoria.id} value={categoria.id} className="space-y-3">
            {categoria.items.map(item => {
              const isSelected = selecionados.has(item.id);
              const selectedItem = selecionados.get(item.id);

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleItem(item)}
                    className="h-5 w-5"
                  />

                  {/* Info do item */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.nome}</p>
                    {item.descricao && (
                      <p className="text-xs text-muted-foreground truncate">{item.descricao}</p>
                    )}
                  </div>

                  {/* Valor */}
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      R$ {(item.valor / 100).toFixed(2)}
                    </p>
                  </div>

                  {/* Controle de quantidade */}
                  {isSelected && (
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => diminuirQuantidade(item.id)}
                        className="h-7 w-7 p-0"
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {selectedItem?.quantidade}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => aumentarQuantidade(item.id)}
                        className="h-7 w-7 p-0"
                      >
                        +
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Resumo de seleção */}
      {selecionados.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart size={18} />
                Resumo da Seleção
              </span>
              <Badge className="bg-blue-600">{selecionados.size} item(ns)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Lista de itens selecionados */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Array.from(selecionados.values()).map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {item.nome} × {item.quantidade}
                  </span>
                  <span className="font-medium">
                    R$ {((item.valor * item.quantidade) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Divisor */}
            <div className="border-t border-blue-200 pt-3 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-blue-600">
                R$ {(total / 100).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de submissão */}
      <Button
        onClick={handleSubmit}
        disabled={selecionados.size === 0 || enviando}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {enviando ? 'Registrando...' : submitLabel}
      </Button>

      {/* Mensagem se nenhum item selecionado */}
      {selecionados.size === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Selecione itens do cardápio para registrar consumo
        </p>
      )}
    </div>
  );
}
