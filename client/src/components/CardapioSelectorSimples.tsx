/**
 * CardapioSelectorSimples.tsx - Seletor de cardápio simplificado para Conta Geral
 * Interface clean para clientes selecionarem itens de consumo
 * Carrega cardápios do servidor via API
 */

import { useState, useEffect } from 'react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  selected?: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface CardapioSelectorSimplesProps {
  onItemsSelected: (items: MenuItem[], total: number) => void;
  onCancel: () => void;
}

export default function CardapioSelectorSimples({
  onItemsSelected,
  onCancel,
}: CardapioSelectorSimplesProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar itens por busca
  const filteredCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  useEffect(() => {
    loadActiveMenu();
    // Polling removido - carregamento único na montagem
  }, []);

  const loadActiveMenu = async () => {
    try {
      setLoading(true);
      setError(null);

      // Sempre carregar do servidor (sem cache para sincronização em tempo real)
      const response = await fetch('/api/menus', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar cardápios: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.menus && data.menus.length > 0) {
        // Encontrar cardápio ativo
        const activeMenu = data.menus.find((m: any) => m.is_active);
        
        if (activeMenu && activeMenu.categories) {
          const formattedCategories = activeMenu.categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            items: cat.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
            })),
          }));
          setCategories(formattedCategories);
        } else {
          setError('Nenhum cardápio ativo encontrado');
        }
      } else {
        setError('Nenhum cardápio disponível');
      }
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
      setError('Erro ao carregar cardápio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (item: MenuItem) => {
    const isSelected = selectedItems.find(i => i.id === item.id);
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.price, 0);
  };

  const handleConfirm = () => {
    const total = calculateTotal();
    onItemsSelected(selectedItems, total);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando cardápio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
        <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
        <button
          onClick={loadActiveMenu}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-300 font-medium">Nenhum item disponível no cardápio</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campo de Busca */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categorias */}
      {filteredCategories.map(category => (
        <div key={category.id} className="p-4 bg-card rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-3">{category.name}</h3>
          
          <div className="space-y-2">
            {category.items.map(item => {
              const isSelected = selectedItems.find(i => i.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleItem(item)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                    <span className="font-medium text-left">{item.name}</span>
                  </div>
                  <span className="text-blue-600 font-bold">
                    R$ {(item.price / 100).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Resumo e Botões */}
      <div className="sticky bottom-0 p-4 bg-card rounded-lg border border-border space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total:</span>
          <span className="text-2xl font-bold text-blue-600">
            R$ {(calculateTotal() / 100).toFixed(2)}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
}
