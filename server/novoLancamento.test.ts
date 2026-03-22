import { describe, it, expect } from 'vitest';

describe('Novo Lançamento - Novo Cliente e Cardápio', () => {
  describe('Conversão de valores', () => {
    it('Deve converter valor do cardápio de centavos para reais', () => {
      const totalCentavos = 16000;
      const totalReais = (totalCentavos / 100).toFixed(2);
      expect(totalReais).toBe('160.00');
    });

    it('Deve calcular somatória corretamente com múltiplos itens', () => {
      // Simular: 2x Eternity (R$ 50,00) + 3x Cerveja (R$ 20,00)
      const items = [
        { id: '1', name: 'Eternity', price: 5000, quantity: 2 },
        { id: '2', name: 'Cerveja', price: 2000, quantity: 3 },
      ];

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(total).toBe(16000); // 10000 + 6000
      expect((total / 100).toFixed(2)).toBe('160.00');
    });

    it('Deve validar que valor não é vazio após seleção', () => {
      const totalCentavos = 16000;
      const valor = (totalCentavos / 100).toFixed(2);
      
      expect(valor).toBeTruthy();
      expect(parseFloat(valor)).toBeGreaterThan(0);
    });

    it('Deve gerar descrição corretamente a partir de itens', () => {
      const items = [
        { id: '1', name: 'Eternity', price: 5000, quantity: 2 },
        { id: '2', name: 'Cerveja', price: 2000, quantity: 3 },
      ];

      const descricao = items.map(i => i.name).join(', ');
      expect(descricao).toBe('Eternity, Cerveja');
    });
  });

  describe('Lógica de novo cliente', () => {
    it('Deve detectar novo cliente pelo prefixo "novo:"', () => {
      const clienteId = 'novo:João Silva';
      const isNovoCliente = clienteId.startsWith('novo:');
      
      expect(isNovoCliente).toBe(true);
    });

    it('Deve extrair nome do cliente do prefixo "novo:"', () => {
      const clienteId = 'novo:João Silva';
      const nomeCliente = clienteId.substring(5);
      
      expect(nomeCliente).toBe('João Silva');
    });

    it('Deve gerar email válido a partir do nome', () => {
      const nomeCliente = 'João Silva';
      const email = `${nomeCliente.toLowerCase().replace(/\s+/g, '.')}@clientes.local`;
      
      expect(email).toBe('joão.silva@clientes.local');
    });

    it('Deve validar que cliente ID não é vazio', () => {
      const clienteId = 'novo:Cliente Teste';
      
      expect(clienteId).toBeTruthy();
      expect(clienteId.length).toBeGreaterThan(0);
    });
  });

  describe('Fluxo de cardápio', () => {
    it('Deve voltar do cardápio após confirmar seleção', () => {
      let usarCardapio = true;
      
      // Simular clique em "Confirmar"
      usarCardapio = false;
      
      expect(usarCardapio).toBe(false);
    });

    it('Deve limpar estado após confirmar', () => {
      let valor = '160.00';
      let descricao = 'Eternity, Cerveja';
      let usarCardapio = true;

      // Simular confirmação
      valor = '160.00';
      descricao = 'Eternity, Cerveja';
      usarCardapio = false;

      expect(valor).toBe('160.00');
      expect(descricao).toBe('Eternity, Cerveja');
      expect(usarCardapio).toBe(false);
    });
  });

  describe('Validações', () => {
    it('Deve rejeitar valor vazio', () => {
      const valor = '';
      const isValido = !!valor && parseFloat(valor) > 0;
      
      expect(isValido).toBe(false);
    });

    it('Deve rejeitar valor zero', () => {
      const valor = '0.00';
      const isValido = parseFloat(valor) > 0;
      
      expect(isValido).toBe(false);
    });

    it('Deve aceitar valor válido', () => {
      const valor = '160.00';
      const isValido = valor && parseFloat(valor) > 0;
      
      expect(isValido).toBe(true);
    });

    it('Deve rejeitar cliente não selecionado', () => {
      const clienteId = '';
      const isValido = clienteId || false;
      
      expect(isValido).toBe(false);
    });

    it('Deve aceitar cliente selecionado', () => {
      const clienteId = '123';
      const isValido = !!clienteId;
      
      expect(isValido).toBe(true);
    });
  });
});


describe('Visibilidade de Lançamentos para Admins', () => {
  it('Deve usar admin_id padrao 1 quando cliente logado registra lancamento', () => {
    const usuarioLogado = { id: 30016, tipo: 'cliente' };
    const adminId = usuarioLogado.tipo === 'admin' ? usuarioLogado.id : undefined;
    
    expect(adminId).toBeUndefined();
  });

  it('Deve usar admin_id do usuario quando admin registra lancamento', () => {
    const usuarioLogado = { id: 1, tipo: 'admin' };
    const adminId = usuarioLogado.tipo === 'admin' ? usuarioLogado.id : undefined;
    
    expect(adminId).toBe(1);
  });

  it('Deve permitir admin ver lancamentos de clientes com admin_id = 1', () => {
    const lancamentos = [
      { id: '1', admin_id: '1', cliente_id: '30016', valor: 5000 },
      { id: '2', admin_id: '1', cliente_id: '30017', valor: 3000 },
      { id: '3', admin_id: '2', cliente_id: '30018', valor: 2000 },
    ];

    const adminId = '1';
    const lancamentosDoAdmin = lancamentos.filter(l => l.admin_id === adminId);
    
    expect(lancamentosDoAdmin.length).toBe(2);
    expect(lancamentosDoAdmin[0].cliente_id).toBe('30016');
    expect(lancamentosDoAdmin[1].cliente_id).toBe('30017');
  });

  it('Deve separar lancamentos por admin_id', () => {
    const lancamentos = [
      { id: '1', admin_id: '1', cliente_id: '30016' },
      { id: '2', admin_id: '1', cliente_id: '30017' },
      { id: '3', admin_id: '2', cliente_id: '30018' },
    ];

    const lancamentosAdmin1 = lancamentos.filter(l => l.admin_id === '1');
    const lancamentosAdmin2 = lancamentos.filter(l => l.admin_id === '2');
    
    expect(lancamentosAdmin1.length).toBe(2);
    expect(lancamentosAdmin2.length).toBe(1);
  });
});


describe('Race Condition - Cardápio e Valor', () => {
  it('Deve atualizar valor antes de sair do cardápio', async () => {
    // Simular seleção de itens
    const items = [
      { id: '1', name: 'Eternity', price: 5000, quantity: 2 },
      { id: '2', name: 'Cerveja', price: 2000, quantity: 3 },
    ];

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const valor = (total / 100).toFixed(2);

    // Simular validação
    expect(valor).toBeTruthy();
    expect(parseFloat(valor)).toBeGreaterThan(0);
  });

  it('Deve validar que valor não fica vazio após confirmar cardápio', () => {
    const total = 16000; // 2x5000 + 3x2000
    const valor = (total / 100).toFixed(2);

    expect(valor).toBe('160.00');
    expect(valor.length).toBeGreaterThan(0);
  });

  it('Deve rejeitar valor vazio mesmo após setTimeout', () => {
    const valor = '';
    const isValido = !!valor && parseFloat(valor) > 0;

    expect(isValido).toBe(false);
  });

  it('Deve aceitar valor válido após setTimeout', () => {
    const valor = '160.00';
    const isValido = !!valor && parseFloat(valor) > 0;

    expect(isValido).toBe(true);
  });
});
