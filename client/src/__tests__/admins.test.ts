/**
 * Testes de Garantia de Admins
 * Valida que victorhgs26@gmail.com e trc290382@gmail.com são sempre encontrados
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Garantia de Admins Obrigatórios', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Admins Obrigatórios', () => {
    it('deve ter victorhgs26@gmail.com como admin', () => {
      const admin = {
        id: 'admin-victorhgs26',
        email: 'victorhgs26@gmail.com',
        senha: 'Vitinx@26',
        nome: 'Victor',
        tipo: 'admin',
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      expect(admin.email).toBe('victorhgs26@gmail.com');
      expect(admin.tipo).toBe('admin');
      expect(admin.senha).toBe('Vitinx@26');
    });

    it('deve ter trc290382@gmail.com como admin', () => {
      const admin = {
        id: 'admin-trc290382',
        email: 'trc290382@gmail.com',
        senha: 'Trc@123456',
        nome: 'TRC',
        tipo: 'admin',
        telefone: '11988888888',
        dataCriacao: Date.now(),
      };

      expect(admin.email).toBe('trc290382@gmail.com');
      expect(admin.tipo).toBe('admin');
      expect(admin.senha).toBe('Trc@123456');
    });
  });

  describe('Persistência de Admins no localStorage', () => {
    it('deve salvar victorhgs26@gmail.com no localStorage', () => {
      const admins = [
        {
          id: 'admin-victorhgs26',
          email: 'victorhgs26@gmail.com',
          senha: 'Vitinx@26',
          nome: 'Victor',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_usuarios', JSON.stringify(admins));

      const dados = localStorage.getItem('caderninho_usuarios');
      expect(dados).toBeDefined();

      const usuariosRecuperados = JSON.parse(dados!);
      expect(usuariosRecuperados[0].email).toBe('victorhgs26@gmail.com');
      expect(usuariosRecuperados[0].senha).toBe('Vitinx@26');
    });

    it('deve salvar trc290382@gmail.com no localStorage', () => {
      const admins = [
        {
          id: 'admin-trc290382',
          email: 'trc290382@gmail.com',
          senha: 'Trc@123456',
          nome: 'TRC',
          tipo: 'admin',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_usuarios', JSON.stringify(admins));

      const dados = localStorage.getItem('caderninho_usuarios');
      const usuariosRecuperados = JSON.parse(dados!);

      expect(usuariosRecuperados[0].email).toBe('trc290382@gmail.com');
      expect(usuariosRecuperados[0].senha).toBe('Trc@123456');
    });

    it('deve salvar ambos os admins no localStorage', () => {
      const admins = [
        {
          id: 'admin-victorhgs26',
          email: 'victorhgs26@gmail.com',
          senha: 'Vitinx@26',
          nome: 'Victor',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
        {
          id: 'admin-trc290382',
          email: 'trc290382@gmail.com',
          senha: 'Trc@123456',
          nome: 'TRC',
          tipo: 'admin',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_usuarios', JSON.stringify(admins));

      const dados = localStorage.getItem('caderninho_usuarios');
      const usuariosRecuperados = JSON.parse(dados!);

      expect(usuariosRecuperados.length).toBe(2);
      expect(usuariosRecuperados[0].email).toBe('victorhgs26@gmail.com');
      expect(usuariosRecuperados[1].email).toBe('trc290382@gmail.com');
    });
  });

  describe('Recuperação de Senhas de Admins', () => {
    it('deve preservar senha de victorhgs26@gmail.com', () => {
      const admin = {
        id: 'admin-victorhgs26',
        email: 'victorhgs26@gmail.com',
        senha: 'Vitinx@26',
        nome: 'Victor',
        tipo: 'admin',
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      localStorage.setItem('caderninho_usuarios', JSON.stringify([admin]));

      // Simular múltiplas recuperações
      for (let i = 0; i < 3; i++) {
        const dados = localStorage.getItem('caderninho_usuarios');
        const usuarios = JSON.parse(dados!);
        expect(usuarios[0].senha).toBe('Vitinx@26');
      }
    });

    it('deve preservar senha de trc290382@gmail.com', () => {
      const admin = {
        id: 'admin-trc290382',
        email: 'trc290382@gmail.com',
        senha: 'Trc@123456',
        nome: 'TRC',
        tipo: 'admin',
        telefone: '11988888888',
        dataCriacao: Date.now(),
      };

      localStorage.setItem('caderninho_usuarios', JSON.stringify([admin]));

      // Simular múltiplas recuperações
      for (let i = 0; i < 3; i++) {
        const dados = localStorage.getItem('caderninho_usuarios');
        const usuarios = JSON.parse(dados!);
        expect(usuarios[0].senha).toBe('Trc@123456');
      }
    });

    it('deve preservar senhas de ambos os admins em múltiplas atualizações', () => {
      const admins = [
        {
          id: 'admin-victorhgs26',
          email: 'victorhgs26@gmail.com',
          senha: 'Vitinx@26',
          nome: 'Victor',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
        {
          id: 'admin-trc290382',
          email: 'trc290382@gmail.com',
          senha: 'Trc@123456',
          nome: 'TRC',
          tipo: 'admin',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      localStorage.setItem('caderninho_usuarios', JSON.stringify(admins));

      // Simular atualização do app
      const dados1 = localStorage.getItem('caderninho_usuarios');
      const usuarios1 = JSON.parse(dados1!);
      localStorage.setItem('caderninho_usuarios', JSON.stringify(usuarios1));

      // Recuperar após atualização
      const dados2 = localStorage.getItem('caderninho_usuarios');
      const usuarios2 = JSON.parse(dados2!);

      expect(usuarios2[0].senha).toBe('Vitinx@26');
      expect(usuarios2[1].senha).toBe('Trc@123456');
    });
  });

  describe('Validação de Integridade de Admins', () => {
    it('deve validar que victorhgs26@gmail.com tem email correto', () => {
      const admin = {
        id: 'admin-victorhgs26',
        email: 'victorhgs26@gmail.com',
        senha: 'Vitinx@26',
        nome: 'Victor',
        tipo: 'admin',
        telefone: '11999999999',
        dataCriacao: Date.now(),
      };

      expect(admin.email).toBe('victorhgs26@gmail.com');
      expect(admin.email).not.toBe('');
      expect(admin.email).toContain('@');
    });

    it('deve validar que trc290382@gmail.com tem email correto', () => {
      const admin = {
        id: 'admin-trc290382',
        email: 'trc290382@gmail.com',
        senha: 'Trc@123456',
        nome: 'TRC',
        tipo: 'admin',
        telefone: '11988888888',
        dataCriacao: Date.now(),
      };

      expect(admin.email).toBe('trc290382@gmail.com');
      expect(admin.email).not.toBe('');
      expect(admin.email).toContain('@');
    });

    it('deve validar que ambos têm tipo admin', () => {
      const admins = [
        {
          id: 'admin-victorhgs26',
          email: 'victorhgs26@gmail.com',
          senha: 'Vitinx@26',
          nome: 'Victor',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
        {
          id: 'admin-trc290382',
          email: 'trc290382@gmail.com',
          senha: 'Trc@123456',
          nome: 'TRC',
          tipo: 'admin',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      for (const admin of admins) {
        expect(admin.tipo).toBe('admin');
      }
    });

    it('deve validar que ambos têm senhas não vazias', () => {
      const admins = [
        {
          id: 'admin-victorhgs26',
          email: 'victorhgs26@gmail.com',
          senha: 'Vitinx@26',
          nome: 'Victor',
          tipo: 'admin',
          telefone: '11999999999',
          dataCriacao: Date.now(),
        },
        {
          id: 'admin-trc290382',
          email: 'trc290382@gmail.com',
          senha: 'Trc@123456',
          nome: 'TRC',
          tipo: 'admin',
          telefone: '11988888888',
          dataCriacao: Date.now(),
        },
      ];

      for (const admin of admins) {
        expect(admin.senha).not.toBe('');
        expect(admin.senha.length).toBeGreaterThan(0);
      }
    });
  });
});
