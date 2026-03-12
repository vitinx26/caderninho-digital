/**
 * Testes para gerador de mensagens WhatsApp
 */

import { describe, it, expect } from 'vitest';
import {
  gerarMensagemWhatsApp,
  gerarUrlWhatsApp,
  validarTemplate,
  TEMPLATE_PADRAO,
} from './whatsappTemplate';
import { Cliente, Lancamento } from '@/types';

describe('whatsappTemplate', () => {
  const clienteTeste: Cliente = {
    id: '1',
    nome: 'João Silva',
    telefone: '11986975039',
    email: 'joao@example.com',
    dataCriacao: Date.now(),
    ativo: true,
  };

  const lancamentoTeste: Lancamento = {
    id: '1',
    clienteId: '1',
    tipo: 'debito',
    valor: 15000, // R$ 150,00
    descricao: 'Venda de produtos',
    data: new Date('2026-03-20').getTime(),
    dataCriacao: Date.now(),
  };

  describe('gerarMensagemWhatsApp', () => {
    it('deve gerar mensagem com template padrão', () => {
      const mensagem = gerarMensagemWhatsApp(undefined, clienteTeste, lancamentoTeste);
      
      expect(mensagem).toContain('João Silva');
      expect(mensagem).toContain('150');
      expect(mensagem).toContain('2026');
      expect(mensagem).toContain('débito');
    });

    it('deve gerar mensagem com template personalizado', () => {
      const templatePersonalizado = 'Olá {cliente}, seu débito é de {valor}';
      const mensagem = gerarMensagemWhatsApp(templatePersonalizado, clienteTeste, lancamentoTeste);
      
      expect(mensagem).toContain('Olá João Silva');
      expect(mensagem).toContain('150');
    });

    it('deve substituir todas as variáveis corretamente', () => {
      const template = '{cliente} - {valor} - {data} - {descricao}';
      const mensagem = gerarMensagemWhatsApp(template, clienteTeste, lancamentoTeste);
      
      expect(mensagem).toContain('João Silva');
      expect(mensagem).toContain('150');
      expect(mensagem).toContain('2026');
      expect(mensagem).toContain('Venda de produtos');
    });

    it('deve formatar valor em reais corretamente', () => {
      const lancamento: Lancamento = {
        ...lancamentoTeste,
        valor: 1000, // R$ 10,00
      };
      const mensagem = gerarMensagemWhatsApp(TEMPLATE_PADRAO, clienteTeste, lancamento);
      
      expect(mensagem).toContain('10,00');
    });

    it('deve formatar data corretamente', () => {
      const lancamento: Lancamento = {
        ...lancamentoTeste,
        data: new Date('2026-12-25').getTime(),
      };
      const mensagem = gerarMensagemWhatsApp(TEMPLATE_PADRAO, clienteTeste, lancamento);
      
      expect(mensagem).toContain('2026');
      expect(mensagem).toContain('12');
    });
  });

  describe('gerarUrlWhatsApp', () => {
    it('deve gerar URL válida do WhatsApp', () => {
      const mensagem = 'Olá, você tem um débito';
      const url = gerarUrlWhatsApp('11986975039', mensagem);
      
      expect(url).toContain('https://wa.me/');
      expect(url).toContain('11986975039');
      expect(url).toContain('text=');
    });

    it('deve remover caracteres especiais do número', () => {
      const mensagem = 'Teste';
      const url = gerarUrlWhatsApp('+55 (11) 98697-5039', mensagem);
      
      expect(url).toContain('5511986975039');
    });

    it('deve codificar mensagem corretamente', () => {
      const mensagem = 'Olá, você tem um débito de R$ 150,00';
      const url = gerarUrlWhatsApp('11986975039', mensagem);
      
      // A mensagem deve estar codificada na URL
      expect(url).toContain('text=');
      expect(url.includes('Ol%C3%A1')).toBe(true); // 'á' codificado
    });
  });

  describe('validarTemplate', () => {
    it('deve validar template correto', () => {
      const resultado = validarTemplate('Olá {cliente}, seu débito é {valor}');
      
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it('deve rejeitar template vazio', () => {
      const resultado = validarTemplate('');
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros).toContain('Template não pode estar vazio');
    });

    it('deve rejeitar variáveis inválidas', () => {
      const resultado = validarTemplate('Olá {cliente}, seu {invalido} é {valor}');
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some(e => e.includes('invalido'))).toBe(true);
    });

    it('deve aceitar template com todas as variáveis válidas', () => {
      const resultado = validarTemplate('{cliente} {valor} {data} {descricao}');
      
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
    });

    it('deve detectar múltiplas variáveis inválidas', () => {
      const resultado = validarTemplate('{cliente} {invalido1} {invalido2}');
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.length).toBeGreaterThan(1);
    });
  });
});
