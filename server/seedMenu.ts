/**
 * seedMenu.ts - Script para parsear e popular cardápio no banco de dados
 * 
 * Lê o cardápio do arquivo e cria as tabelas de menus, categorias e itens
 */

import { db } from './db-client';
import { menus, menuCategories, menuItems } from '../drizzle/schema';
import { v4 as uuid } from 'uuid';

// Cardápio em formato de texto
const cardapioTexto = `*CERVEJA 350ML*
Itaipava 3,50
Skol 4,00
Amstel 4,50
Duplo Malte 5,00
Heineken 6,00
Budweiser ZERO 6,00

*CERVEJA 269*
Império 3,50
Budweiser 4,00
Original 4,50 acima de 8 um 4,00 cada
Spaten 5,00
Heineken 5,50
Heineken ZERO 6,00

*LONGNECK*
Heineken long 8,00

*IPA*
Patagônia 10,00
Baden 10,00

*DRINKS*
Gin Flowers 8,00
Skol BEATS 8,00
51 Ice 9,00
Smirnoff Ice 10,00
Batida cx 400ml 10,00
Xeque Mate 13,00

*ENERGÉTICOS*
Baly 2L 15,00
Vibe 2L 12,00
Baly lata 10,00
Mister Hemp 10,00
Redbull 12,00
Monster 13,00

*AGUA/SUCOS/ ISOTÔNICOS*
Água 3,00
Natural One 25,00
Del Valle lata 7,00
Del Valle 1L 12,00
Power ADE 8,00
Guaraviton 6,00

*REFRIGERANTES*
LATA 5,00

2L
Coca Cola 14,00
Guaraná 12,00
Fanta 12,00
Sprite 12,00

*CACHAÇAS*
Corote 5,00
Kariri com Mel 5,00(copinho)

*SALGADINHOS*
Torcida 5,00
Fofura 5,00
Amendoim 4,00

*GELO*
Sabor 4,00
Saco 5kg 10,00

*GARRAFAS*
Cabaré 35,00
São João 20,00
Chanceler 35,00
White Horse 90,00
Jim Beam 100,00
Jack Daniels 150,00
Grey Goose 150,00
Smirnoff 45,00
Eternity 30,00
Tangerina 20,00

*DOSES*
ETERNITY 12,00
ETERNITY REDBULL 20,00
BEEFEATHER REDBULL 35,00
SMIRNOFF BALY / SUCO 25,00
SMIRNOFF REDBULL 30,00
CHANCELER 12,00
WHITER HORSE BALY 25,00
WHITER HORSE REDBULL 30,00
JIM BEAM BALY 35,00
JIM BEAM REDBULL 40,00
JACK DANIELS REDBULL 45,00`;

interface ParsedMenu {
  categories: {
    nome: string;
    items: {
      nome: string;
      valor: number;
      descricao?: string;
    }[];
  }[];
}

/**
 * Parsear cardápio de texto
 */
function parseCardapio(texto: string): ParsedMenu {
  const lines = texto.split('\n').map(line => line.trim()).filter(line => line);
  const categories: ParsedMenu['categories'] = [];
  let currentCategory: ParsedMenu['categories'][0] | null = null;

  for (const line of lines) {
    if (line.startsWith('*') && line.endsWith('*')) {
      // Categoria
      const categoryName = line.replace(/\*/g, '').trim();
      currentCategory = { nome: categoryName, items: [] };
      categories.push(currentCategory);
    } else if (currentCategory && line) {
      // Item da categoria
      // Formato: "Nome Valor" ou "Nome Valor descrição"
      const parts = line.split(' ');
      
      // Procurar pelo valor (último número com ponto/vírgula)
      let valorIndex = -1;
      let valor = 0;
      let descricao = '';

      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (/^\d+[,.]?\d*$/.test(part)) {
          valorIndex = i;
          // Converter valor (3,50 -> 350 centavos)
          const valorStr = part.replace(',', '.');
          valor = Math.round(parseFloat(valorStr) * 100);
          break;
        }
      }

      if (valorIndex > 0) {
        const nome = parts.slice(0, valorIndex).join(' ');
        if (valorIndex < parts.length - 1) {
          descricao = parts.slice(valorIndex + 1).join(' ');
        }

        currentCategory.items.push({
          nome,
          valor,
          descricao: descricao || undefined,
        });
      }
    }
  }

  return { categories };
}

/**
 * Popular banco de dados com cardápio
 */
export async function seedMenuDatabase(adminId: string) {
  try {
    console.log('🍽️ Iniciando seed do cardápio...');

    // Parsear cardápio
    const parsedMenu = parseCardapio(cardapioTexto);
    console.log(`📋 Cardápio parseado: ${parsedMenu.categories.length} categorias`);

    // Criar menu
    const menuId = uuid();
    const now = Date.now();

    await db.insert(menus).values({
      id: menuId,
      adminId,
      nome: 'Cardápio 1',
      ativo: true,
      dataCriacao: now,
      dataAtualizacao: now,
    });

    console.log('✅ Menu criado');

    // Criar categorias e itens
    let categoryOrder = 0;
    for (const category of parsedMenu.categories) {
      const categoryId = uuid();
      categoryOrder++;

      await db.insert(menuCategories).values({
        id: categoryId,
        menuId,
        nome: category.nome,
        ordem: categoryOrder,
        dataCriacao: now,
      });

      console.log(`📂 Categoria criada: ${category.nome}`);

      // Criar itens
      let itemOrder = 0;
      for (const item of category.items) {
        itemOrder++;

        await db.insert(menuItems).values({
          id: uuid(),
          categoryId,
          nome: item.nome,
          valor: item.valor,
          descricao: item.descricao,
          ordem: itemOrder,
          dataCriacao: now,
        });
      }

      console.log(`✅ ${category.items.length} itens adicionados`);
    }

    console.log('🎉 Cardápio populado com sucesso!');
    return menuId;
  } catch (error) {
    console.error('❌ Erro ao popular cardápio:', error);
    throw error;
  }
}

/**
 * Executar seed (se chamado diretamente)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const adminId = process.argv[2] || 'admin-default';
  seedMenuDatabase(adminId).catch(console.error);
}
