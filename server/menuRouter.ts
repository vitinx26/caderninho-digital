import express from 'express';
import { db } from './db-client';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

// @ts-ignore
import { menus, menuCategories, menuItems } from '../drizzle/schema.js';

const router = express.Router();

interface MenuItem {
  name: string;
  price: number;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

// Cardápio Adega
const cardapioAdegaData: MenuCategory[] = [
  {
    name: 'CERVEJA 350ML',
    items: [
      { name: 'Itaipava', price: 350 },
      { name: 'Skol', price: 400 },
      { name: 'Amstel', price: 450 },
      { name: 'Duplo Malte', price: 500 },
      { name: 'Heineken', price: 600 },
      { name: 'Budweiser ZERO', price: 600 },
    ],
  },
  {
    name: 'CERVEJA 269',
    items: [
      { name: 'Império', price: 350 },
      { name: 'Budweiser', price: 400 },
      { name: 'Original', price: 450 },
      { name: 'Spaten', price: 500 },
      { name: 'Heineken', price: 550 },
      { name: 'Heineken ZERO', price: 600 },
    ],
  },
  {
    name: 'LONGNECK',
    items: [{ name: 'Heineken long', price: 800 }],
  },
  {
    name: 'IPA',
    items: [
      { name: 'Patagônia', price: 1000 },
      { name: 'Baden', price: 1000 },
    ],
  },
  {
    name: 'DRINKS',
    items: [
      { name: 'Gin Flowers', price: 800 },
      { name: 'Skol BEATS', price: 800 },
      { name: '51 Ice', price: 900 },
      { name: 'Smirnoff Ice', price: 1000 },
      { name: 'Batida cx 400ml', price: 1000 },
      { name: 'Xeque Mate', price: 1300 },
    ],
  },
  {
    name: 'ENERGÉTICOS',
    items: [
      { name: 'Baly 2L', price: 1500 },
      { name: 'Vibe 2L', price: 1200 },
      { name: 'Baly lata', price: 1000 },
      { name: 'Mister Hemp', price: 1000 },
      { name: 'Redbull', price: 1200 },
      { name: 'Monster', price: 1300 },
    ],
  },
  {
    name: 'ÁGUA/SUCOS/ISOTÔNICOS',
    items: [
      { name: 'Água', price: 300 },
      { name: 'Natural One', price: 2500 },
      { name: 'Del Valle lata', price: 700 },
      { name: 'Del Valle 1L', price: 1200 },
      { name: 'Power ADE', price: 800 },
      { name: 'Guaraviton', price: 600 },
    ],
  },
  {
    name: 'REFRIGERANTES',
    items: [
      { name: 'Lata', price: 500 },
      { name: 'Coca Cola 2L', price: 1400 },
      { name: 'Guaraná 2L', price: 1200 },
      { name: 'Fanta 2L', price: 1200 },
      { name: 'Sprite 2L', price: 1200 },
    ],
  },
  {
    name: 'CACHAÇAS',
    items: [
      { name: 'Corote', price: 500 },
      { name: 'Kariri com Mel (copinho)', price: 500 },
    ],
  },
  {
    name: 'SALGADINHOS',
    items: [
      { name: 'Torcida', price: 500 },
      { name: 'Fofura', price: 500 },
      { name: 'Amendoim', price: 400 },
    ],
  },
  {
    name: 'GELO',
    items: [
      { name: 'Sabor', price: 400 },
      { name: 'Saco 5kg', price: 1000 },
    ],
  },
  {
    name: 'GARRAFAS',
    items: [
      { name: 'Cabaré', price: 3500 },
      { name: 'São João', price: 2000 },
      { name: 'Chanceler', price: 3500 },
      { name: 'White Horse', price: 9000 },
      { name: 'Jim Beam', price: 10000 },
      { name: 'Jack Daniels', price: 15000 },
      { name: 'Grey Goose', price: 15000 },
      { name: 'Smirnoff', price: 4500 },
      { name: 'Eternity', price: 3000 },
      { name: 'Tangerina', price: 2000 },
    ],
  },
  {
    name: 'DOSES',
    items: [
      { name: 'ETERNITY', price: 1200 },
      { name: 'ETERNITY REDBULL', price: 2000 },
      { name: 'BEEFEATHER REDBULL', price: 3500 },
      { name: 'SMIRNOFF BALY / SUCO', price: 2500 },
      { name: 'SMIRNOFF REDBULL', price: 3000 },
      { name: 'CHANCELER', price: 1200 },
      { name: 'WHITER HORSE BALY', price: 2500 },
      { name: 'WHITER HORSE REDBULL', price: 3000 },
      { name: 'JIM BEAM BALY', price: 3500 },
      { name: 'JIM BEAM REDBULL', price: 4000 },
      { name: 'JACK DANIELS REDBULL', price: 4500 },
    ],
  },
];

// Cardápio After
const cardapioAfterData: MenuCategory[] = [
  {
    name: 'CERVEJA 350ML',
    items: [
      { name: 'Itaipava', price: 450 },
      { name: 'Skol', price: 500 },
      { name: 'Amstel', price: 600 },
      { name: 'Duplo Malte', price: 600 },
      { name: 'Heineken', price: 700 },
      { name: 'Budweiser ZERO', price: 700 },
    ],
  },
  {
    name: 'CERVEJA 269',
    items: [
      { name: 'Império', price: 400 },
      { name: 'Budweiser', price: 500 },
      { name: 'Original', price: 550 },
      { name: 'Spaten', price: 600 },
      { name: 'Heineken', price: 600 },
      { name: 'Heineken ZERO', price: 600 },
    ],
  },
  {
    name: 'LONGNECK',
    items: [
      { name: 'Heineken long', price: 900 },
      { name: 'Corona', price: 1000 },
    ],
  },
  {
    name: 'IPA',
    items: [
      { name: 'Patagônia', price: 1000 },
      { name: 'Baden', price: 1000 },
    ],
  },
  {
    name: 'DRINKS',
    items: [
      { name: 'Gin Flowers', price: 800 },
      { name: 'Skol BEATS', price: 800 },
      { name: '51 Ice', price: 900 },
      { name: 'Smirnoff Ice', price: 1000 },
      { name: 'Batida cx 400ml', price: 1200 },
      { name: 'Xeque Mate', price: 1500 },
    ],
  },
  {
    name: 'ENERGÉTICOS',
    items: [
      { name: 'Baly 2L', price: 1800 },
      { name: 'Vibe 2L', price: 1500 },
      { name: 'Baly lata', price: 1000 },
      { name: 'Mister Hemp', price: 1000 },
      { name: 'Redbull', price: 1300 },
      { name: 'Monster', price: 1400 },
    ],
  },
  {
    name: 'ÁGUA/SUCOS/ISOTÔNICOS',
    items: [
      { name: 'Água', price: 500 },
      { name: 'Natural One', price: 2500 },
      { name: 'Del Valle lata', price: 800 },
      { name: 'Power ADE', price: 800 },
      { name: 'Guaraviton', price: 600 },
    ],
  },
  {
    name: 'REFRIGERANTES',
    items: [
      { name: 'Lata', price: 600 },
      { name: 'Coca Cola 2L', price: 1500 },
      { name: 'Guaraná 2L', price: 1300 },
      { name: 'Fanta 2L', price: 1300 },
      { name: 'Sprite 2L', price: 1300 },
    ],
  },
  {
    name: 'CACHAÇAS',
    items: [
      { name: 'Corote', price: 600 },
      { name: 'Kariri com Mel (copinho)', price: 600 },
    ],
  },
  {
    name: 'SALGADINHOS',
    items: [
      { name: 'Torcida', price: 500 },
      { name: 'Fofura', price: 500 },
      { name: 'Amendoim', price: 500 },
    ],
  },
  {
    name: 'GELO',
    items: [
      { name: 'Coco', price: 400 },
      { name: 'Saco 5kg', price: 1000 },
    ],
  },
  {
    name: 'GARRAFAS',
    items: [
      { name: 'Cabaré', price: 3500 },
      { name: 'São João', price: 2000 },
      { name: 'Chanceler', price: 3500 },
      { name: 'White Horse', price: 9000 },
      { name: 'Jim Beam', price: 10000 },
      { name: 'Jack Daniels', price: 15000 },
      { name: 'Grey Goose', price: 16000 },
      { name: 'Smirnoff', price: 5000 },
      { name: 'ETERNITY', price: 3200 },
      { name: 'Tangerina', price: 2000 },
    ],
  },
  {
    name: 'DOSES',
    items: [
      { name: 'ETERNITY', price: 1500 },
      { name: 'ETERNITY REDBULL', price: 2000 },
      { name: 'BEEFEATHER REDBULL', price: 3500 },
      { name: 'SMIRNOFF BALY / SUCO', price: 2500 },
      { name: 'SMIRNOFF REDBULL', price: 3000 },
      { name: 'CHANCELER', price: 1500 },
      { name: 'WHITER HORSE BALY', price: 2500 },
      { name: 'WHITER HORSE REDBULL', price: 3000 },
      { name: 'JIM BEAM BALY', price: 3500 },
      { name: 'JIM BEAM REDBULL', price: 4000 },
      { name: 'JACK DANIELS REDBULL', price: 4500 },
    ],
  },
];

// Endpoint para popular cardápios
router.post('/api/menus/seed', async (req, res) => {
  try {
    console.log('🌱 Iniciando população de cardápios...');

    const now = Date.now();

    // Verificar se cardápios já existem
    const existingMenus = await db.select().from(menus).limit(1);
    if (existingMenus.length > 0) {
      return res.json({ message: 'Cardápios já foram populados' });
    }

    // Criar Cardápio Adega
    const adegaMenuId = uuidv4();
    await db.insert(menus).values({
      id: adegaMenuId,
      name: 'Cardápio Adega',
      description: 'Cardápio padrão da Adega',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Criar categorias e itens do Cardápio Adega
    for (let idx = 0; idx < cardapioAdegaData.length; idx++) {
      const category = cardapioAdegaData[idx];
      const categoryId = uuidv4();
      await db.insert(menuCategories).values({
        id: categoryId,
        menuId: adegaMenuId,
        name: category.name,
        order: idx,
        createdAt: now as any,
      });

      for (let itemIdx = 0; itemIdx < category.items.length; itemIdx++) {
        const item = category.items[itemIdx];
        await db.insert(menuItems).values({
          id: uuidv4(),
          categoryId: categoryId,
          name: item.name,
          price: item.price,
          order: itemIdx,
          createdAt: now,
        });
      }
    }

    // Criar Cardápio After
    const afterMenuId = uuidv4();
    await db.insert(menus).values({
      id: afterMenuId,
      name: 'Cardápio After',
      description: 'Cardápio After Hours',
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });

    // Criar categorias e itens do Cardápio After
    for (let idx = 0; idx < cardapioAfterData.length; idx++) {
      const category = cardapioAfterData[idx];
      const categoryId = uuidv4();
      await db.insert(menuCategories).values({
        id: categoryId,
        menuId: afterMenuId,
        name: category.name,
        order: idx,
        createdAt: now as any,
      });

      for (let itemIdx = 0; itemIdx < category.items.length; itemIdx++) {
        const item = category.items[itemIdx];
        await db.insert(menuItems).values({
          id: uuidv4(),
          categoryId: categoryId,
          name: item.name,
          price: item.price,
          order: itemIdx,
          createdAt: now,
        });
      }
    }

    res.json({ message: '✅ Cardápios populados com sucesso!' });
  } catch (error) {
    console.error('❌ Erro ao popular cardápios:', error);
    res.status(500).json({ error: 'Erro ao popular cardápios' });
  }
});

// GET todos os cardápios com categorias e itens
router.get('/api/menus', async (req, res) => {
  try {
    console.log('[GET /api/menus] Iniciando...');
    const allMenus = await db.select().from(menus);
    console.log('[GET /api/menus] Cardapios encontrados:', allMenus.length);
    
    // Carregar categorias e itens para cada cardápio
    const menusWithCategories = await Promise.all(
      allMenus.map(async (menu: any) => {
        const categories = await db.select().from(menuCategories).where(eq(menuCategories.menuId, menu.id));
        
        const categoriesWithItems = await Promise.all(
          categories.map(async (cat: any) => {
            const items = await db.select().from(menuItems).where(eq(menuItems.categoryId, cat.id));
            return {
              id: cat.id,
              name: cat.name,
              items: items.map((item: any) => ({
                id: item.id,
                name: item.name,
                price: item.price,
              })),
            };
          })
        );

        return {
          id: menu.id,
          name: menu.name,
          description: menu.description,
          is_active: menu.isActive,
          categories: categoriesWithItems,
        };
      })
    );

    console.log('[GET /api/menus] Retornando', menusWithCategories.length, 'cardapios');
    res.json({ menus: menusWithCategories });
  } catch (error) {
    console.error('[GET /api/menus] Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar cardápios' });
  }
});

// GET cardápio ativo com categorias e itens
router.get('/api/menus/active', async (req, res) => {
  try {
    const activeMenu = await db.select().from(menus).where(eq(menus.isActive, true)).limit(1);
    
    if (!activeMenu || activeMenu.length === 0) {
      return res.json(null);
    }

    const menuId = activeMenu[0].id;
    const categories = await db.select().from(menuCategories).where(eq(menuCategories.menuId, menuId));
    
    const categoriesWithItems = await Promise.all(
      categories.map(async (cat: any) => {
        const items = await db.select().from(menuItems).where(eq(menuItems.categoryId, cat.id));
        return { ...cat, items };
      })
    );

    res.json({ ...activeMenu[0], categories: categoriesWithItems });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cardápio ativo' });
  }
});

// PUT - Ativar/desativar cardápio
router.put('/api/menus/:menuId/toggle', async (req, res) => {
  try {
    const { menuId } = req.params;

    // Desativar todos os cardápios
    await db.update(menus).set({ isActive: false });

    // Ativar o cardápio selecionado
    await db.update(menus).set({ isActive: true }).where(eq(menus.id, menuId));

    res.json({ message: '✅ Cardápio ativado com sucesso!' });
  } catch (error) {
    console.error('Erro ao ativar cardápio:', error);
    res.status(500).json({ error: 'Erro ao ativar cardápio' });
  }
});

// PUT - Atualizar preço de um item
router.put('/api/menus/items/:itemId/price', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { price } = req.body;

    if (!price || price < 0) {
      return res.status(400).json({ error: 'Preço inválido' });
    }

    await db.update(menuItems).set({ price }).where(eq(menuItems.id, itemId));

    res.json({ message: '✅ Preço atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar preço:', error);
    res.status(500).json({ error: 'Erro ao atualizar preço' });
  }
});

// PUT - Atualizar nome de um item
router.put('/api/menus/items/:itemId/name', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome inválido' });
    }

    await db.update(menuItems).set({ name: name.trim() }).where(eq(menuItems.id, itemId));

    res.json({ message: '✅ Nome atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar nome:', error);
    res.status(500).json({ error: 'Erro ao atualizar nome' });
  }
});

// POST - Adicionar novo item em uma categoria
router.post('/api/menus/categories/:categoryId/items', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, price } = req.body;

    if (!name || !name.trim() || !price || price < 0) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const itemId = uuidv4();
    await db.insert(menuItems).values({
      id: itemId,
      categoryId,
      name: name.trim(),
      price,
      order: 0,
      createdAt: Date.now(),
    });

    res.json({ id: itemId, name: name.trim(), price });
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    res.status(500).json({ error: 'Erro ao adicionar item' });
  }
});

// DELETE - Remover item
router.delete('/api/menus/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    await db.delete(menuItems).where(eq(menuItems.id, itemId));

    res.json({ message: '✅ Item removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover item:', error);
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

export default router;
