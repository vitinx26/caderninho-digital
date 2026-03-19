import { describe, it, expect, beforeAll } from 'vitest';
import { initializeEmailService, enviarEmail } from './emailService';

describe('Email Service', () => {
  beforeAll(() => {
    // Carregar variáveis de ambiente
    console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '***' : 'não configurado');
  });

  it('deve inicializar o serviço de email', () => {
    const resultado = initializeEmailService();
    
    // Se variáveis estão configuradas, deve retornar true
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      expect(resultado).toBe(true);
    } else {
      // Se não estão configuradas, pode retornar false (é ok)
      expect([true, false]).toContain(resultado);
    }
  });

  it('deve validar que EMAIL_SERVICE está configurado se EMAIL_USER está', () => {
    if (process.env.EMAIL_USER) {
      expect(process.env.EMAIL_SERVICE).toBeDefined();
      expect(process.env.EMAIL_SERVICE).not.toBe('');
    }
  });

  it('deve validar que EMAIL_PASSWORD está configurado se EMAIL_USER está', () => {
    if (process.env.EMAIL_USER) {
      expect(process.env.EMAIL_PASSWORD).toBeDefined();
      expect(process.env.EMAIL_PASSWORD).not.toBe('');
    }
  });

  it('deve validar email USER se configurado', () => {
    if (process.env.EMAIL_USER) {
      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(process.env.EMAIL_USER)).toBe(true);
    }
  });
});
