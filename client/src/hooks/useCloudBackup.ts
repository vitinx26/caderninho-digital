/**
 * Hook customizado para gerenciar backups na nuvem
 * Sincroniza automaticamente e fornece interface para gerenciamento
 */

import { useState, useEffect, useCallback } from 'react';
import {
  sincronizarBackup,
  listarBackups,
  baixarBackup,
  restaurarBackup,
  deletarBackup,
  habilitarBackupAutomatico,
  backupAutomaticoHabilitado,
  tempoDesdeUltimoBackup,
  precisaFazerBackup,
  BackupMetadata,
  BackupData,
} from '@/lib/cloudBackup';

export function useCloudBackup(usuarioEmail?: string) {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimoBackup, setUltimoBackup] = useState<number>(0);
  const [backupAutomatico, setBackupAutomatico] = useState(backupAutomaticoHabilitado());

  // Carregar lista de backups
  const carregarBackups = useCallback(async () => {
    if (!usuarioEmail) return;

    try {
      setCarregando(true);
      const dados = await listarBackups(usuarioEmail);
      setBackups(dados);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar backups');
    } finally {
      setCarregando(false);
    }
  }, [usuarioEmail]);

  // Fazer backup agora
  const fazerBackupAgora = useCallback(
    async (usuarioId: string) => {
      if (!usuarioEmail) return false;

      try {
        setCarregando(true);
        await sincronizarBackup(usuarioId, usuarioEmail);
        setUltimoBackup(Date.now());
        await carregarBackups();
        setErro(null);
        return true;
      } catch (e) {
        const mensagem = e instanceof Error ? e.message : 'Erro ao fazer backup';
        setErro(mensagem);
        return false;
      } finally {
        setCarregando(false);
      }
    },
    [usuarioEmail, carregarBackups]
  );

  // Restaurar backup
  const restaurar = useCallback(async (backupId: string) => {
    try {
      setCarregando(true);
      const backup = await baixarBackup(backupId);
      await restaurarBackup(backup);
      setErro(null);
      return true;
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Erro ao restaurar backup';
      setErro(mensagem);
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  // Deletar backup
  const deletar = useCallback(async (backupId: string) => {
    try {
      setCarregando(true);
      await deletarBackup(backupId);
      await carregarBackups();
      setErro(null);
      return true;
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Erro ao deletar backup';
      setErro(mensagem);
      return false;
    } finally {
      setCarregando(false);
    }
  }, [carregarBackups]);

  // Alternar backup automático
  const alternarBackupAutomatico = useCallback((habilitar: boolean) => {
    habilitarBackupAutomatico(habilitar);
    setBackupAutomatico(habilitar);
  }, []);

  // Carregar backups ao montar
  useEffect(() => {
    carregarBackups();
  }, [carregarBackups]);

  return {
    backups,
    carregando,
    erro,
    ultimoBackup,
    backupAutomatico,
    tempoDesdeUltimo: tempoDesdeUltimoBackup(),
    precisaFazer: precisaFazerBackup(),
    carregarBackups,
    fazerBackupAgora,
    restaurar,
    deletar,
    alternarBackupAutomatico,
  };
}
