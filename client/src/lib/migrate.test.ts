/**
 * Testes para a função de migração de dados
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { migrateAllOldData } from './migrate';
import * as db from './db';

// Mock do módulo db
vi.mock('./db', () => ({
  adicionarUsuario: vi.fn().mockResolvedValue(undefined),
  adicionarCliente: vi.fn().mockResolvedValue(undefined),
  adicionarLancamento: vi.fn().mockResolvedValue(undefined),
}));

describe('migrateAllOldData', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve recuperar usuários do localStorage', async () => {
    const usuarioAntigo = {
      id: 'user-1',
      email: 'victorhgs26@gmail.com',
      nome: 'Victor',
      tipo: 'admin',
      telefone: '11986975039',
      nomeEstabelecimento: 'Meu Estabelecimento',
      senha: 'hash123',
      dataCriacao: Date.now(),
    };

    localStorage.setItem('caderninho_usuarios', JSON.stringify([usuarioAntigo]));

    const resultado = await migrateAllOldData();

    expect(resultado.usuarios).toBe(1);
    expect(db.adicionarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'victorhgs26@gmail.com',
        nome: 'Victor',
        tipo: 'admin',
      })
    );
  });

  it('deve recuperar clientes do localStorage', async () => {
    const clienteAntigo = {
      id: 'cliente-1',
      nome: 'Vitinho',
      telefone: '11999999999',
      email: 'vitinho@email.com',
      ativo: true,
      dataCriacao: Date.now(),
    };

    localStorage.setItem('caderninho_clientes', JSON.stringify([clienteAntigo]));

    const resultado = await migrateAllOldData();

    expect(resultado.clientes).toBe(1);
    expect(db.adicionarCliente).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Vitinho',
        ativo: true,
      })
    );
  });

  it('deve recuperar lançamentos do localStorage', async () => {
    const lancamentoAntigo = {
      id: 'lancamento-1',
      clienteId: 'cliente-1',
      valor: 100.50,
      descricao: 'Compra de produtos',
      data: Date.now(),
      dataCriacao: Date.now(),
      tipo: 'debito',
    };

    localStorage.setItem('caderninho_lancamentos', JSON.stringify([lancamentoAntigo]));

    const resultado = await migrateAllOldData();

    expect(resultado.lancamentos).toBe(1);
    expect(db.adicionarLancamento).toHaveBeenCalledWith(
      expect.objectContaining({
        valor: 100.50,
        descricao: 'Compra de produtos',
        tipo: 'debito',
      })
    );
  });

  it('deve recuperar dados de múltiplas chaves do localStorage', async () => {
    const usuario = { email: 'test@email.com', nome: 'Test', tipo: 'admin', senha: 'hash', dataCriacao: Date.now() };
    const cliente = { nome: 'Cliente', ativo: true, dataCriacao: Date.now() };
    const lancamento = { clienteId: 'c1', valor: 50, descricao: 'Teste', data: Date.now(), dataCriacao: Date.now(), tipo: 'debito' };

    localStorage.setItem('usuarios', JSON.stringify([usuario]));
    localStorage.setItem('clientes', JSON.stringify([cliente]));
    localStorage.setItem('lancamentos', JSON.stringify([lancamento]));

    const resultado = await migrateAllOldData();

    expect(resultado.usuarios).toBeGreaterThanOrEqual(1);
    expect(resultado.clientes).toBeGreaterThanOrEqual(1);
    expect(resultado.lancamentos).toBeGreaterThanOrEqual(1);
  });

  it('deve normalizar dados com valores padrão', async () => {
    const usuarioIncompleto = {
      email: 'test@email.com',
      nome: 'Test User',
      // Sem tipo, sem telefone, etc
    };

    localStorage.setItem('caderninho_usuarios', JSON.stringify([usuarioIncompleto]));

    const resultado = await migrateAllOldData();

    expect(resultado.usuarios).toBe(1);
    expect(db.adicionarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@email.com',
        tipo: 'cliente', // valor padrão
        senha: 'temp123', // valor padrão
      })
    );
  });

  it('deve lidar com erros de parse do JSON', async () => {
    localStorage.setItem('caderninho_usuarios', 'JSON inválido {]');

    const resultado = await migrateAllOldData();

    // Deve retornar 0 usuários recuperados, mas não deve lançar erro
    expect(resultado.usuarios).toBe(0);
  });

  it('deve retornar contagem correta quando não há dados', async () => {
    const resultado = await migrateAllOldData();

    expect(resultado.usuarios).toBe(0);
    expect(resultado.clientes).toBe(0);
    expect(resultado.lancamentos).toBe(0);
  });

  it('deve recuperar dados em formato de objeto com propriedades', async () => {
    const dataObj = {
      usuarios: [
        { email: 'test@email.com', nome: 'Test', tipo: 'admin', senha: 'hash', dataCriacao: Date.now() }
      ],
      clientes: [
        { nome: 'Cliente', ativo: true, dataCriacao: Date.now() }
      ],
      lancamentos: [
        { clienteId: 'c1', valor: 50, descricao: 'Teste', data: Date.now(), dataCriacao: Date.now(), tipo: 'debito' }
      ],
    };

    localStorage.setItem('caderninho_usuarios', JSON.stringify(dataObj));
    localStorage.setItem('caderninho_clientes', JSON.stringify(dataObj));
    localStorage.setItem('caderninho_lancamentos', JSON.stringify(dataObj));

    const resultado = await migrateAllOldData();

    expect(resultado.usuarios).toBeGreaterThanOrEqual(1);
    expect(resultado.clientes).toBeGreaterThanOrEqual(1);
    expect(resultado.lancamentos).toBeGreaterThanOrEqual(1);
  });
});
