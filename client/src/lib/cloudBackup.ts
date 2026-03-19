/**
 * Sistema de Backup na Nuvem
 * Sincroniza dados de usuários e administradores para servidor remoto
 * Permite restauração automática em caso de perda de dados
 */

import { Cliente, Lancamento, Usuario } from '@/types';
import * as db from './db';

const BACKUP_API_URL = '/api/backup'; // Endpoint do servidor
const BACKUP_INTERVAL = 3600000; // 1 hora
const LAST_BACKUP_KEY = 'caderninho_last_backup';
const BACKUP_ENABLED_KEY = 'caderninho_backup_enabled';

export interface BackupData {
  id: string;
  timestamp: number;
  usuarioId: string;
  usuarioEmail: string;
  clientes: Cliente[];
  lancamentos: Lancamento[];
  usuarios: Usuario[];
  versao: string;
}

export interface BackupMetadata {
  id: string;
  timestamp: number;
  usuarioEmail: string;
  tamanho: number;
  status: 'sucesso' | 'erro' | 'pendente';
  mensagem?: string;
}

/**
 * Cria backup completo dos dados
 */
export async function criarBackup(usuarioId: string, usuarioEmail: string): Promise<BackupData> {
  try {
    console.log('📦 Criando backup dos dados...');

    const clientes = await db.obterClientes();
    const lancamentos = await db.obterTodosLancamentos();
    const usuarios = await db.obterTodosUsuarios();

    const backup: BackupData = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      usuarioId,
      usuarioEmail,
      clientes,
      lancamentos,
      usuarios,
      versao: '1.0.0',
    };

    console.log('✓ Backup criado com sucesso:', {
      clientes: clientes.length,
      lancamentos: lancamentos.length,
      usuarios: usuarios.length,
    });

    return backup;
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    throw error;
  }
}

/**
 * Envia backup para servidor na nuvem
 */
export async function enviarBackupParaNuvem(backup: BackupData): Promise<BackupMetadata> {
  try {
    console.log('☁️ Enviando backup para nuvem...');

    const response = await fetch(`${BACKUP_API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(backup),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar backup: ${response.statusText}`);
    }

    const metadata: BackupMetadata = await response.json();
    console.log('✓ Backup enviado com sucesso:', metadata.id);

    // Salvar timestamp do último backup
    localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());

    return metadata;
  } catch (error) {
    console.error('Erro ao enviar backup para nuvem:', error);
    throw error;
  }
}

/**
 * Sincroniza backup automaticamente (chamado periodicamente)
 */
export async function sincronizarBackup(usuarioId: string, usuarioEmail: string): Promise<boolean> {
  try {
    const backup = await criarBackup(usuarioId, usuarioEmail);
    await enviarBackupParaNuvem(backup);
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar backup:', error);
    return false;
  }
}

/**
 * Inicia sincronização automática de backups
 */
export function iniciarSincronizacaoAutomatica(usuarioId: string, usuarioEmail: string) {
  // Fazer backup imediatamente
  sincronizarBackup(usuarioId, usuarioEmail).catch(console.error);

  // Depois a cada intervalo
  const intervalo = setInterval(() => {
    sincronizarBackup(usuarioId, usuarioEmail).catch(console.error);
  }, BACKUP_INTERVAL);

  return () => clearInterval(intervalo);
}

/**
 * Lista todos os backups do usuário
 */
export async function listarBackups(usuarioEmail: string): Promise<BackupMetadata[]> {
  try {
    console.log('📋 Listando backups...');

    const response = await fetch(`${BACKUP_API_URL}/list?email=${encodeURIComponent(usuarioEmail)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar backups: ${response.statusText}`);
    }

    const backups: BackupMetadata[] = await response.json();
    console.log(`✓ ${backups.length} backups encontrados`);

    return backups;
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return [];
  }
}

/**
 * Baixa backup específico da nuvem
 */
export async function baixarBackup(backupId: string): Promise<BackupData> {
  try {
    console.log('⬇️ Baixando backup da nuvem...', backupId);

    const response = await fetch(`${BACKUP_API_URL}/download/${backupId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro ao baixar backup: ${response.statusText}`);
    }

    const backup: BackupData = await response.json();
    console.log('✓ Backup baixado com sucesso');

    return backup;
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    throw error;
  }
}

/**
 * Restaura backup para IndexedDB
 */
export async function restaurarBackup(backup: BackupData): Promise<boolean> {
  try {
    console.log('🔄 Restaurando backup...');

    // Limpar dados atuais
    const database = await db.initDB();

    // Restaurar clientes
    for (const cliente of backup.clientes) {
      await db.adicionarCliente(cliente);
    }

    // Restaurar lançamentos
    for (const lancamento of backup.lancamentos) {
      await db.adicionarLancamento(lancamento);
    }

    // Restaurar usuários
    for (const usuario of backup.usuarios) {
      await db.adicionarUsuario(usuario);
    }

    console.log('✓ Backup restaurado com sucesso:', {
      clientes: backup.clientes.length,
      lancamentos: backup.lancamentos.length,
      usuarios: backup.usuarios.length,
    });

    return true;
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    throw error;
  }
}

/**
 * Deleta backup da nuvem
 */
export async function deletarBackup(backupId: string): Promise<boolean> {
  try {
    console.log('🗑️ Deletando backup...', backupId);

    const response = await fetch(`${BACKUP_API_URL}/delete/${backupId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar backup: ${response.statusText}`);
    }

    console.log('✓ Backup deletado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao deletar backup:', error);
    return false;
  }
}

/**
 * Habilita/desabilita backup automático
 */
export function habilitarBackupAutomatico(habilitar: boolean) {
  localStorage.setItem(BACKUP_ENABLED_KEY, habilitar ? 'true' : 'false');
}

/**
 * Verifica se backup automático está habilitado
 */
export function backupAutomaticoHabilitado(): boolean {
  return localStorage.getItem(BACKUP_ENABLED_KEY) !== 'false';
}

/**
 * Obtém tempo desde último backup
 */
export function tempoDesdeUltimoBackup(): number {
  const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
  if (!lastBackup) return Infinity;
  return Date.now() - parseInt(lastBackup);
}

/**
 * Verifica se precisa fazer backup
 */
export function precisaFazerBackup(): boolean {
  return tempoDesdeUltimoBackup() > BACKUP_INTERVAL;
}
