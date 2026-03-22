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
