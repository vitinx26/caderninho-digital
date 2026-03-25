/**
 * Testes para validar que armazenamento local está completamente desabilitado
 */

import { describe, it, expect, vi } from 'vitest';
import * as db from './db';

describe('Armazenamento Local - Desabilitado', () => {
  it('adicionarCliente deve lançar erro', async () => {
    const cliente = { id: '1', nome: 'Test', ativo: true, dataCriacao: Date.now() };
    await expect(db.adicionarCliente(cliente)).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterClientes deve lançar erro', async () => {
    await expect(db.obterClientes()).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterClienteAtivo deve lançar erro', async () => {
    await expect(db.obterClienteAtivo()).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterClientePorId deve lançar erro', async () => {
    await expect(db.obterClientePorId('1')).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('atualizarCliente deve lançar erro', async () => {
    const cliente = { id: '1', nome: 'Test', ativo: true, dataCriacao: Date.now() };
    await expect(db.atualizarCliente(cliente)).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('adicionarLancamento deve lançar erro', async () => {
    const lancamento = {
      id: '1',
      clienteId: '1',
      valor: 100,
      tipo: 'compra' as const,
      data: Date.now(),
      descricao: 'Test',
    };
    await expect(db.adicionarLancamento(lancamento)).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterLancamentosDoCliente deve lançar erro', async () => {
    await expect(db.obterLancamentosDoCliente('1')).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterTodosLancamentos deve lançar erro', async () => {
    await expect(db.obterTodosLancamentos()).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('deletarLancamento deve lançar erro', async () => {
    await expect(db.deletarLancamento('1')).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterConfiguracao deve lançar erro', async () => {
    await expect(db.obterConfiguracao()).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('salvarConfiguracao deve lançar erro', async () => {
    const config = { id: '1', tema: 'light' };
    await expect(db.salvarConfiguracao(config as any)).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('exportarDados deve lançar erro', async () => {
    await expect(db.exportarDados()).rejects.toThrow(
      'Armazenamento local desabilitado. Backup local não é permitido.'
    );
  });

  it('importarDados deve lançar erro', async () => {
    await expect(db.importarDados('{}' )).rejects.toThrow(
      'Armazenamento local desabilitado. Restauração local não é permitida.'
    );
  });

  it('adicionarUsuario deve lançar erro', async () => {
    const usuario = {
      id: '1',
      email: 'test@example.com',
      nome: 'Test',
      tipo: 'admin' as const,
      telefone: '',
      senha: 'test',
      ativo: true,
      dataCriacao: Date.now(),
    };
    await expect(db.adicionarUsuario(usuario)).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterUsuarioPorEmail deve lançar erro', async () => {
    await expect(db.obterUsuarioPorEmail('test@example.com')).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterUsuarioPorId deve lançar erro', async () => {
    await expect(db.obterUsuarioPorId('1')).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('obterTodosUsuarios deve lançar erro', async () => {
    await expect(db.obterTodosUsuarios()).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('atualizarUsuario deve lançar erro', async () => {
    await expect(db.atualizarUsuario({ id: '1', nome: 'Updated' })).rejects.toThrow(
      'Armazenamento local desabilitado. Use servidor via API.'
    );
  });

  it('recuperarDadosAntigos deve apenas logar aviso', async () => {
    const consoleSpy = vi.spyOn(global.console, 'warn');
    await db.recuperarDadosAntigos();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Recuperação de dados locais desabilitada. Aplicativo usa APENAS servidor.'
    );
    consoleSpy.mockRestore();
  });
});
