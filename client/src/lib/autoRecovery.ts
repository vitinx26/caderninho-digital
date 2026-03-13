/**
 * Serviço de recuperação automática de dados
 * Garante que dados antigos sejam sempre recuperados e sincronizados
 */

import { Usuario, Cliente, Lancamento } from '@/types';
import * as db from './db';
import { migrateAllOldData, syncMigratedDataWithBackend } from './migrate';

/**
 * Flag para evitar múltiplas recuperações simultâneas
 */
let isRecoveringData = false;

/**
 * Recuperar dados antigos de forma robusta
 * Tenta múltiplas fontes e sincroniza com backend
 */
export async function recuperarDadosAutomaticamente(): Promise<{
  usuarios: number;
  clientes: number;
  lancamentos: number;
  sincronizado: boolean;
}> {
  // Evitar múltiplas recuperações simultâneas
  if (isRecoveringData) {
    console.log('Recuperação já em andamento...');
    return {
      usuarios: 0,
      clientes: 0,
      lancamentos: 0,
      sincronizado: false,
    };
  }

  isRecoveringData = true;

  try {
    console.log('🔄 Iniciando recuperação automática de dados...');

    // 1. Recuperar dados antigos do localStorage e IndexedDB
    let resultado;
    try {
      resultado = await migrateAllOldData();
    } catch (migrateError) {
      console.error('❌ Erro durante migração:', migrateError);
      resultado = {
        usuarios: 0,
        clientes: 0,
        lancamentos: 0,
      };
    }

    console.log('✓ Dados recuperados:', resultado);

    // 2. Verificar se há usuários no banco
    const usuariosLocal = await db.obterTodosUsuarios();
    console.log(`✓ Usuários no banco: ${usuariosLocal.length}`);

    // 3. Se houver usuários, sincronizar com backend
    if (usuariosLocal.length > 0) {
      console.log('🔄 Sincronizando com backend...');
      const sincronizado = await syncMigratedDataWithBackend();
      console.log('✓ Sincronização:', sincronizado ? 'sucesso' : 'falha');

      return {
        usuarios: usuariosLocal.length,
        clientes: (await db.obterClientes()).length,
        lancamentos: (await db.obterTodosLancamentos()).length,
        sincronizado,
      };
    }

    return resultado as any;
  } catch (error) {
    console.error('❌ Erro durante recuperação automática:', error);
    return {
      usuarios: 0,
      clientes: 0,
      lancamentos: 0,
      sincronizado: false,
    };
  } finally {
    isRecoveringData = false;
  }
}

/**
 * Garantir que usuário específico existe no banco
 * Se não existir, tenta recuperar dos dados antigos
 */
export async function garantirUsuarioExiste(email: string): Promise<Usuario | null> {
  try {
    // 1. Verificar se usuário existe no banco
    let usuario = await db.obterUsuarioPorEmail(email);

    if (usuario) {
      console.log(`✓ Usuário ${email} encontrado no banco`);
      return usuario;
    }

    console.log(`⚠️ Usuário ${email} não encontrado, tentando recuperar dados antigos...`);

    // 2. Se não existe, recuperar dados antigos
    await recuperarDadosAutomaticamente();

    // 3. Tentar novamente
    usuario = await db.obterUsuarioPorEmail(email);

    if (usuario) {
      console.log(`✓ Usuário ${email} recuperado com sucesso`);
      return usuario;
    }

    console.log(`❌ Usuário ${email} não encontrado mesmo após recuperação`);
    return null;
  } catch (error) {
    console.error(`Erro ao garantir usuário ${email}:`, error);
    return null;
  }
}

/**
 * Sincronizar dados locais com backend
 * Útil para garantir persistência após operações críticas
 */
export async function sincronizarDadosComBackend(): Promise<boolean> {
  try {
    console.log('🔄 Sincronizando dados com backend...');

    const usuariosLocal = await db.obterTodosUsuarios();
    const clientesLocal = await db.obterClientes();
    const lancamentosLocal = await db.obterTodosLancamentos();

    if (usuariosLocal.length === 0) {
      console.log('⚠️ Nenhum dado para sincronizar');
      return false;
    }

    // Encontrar usuário admin
    const adminUser = usuariosLocal.find((u: Usuario) => u.tipo === 'admin');
    if (!adminUser) {
      console.log('⚠️ Nenhum usuário admin encontrado');
      return false;
    }

    // Sincronizar com backend
    const sincronizado = await syncMigratedDataWithBackend();
    console.log('✓ Sincronização com backend:', sincronizado ? 'sucesso' : 'falha');

    return sincronizado;
  } catch (error) {
    console.error('Erro ao sincronizar com backend:', error);
    return false;
  }
}

/**
 * Monitorar mudanças no localStorage e disparar recuperação
 */
export function monitorarMudancasStorage(): () => void {
  const handleStorageChange = async (event: StorageEvent) => {
    // Se houver mudanças em dados de usuários, recuperar automaticamente
    if (event.key?.includes('usuario') || event.key?.includes('caderninho')) {
      console.log('📝 Mudança detectada no storage, recuperando dados...');
      await recuperarDadosAutomaticamente();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Retornar função para remover listener
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Agendar verificação periódica de dados
 */
export function agendarVerificacaoPeriodicaDados(intervaloMs: number = 60000): () => void {
  const intervalId = setInterval(async () => {
    console.log('⏰ Verificação periódica de dados...');
    await recuperarDadosAutomaticamente();
  }, intervaloMs);

  // Retornar função para limpar intervalo
  return () => {
    clearInterval(intervalId);
  };
}
