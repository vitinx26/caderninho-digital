/**
 * CardapioSelectorSimples.tsx - Seletor de cardápio simplificado para Conta Geral
 * Interface clean para clientes selecionarem itens de consumo
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

  useEffect(() => {
    loadActiveMenu();
  }, []);

  const loadActiveMenu = async () => {
    try {
      setLoading(true);
      // Carregar cardápio ativo do localStorage
      const savedMenus = localStorage.getItem('menus');
      if (savedMenus) {
        const menus = JSON.parse(savedMenus);
        const activeMenu = menus.find((m: any) => m.is_active);
        
        if (activeMenu && activeMenu.categories) {
          setCategories(activeMenu.categories);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
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

  return (
    <div className="space-y-4">
      {/* Categorias */}
      {categories.map(category => (
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
