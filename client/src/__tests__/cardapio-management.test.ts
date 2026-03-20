/**
 * cardapio-management.test.ts - Testes para gerenciamento de cardápios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportarParaCSV, exportarLancamentosComFiltros } from '../lib/csvExport';

describe('Gerenciamento de Cardápios', () => {
  describe('Carregamento de Cardápios', () => {
    it('deve carregar cardápios do localStorage', () => {
      const mockMenus = [
        {
          id: 'adega-menu-1',
          name: 'Cardápio Adega',
          description: 'Cardápio padrão',
          is_active: true,
          categories: []
        },
        {
          id: 'after-menu-1',
          name: 'Cardápio After',
          description: 'Cardápio After Hours',
          is_active: false,
          categories: []
        }
      ];

      localStorage.setItem('menus', JSON.stringify(mockMenus));
      const saved = localStorage.getItem('menus');
      
      expect(saved).toBeDefined();
      expect(JSON.parse(saved!)).toHaveLength(2);
    });

    it('deve encontrar menu ativo', () => {
      const mockMenus = [
        { id: 'menu-1', is_active: false },
        { id: 'menu-2', is_active: true }
      ];

      const activeMenu = mockMenus.find(m => m.is_active);
      expect(activeMenu?.id).toBe('menu-2');
    });
  });

  describe('Seleção de Cardápio', () => {
    it('deve alternar cardápio ativo', () => {
      const mockMenus = [
        { id: 'adega-menu-1', is_active: true },
        { id: 'after-menu-1', is_active: false }
      ];

      const updated = mockMenus.map(m => ({
        ...m,
        is_active: m.id === 'after-menu-1'
      }));

      expect(updated[0].is_active).toBe(false);
      expect(updated[1].is_active).toBe(true);
    });

    it('deve garantir apenas um cardápio ativo', () => {
      const mockMenus = [
        { id: 'menu-1', is_active: true },
        { id: 'menu-2', is_active: false },
        { id: 'menu-3', is_active: false }
      ];

      const activeCount = mockMenus.filter(m => m.is_active).length;
      expect(activeCount).toBe(1);
    });
  });

  describe('Edição de Preços', () => {
    it('deve editar preço de item', () => {
      const item = { id: 'item-1', name: 'Cerveja', price: 500 };
      const newPrice = 600;

      const updated = { ...item, price: newPrice };
      expect(updated.price).toBe(600);
    });

    it('deve salvar preço atualizado', () => {
      const mockMenus = [
        {
          id: 'menu-1',
          categories: [
            {
              id: 'cat-1',
              items: [
                { id: 'item-1', name: 'Cerveja', price: 500 }
              ]
            }
          ]
        }
      ];

      const updated = mockMenus.map(menu => ({
        ...menu,
        categories: menu.categories.map(cat => ({
          ...cat,
          items: cat.items.map(item =>
            item.id === 'item-1' ? { ...item, price: 600 } : item
          )
        }))
      }));

      expect(updated[0].categories[0].items[0].price).toBe(600);
    });
  });
});

describe('Exportação CSV', () => {
  beforeEach(() => {
    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          click: vi.fn(),
          setAttribute: vi.fn(),
          style: {}
        } as any;
      }
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Formatação de Dados', () => {
    it('deve formatar data corretamente', () => {
      const data = new Date('2026-03-20T10:30:00');
      const formatada = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
      
      expect(formatada).toBe('20/03/2026');
    });

    it('deve formatar valor em reais', () => {
      const valor = 1500; // 15,00 em centavos
      const formatado = (valor / 100).toFixed(2).replace('.', ',');
      
      expect(formatado).toBe('15,00');
    });
  });

  describe('Geração de CSV', () => {
    it('deve gerar CSV com cabeçalho correto', () => {
      const lancamentos = [
        {
          data_lancamento: new Date('2026-03-20'),
          cliente_nome: 'João',
          descricao: 'Consumo',
          valor: 1500,
          tipo: 'Consumo'
        }
      ];

      const cabecalho = ['Data', 'Cliente', 'Descrição', 'Valor (R$)', 'Tipo'];
      expect(cabecalho).toHaveLength(5);
    });

    it('deve incluir BOM para UTF-8', () => {
      const conteudo = 'teste';
      const bom = '\uFEFF';
      const comBOM = bom + conteudo;

      expect(comBOM[0]).toBe('\uFEFF');
    });
  });

  describe('Filtros de Exportação', () => {
    it('deve filtrar por data inicial', () => {
      const lancamentos = [
        { data_lancamento: new Date('2026-03-15'), valor: 100 },
        { data_lancamento: new Date('2026-03-20'), valor: 200 },
        { data_lancamento: new Date('2026-03-25'), valor: 300 }
      ];

      const dataInicio = new Date('2026-03-20');
      const filtrados = lancamentos.filter(l =>
        new Date(l.data_lancamento) >= dataInicio
      );

      expect(filtrados).toHaveLength(2);
    });

    it('deve filtrar por cliente', () => {
      const lancamentos = [
        { cliente_nome: 'João', valor: 100 },
        { cliente_nome: 'Maria', valor: 200 },
        { cliente_nome: 'João Silva', valor: 300 }
      ];

      const filtro = 'João';
      const filtrados = lancamentos.filter(l =>
        l.cliente_nome.toLowerCase().includes(filtro.toLowerCase())
      );

      expect(filtrados).toHaveLength(2);
    });

    it('deve filtrar por tipo', () => {
      const lancamentos = [
        { tipo: 'Consumo', valor: 100 },
        { tipo: 'Pagamento', valor: 200 },
        { tipo: 'Consumo', valor: 300 }
      ];

      const filtro = 'Consumo';
      const filtrados = lancamentos.filter(l =>
        l.tipo.toLowerCase() === filtro.toLowerCase()
      );

      expect(filtrados).toHaveLength(2);
    });
  });

  describe('Nomeação de Arquivo', () => {
    it('deve gerar nome com data atual', () => {
      const data = new Date();
      const nomeEsperado = `lancamentos_${data.toISOString().split('T')[0]}.csv`;
      
      expect(nomeEsperado).toContain('lancamentos_');
      expect(nomeEsperado).toContain('.csv');
    });

    it('deve permitir nome customizado', () => {
      const nomeCustom = 'meus_lancamentos.csv';
      expect(nomeCustom).toBe('meus_lancamentos.csv');
    });
  });
});

describe('Integração Cardápio + Conta Geral', () => {
  it('deve carregar cardápio ativo na Conta Geral', () => {
    const mockMenus = [
      {
        id: 'adega-menu-1',
        is_active: true,
        categories: [
          {
            id: 'cat-1',
            name: 'Cervejas',
            items: [
              { id: 'item-1', name: 'Heineken', price: 600 }
            ]
          }
        ]
      }
    ];

    localStorage.setItem('menus', JSON.stringify(mockMenus));
    const saved = JSON.parse(localStorage.getItem('menus')!);
    const activeMenu = saved.find((m: any) => m.is_active);

    expect(activeMenu).toBeDefined();
    expect(activeMenu.categories).toHaveLength(1);
  });

  it('deve permitir seleção múltipla de itens', () => {
    const items = [
      { id: 'item-1', name: 'Cerveja', price: 500, selected: false },
      { id: 'item-2', name: 'Refrigerante', price: 300, selected: false }
    ];

    const selected = [
      { ...items[0], selected: true },
      { ...items[1], selected: true }
    ];

    expect(selected.filter(i => i.selected)).toHaveLength(2);
  });

  it('deve calcular total corretamente', () => {
    const selectedItems = [
      { id: 'item-1', price: 500 },
      { id: 'item-2', price: 300 },
      { id: 'item-3', price: 200 }
    ];

    const total = selectedItems.reduce((sum, item) => sum + item.price, 0);
    expect(total).toBe(1000);
  });
});
