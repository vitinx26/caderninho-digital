/**
 * CardapioAdminSelector.tsx - Seletor de cardápio para admin
 * 
 * Características:
 * - Apenas admin pode selecionar qual cardápio usar
 * - Mostra nome do cardápio
 * - Todos os itens expandidos com seleção de quantidade
 * - Cálculo automático do total
 */

import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface Menu {
  id: string;
  name: string;
  categories: MenuCategory[];
  is_active: number;
}

interface SelectedItem {
  item: MenuItem;
  quantity: number;
  subtotal: number;
}

interface CardapioAdminSelectorProps {
  menus: Menu[];
  onSelectionChange?: (items: SelectedItem[], total: number) => void;
}

export default function CardapioAdminSelector({ menus, onSelectionChange }: CardapioAdminSelectorProps) {
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id || '');
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);

  if (!selectedMenu) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          ℹ️ Nenhum cardápio disponível
        </p>
      </div>
    );
  }

  // Filtrar categorias por busca
  const filteredCategories = selectedMenu.categories
    ?.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0) || [];

  // Calcular total
  const total = Array.from(selectedItems.values()).reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  // Atualizar quantidade
  const updateQuantity = (itemId: string, quantity: number, item: MenuItem) => {
    const newItems = new Map(selectedItems);

    if (quantity <= 0) {
      newItems.delete(itemId);
    } else {
      newItems.set(itemId, {
        item,
        quantity,
        subtotal: quantity * item.price,
      });
    }

    setSelectedItems(newItems);

    // Notificar mudança
    if (onSelectionChange) {
      onSelectionChange(Array.from(newItems.values()), total);
    }
  };

  // Remover item
  const removeItem = (itemId: string) => {
    const newItems = new Map(selectedItems);
    newItems.delete(itemId);
    setSelectedItems(newItems);

    if (onSelectionChange) {
      onSelectionChange(Array.from(newItems.values()), total);
    }
  };

  return (
    <div className="space-y-4">
      {/* Seletor de Cardápio */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Selecionar Cardápio</label>
        <select
          value={selectedMenuId}
          onChange={(e) => {
            setSelectedMenuId(e.target.value);
            setSelectedItems(new Map());
            setSearchTerm('');
          }}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {menus.map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </select>
      </div>

      {/* Busca */}
      <div>
        <input
          type="text"
          placeholder="Buscar item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Categorias e Itens */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="space-y-2">
            {/* Nome da Categoria */}
            <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">
              {category.name}
            </h4>

            {/* Itens da Categoria */}
            <div className="space-y-2">
              {category.items.map((item) => {
                const selected = selectedItems.get(item.id);
                const quantity = selected?.quantity || 0;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Info do Item */}
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{item.name}</p>
                      <p className="text-primary font-semibold text-sm">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Seletor de Quantidade */}
                    {quantity === 0 ? (
                      <button
                        onClick={() => updateQuantity(item.id, 1, item)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                      >
                        Adicionar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, quantity - 1, item)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          <Minus size={18} className="text-foreground" />
                        </button>
                        <span className="w-8 text-center font-semibold text-foreground">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, quantity + 1, item)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          <Plus size={18} className="text-foreground" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Resumo de Seleção */}
      {selectedItems.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-foreground">Resumo da Seleção</h4>

          {/* Lista de Itens Selecionados */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Array.from(selectedItems.values()).map((selected) => (
              <div key={selected.item.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {selected.item.name} x{selected.quantity}
                </span>
                <span className="font-semibold text-foreground">
                  R$ {selected.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-primary/20 pt-3 flex items-center justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold text-primary">
              R$ {total.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Mensagem se nenhum resultado */}
      {filteredCategories.length === 0 && searchTerm && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Nenhum item encontrado para "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
