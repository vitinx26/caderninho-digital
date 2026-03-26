/**
 * CardapioSelectorSimples.tsx - Seletor de cardápio simplificado para Conta Geral
 * Interface clean para clientes selecionarem itens de consumo com quantidade
 * Carrega cardápios do servidor via API
 */

import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface SelectedItem extends MenuItem {
  quantity: number;
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
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
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
  }, []);

  const loadActiveMenu = async () => {
    try {
      setLoading(true);
      setError(null);

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
      
      // Se não há menus, criar estrutura padrão
      if (!data.menus || data.menus.length === 0) {
        setCategories([
          {
            id: 'bebidas',
            name: 'Bebidas',
            items: [
              { id: 'agua', name: 'Água', price: 2.00 },
              { id: 'refrigerante', name: 'Refrigerante', price: 5.00 },
              { id: 'cerveja', name: 'Cerveja', price: 8.00 },
            ],
          },
          {
            id: 'comidas',
            name: 'Comidas',
            items: [
              { id: 'pastel', name: 'Pastel', price: 8.00 },
              { id: 'coxinha', name: 'Coxinha', price: 6.00 },
              { id: 'sanduiche', name: 'Sanduíche', price: 12.00 },
            ],
          },
        ]);
        return;
      }

      // Processar cardápios retornados
      const processedCategories: MenuCategory[] = [];
      
      for (const menu of data.menus) {
        if (menu.is_active) {
          // Se o cardápio tem categories, usar
          if (Array.isArray(menu.categories) && menu.categories.length > 0) {
            const formattedCategories = menu.categories.map((cat: any) => ({
              id: cat.id || cat.name,
              name: cat.name,
              items: Array.isArray(cat.items) ? cat.items.map((item: any) => ({
                id: item.id || item.name,
                name: item.name,
                price: item.price || 0,
              })) : [],
            })).filter((cat: MenuCategory) => cat.items.length > 0);
            
            processedCategories.push(...formattedCategories);
          }
        }
      }

      if (processedCategories.length === 0) {
        setError('Nenhum cardápio ativo com itens encontrado');
      } else {
        setCategories(processedCategories);
      }
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
      setError('Erro ao carregar cardápio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item: MenuItem) => {
    const newItems = new Map(selectedItems);
    const existing = newItems.get(item.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      newItems.set(item.id, { ...item, quantity: 1 });
    }
    
    setSelectedItems(newItems);
  };

  const handleRemoveItem = (itemId: string) => {
    const newItems = new Map(selectedItems);
    const existing = newItems.get(itemId);
    
    if (existing) {
      if (existing.quantity > 1) {
        existing.quantity -= 1;
      } else {
        newItems.delete(itemId);
      }
    }
    
    setSelectedItems(newItems);
  };

  const calculateTotal = () => {
    let total = 0;
    selectedItems.forEach(item => {
      total += item.price * item.quantity;
    });
    return total;
  };

  const handleConfirm = () => {
    const items = Array.from(selectedItems.values());
    const total = calculateTotal();
    onItemsSelected(items, total);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Carregando cardápio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={loadActiveMenu}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div>
        <input
          type="text"
          placeholder="Buscar item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background"
        />
      </div>

      {/* Categorias */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum item encontrado</p>
        ) : (
          filteredCategories.map(category => (
            <div key={category.id}>
              <h3 className="font-semibold text-foreground mb-2">{category.name}</h3>
              <div className="space-y-2">
                {category.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">R$ {item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleAddItem(item)}
                      className="p-1 bg-primary text-primary-foreground rounded hover:opacity-80"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Itens Selecionados */}
      {selectedItems.size > 0 && (
        <div className="border-t border-border pt-4 space-y-2">
          <h3 className="font-semibold text-foreground">Selecionados</h3>
          {Array.from(selectedItems.values()).map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 bg-secondary rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 bg-red-600 text-white rounded hover:opacity-80"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleAddItem(item)}
                  className="p-1 bg-green-600 text-white rounded hover:opacity-80"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <p className="text-lg font-bold text-foreground">
              Total: R$ {calculateTotal().toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-80"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={selectedItems.size === 0}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-80 disabled:opacity-50"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
