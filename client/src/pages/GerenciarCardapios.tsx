/**
 * GerenciarCardapios - Página para gerenciar cardápios
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus, X, Check } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  description: string;
  is_active: boolean;
  categories: MenuCategory[];
}

export default function GerenciarCardapios() {
  const { voltar } = useNavigation();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [carregando, setCarregando] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [editingName, setEditingName] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Carregar cardápios
  useEffect(() => {
    carregarCardapios();
  }, []);

  const carregarCardapios = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/menus');
      const data = await response.json();
      setMenus(data.menus || []);
      
      // Selecionar o cardápio ativo por padrão
      const activeMenu = data.menus?.find((m: Menu) => m.is_active);
      if (activeMenu) {
        setSelectedMenuId(activeMenu.id);
      } else if (data.menus && data.menus.length > 0) {
        setSelectedMenuId(data.menus[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar cardápios:', error);
      toast.error('Erro ao carregar cardápios');
    } finally {
      setCarregando(false);
    }
  };

  const handleToggleMenu = async (menuId: string) => {
    try {
      const response = await fetch(`/api/menus/${menuId}/toggle`, { method: 'PUT' });
      if (response.ok) {
        toast.success('Cardápio ativado com sucesso!');
        await carregarCardapios();
        setSelectedMenuId(menuId);
      } else {
        toast.error('Erro ao ativar cardápio');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao ativar cardápio');
    }
  };

  const handleUpdatePrice = async (itemId: string, newPrice: string) => {
    try {
      const priceValue = Math.round(parseFloat(newPrice) * 100);
      const response = await fetch(`/api/menus/items/${itemId}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: priceValue }),
      });

      if (response.ok) {
        toast.success('Preço atualizado!');
        setEditingItemId(null);
        await carregarCardapios();
      } else {
        toast.error('Erro ao atualizar preço');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar preço');
    }
  };

  const handleUpdateName = async (itemId: string, newName: string) => {
    try {
      const response = await fetch(`/api/menus/items/${itemId}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        toast.success('Nome atualizado!');
        setEditingItemId(null);
        await carregarCardapios();
      } else {
        toast.error('Erro ao atualizar nome');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar nome');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return;

    try {
      const response = await fetch(`/api/menus/items/${itemId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Item removido!');
        await carregarCardapios();
      } else {
        toast.error('Erro ao remover item');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao remover item');
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemPrice || !selectedCategoryId) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const priceValue = Math.round(parseFloat(newItemPrice) * 100);
      const response = await fetch(`/api/menus/categories/${selectedCategoryId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName, price: priceValue }),
      });

      if (response.ok) {
        toast.success('Item adicionado!');
        setNewItemName('');
        setNewItemPrice('');
        setShowAddItemModal(false);
        await carregarCardapios();
      } else {
        toast.error('Erro ao adicionar item');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao adicionar item');
    }
  };

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cardápios...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={voltar}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Cardápios</h1>
          <p className="text-muted-foreground">Edite preços e itens dos cardápios</p>
        </div>
      </div>

      {/* Seleção de Cardápio */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Cardápios Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => handleToggleMenu(menu.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                menu.is_active
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                  : 'border-border bg-background hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{menu.name}</p>
                  <p className="text-sm text-muted-foreground">{menu.description}</p>
                </div>
                {menu.is_active && (
                  <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                    Ativo
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Edição de Itens */}
      {selectedMenu && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Itens - {selectedMenu.name}
          </h2>

          {selectedMenu.categories.map((category) => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{category.name}</h3>
                <button
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setShowAddItemModal(true);
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Plus size={18} className="text-blue-600" />
                </button>
              </div>

              <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-background border border-border rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <div className="flex-1">
                      {editingItemId === `name-${item.id}` ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="mb-2"
                          placeholder="Nome do item"
                        />
                      ) : (
                        <p className="font-medium text-foreground">{item.name}</p>
                      )}

                      {editingItemId === `price-${item.id}` ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          placeholder="Preço"
                          className="w-20"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          R$ {(item.price / 100).toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {editingItemId === `name-${item.id}` ? (
                        <>
                          <button
                            onClick={() => handleUpdateName(item.id, editingName)}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                          >
                            <Check size={18} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          >
                            <X size={18} className="text-red-600" />
                          </button>
                        </>
                      ) : editingItemId === `price-${item.id}` ? (
                        <>
                          <button
                            onClick={() => handleUpdatePrice(item.id, editingPrice)}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                          >
                            <Check size={18} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          >
                            <X size={18} className="text-red-600" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingItemId(`name-${item.id}`);
                              setEditingName(item.name);
                            }}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingItemId(`price-${item.id}`);
                              setEditingPrice((item.price / 100).toFixed(2));
                            }}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-background rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Adicionar Item</h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={24} className="text-foreground" />
              </button>
            </div>

            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nome do item"
              className="w-full"
            />

            <Input
              type="number"
              step="0.01"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder="Preço (R$)"
              className="w-full"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 py-2 px-4 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
