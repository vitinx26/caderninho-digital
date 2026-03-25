/**
 * Serviço de recuperação automática - DESABILITADO
 * Aplicativo usa APENAS servidor como fonte de dados
 * Nenhuma recuperação de dados locais é permitida
 */

import { Usuario, Cliente, Lancamento } from '@/types';

/**
 * Recuperação automática desabilitada
 */
export async function recuperarDadosAutomaticamente(): Promise<{
  usuarios: number;
  clientes: number;
  lancamentos: number;
  sincronizado: boolean;
}> {
  console.warn('Recuperação automática desabilitada. Aplicativo usa APENAS servidor.');
  return {
    usuarios: 0,
    clientes: 0,
    lancamentos: 0,
    sincronizado: false,
  };
}

/**
 * Sincronização com backend desabilitada
 */
export async function sincronizarComBackendAutomaticamente(): Promise<boolean> {
  console.warn('Sincronização automática desabilitada. Use hooks do servidor.');
  return false;
}

/**
 * Garantir admin desabilitada
 */
export async function garantirAdminExiste(): Promise<Usuario | null> {
  console.warn('Garantia de admin desabilitada. Use servidor.');
  return null;
}

/**
 * Garantir usuário existe - desabilitada
 */
export async function garantirUsuarioExiste(email: string): Promise<Usuario | null> {
  console.warn('Garantia de usuário desabilitada. Use servidor.');
  return null;
}

/**
 * Monitorar mudanças no storage - desabilitada
 */
export function monitorarMudancasStorage(): () => void {
  console.warn('Monitoramento de storage desabilitado.');
  return () => {};
}
