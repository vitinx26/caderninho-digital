/**
 * Serviço de Backup - Exportar e importar dados do IndexedDB
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import * as db from './db';
import { Usuario, Cliente, Lancamento, ConfiguracaoApp } from '@/types';

export interface BackupData {
  versao: string;
  dataCriacao: number;
  usuarios: Usuario[];
  clientes: Cliente[];
  lancamentos: Lancamento[];
  configuracao: ConfiguracaoApp | null;
}

/**
 * Exportar todos os dados para um arquivo JSON
 */
export async function exportarBackup(): Promise<BackupData> {
  try {
    const usuarios = await db.obterTodosUsuarios();
    const clientes = await db.obterClientes();
    const lancamentos = await db.obterTodosLancamentos();
    const configuracao = await db.obterConfiguracao();

    const backup: BackupData = {
      versao: '1.0.0',
      dataCriacao: Date.now(),
      usuarios: usuarios || [],
      clientes: clientes || [],
      lancamentos: lancamentos || [],
      configuracao: configuracao || null,
    };

    return backup;
  } catch (error) {
    console.error('Erro ao exportar backup:', error);
    throw new Error('Falha ao exportar dados');
  }
}

/**
 * Importar dados de um arquivo JSON
 */
export async function importarBackup(backupData: BackupData): Promise<void> {
  try {
    // Validar estrutura do backup
    if (!backupData.versao || !backupData.usuarios) {
      throw new Error('Arquivo de backup inválido');
    }

    // Importar usuários
    if (backupData.usuarios && backupData.usuarios.length > 0) {
      for (const usuario of backupData.usuarios) {
        await db.adicionarUsuario(usuario);
      }
    }

    // Importar clientes
    if (backupData.clientes && backupData.clientes.length > 0) {
      for (const cliente of backupData.clientes) {
        await db.adicionarCliente(cliente);
      }
    }

    // Importar lançamentos
    if (backupData.lancamentos && backupData.lancamentos.length > 0) {
      for (const lancamento of backupData.lancamentos) {
        await db.adicionarLancamento(lancamento);
      }
    }

    // Importar configuração
    if (backupData.configuracao) {
      await db.salvarConfiguracao(backupData.configuracao);
    }

    console.log('Backup importado com sucesso');
  } catch (error) {
    console.error('Erro ao importar backup:', error);
    throw new Error('Falha ao importar dados');
  }
}

/**
 * Baixar backup como arquivo JSON
 */
export async function baixarBackupJSON(): Promise<void> {
  try {
    const backup = await exportarBackup();
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caderninho-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    throw new Error('Falha ao baixar backup');
  }
}

/**
 * Carregar backup de um arquivo JSON
 */
export async function carregarBackupJSON(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const backup = JSON.parse(json) as BackupData;
        resolve(backup);
      } catch (error) {
        reject(new Error('Arquivo JSON inválido'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    reader.readAsText(file);
  });
}

/**
 * Sincronizar dados entre abas do navegador usando localStorage
 */
export function sincronizarEntreAbas(callback: () => void): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'caderninho_backup_sync') {
      callback();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Notificar outras abas sobre sincronização
 */
export function notificarSincronizacao(): void {
  const timestamp = Date.now();
  localStorage.setItem('caderninho_backup_sync', timestamp.toString());
  // Limpar após um tempo
  setTimeout(() => {
    localStorage.removeItem('caderninho_backup_sync');
  }, 1000);
}

/**
 * Agendar backup automático
 */
export function agendarBackupAutomatico(
  intervaloMinutos: number = 60,
  callback?: (backup: BackupData) => Promise<void>
): () => void {
  const intervaloMs = intervaloMinutos * 60 * 1000;

  const executarBackup = async () => {
    try {
      const backup = await exportarBackup();
      localStorage.setItem('caderninho_ultimo_backup', JSON.stringify(backup));
      localStorage.setItem('caderninho_timestamp_backup', Date.now().toString());

      if (callback) {
        await callback(backup);
      }

      console.log('Backup automático realizado');
    } catch (error) {
      console.error('Erro no backup automático:', error);
    }
  };

  // Executar imediatamente
  executarBackup();

  // Agendar para executar periodicamente
  const intervalId = setInterval(executarBackup, intervaloMs);

  // Retornar função para parar o agendamento
  return () => clearInterval(intervalId);
}

/**
 * Obter último backup salvo
 */
export function obterUltimoBackup(): BackupData | null {
  try {
    const backup = localStorage.getItem('caderninho_ultimo_backup');
    if (backup) {
      return JSON.parse(backup) as BackupData;
    }
  } catch (error) {
    console.error('Erro ao obter último backup:', error);
  }
  return null;
}

/**
 * Obter timestamp do último backup
 */
export function obterTimestampUltimoBackup(): number | null {
  try {
    const timestamp = localStorage.getItem('caderninho_timestamp_backup');
    if (timestamp) {
      return parseInt(timestamp, 10);
    }
  } catch (error) {
    console.error('Erro ao obter timestamp:', error);
  }
  return null;
}
