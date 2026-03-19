/**
 * Página de Gerenciamento de Backups
 * Permite visualizar, fazer backup, restaurar e deletar backups
 */

import React, { useState } from 'react';
import { useCloudBackup } from '@/hooks/useCloudBackup';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Trash2, RefreshCw, Cloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function Backups() {
  const { usuarioLogado } = useAuth();
  const {
    backups,
    carregando,
    erro,
    ultimoBackup,
    backupAutomatico,
    tempoDesdeUltimo,
    precisaFazer,
    fazerBackupAgora,
    restaurar,
    deletar,
    alternarBackupAutomatico,
  } = useCloudBackup(usuarioLogado?.email);

  const [restaurando, setRestaurando] = useState<string | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

  const handleFazerBackup = async () => {
    if (!usuarioLogado) return;
    const sucesso = await fazerBackupAgora(usuarioLogado.id);
    if (sucesso) {
      toast.success('✓ Backup realizado com sucesso!');
    } else {
      toast.error('✗ Erro ao fazer backup');
    }
  };

  const handleRestaurar = async (backupId: string) => {
    setRestaurando(backupId);
    const sucesso = await restaurar(backupId);
    setRestaurando(null);
    if (sucesso) {
      toast.success('✓ Backup restaurado com sucesso! Recarregando...');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      toast.error('✗ Erro ao restaurar backup');
    }
  };

  const handleDeletar = async (backupId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este backup?')) return;
    setDeletando(backupId);
    const sucesso = await deletar(backupId);
    setDeletando(null);
    if (sucesso) {
      toast.success('✓ Backup deletado com sucesso!');
    } else {
      toast.error('✗ Erro ao deletar backup');
    }
  };

  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!usuarioLogado || usuarioLogado.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-semibold">Acesso Restrito</p>
          <p className="text-sm text-muted-foreground">Apenas administradores podem acessar backups</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Cloud className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Gerenciamento de Backups</h1>
          </div>
          <p className="text-muted-foreground">Sincronize e restaure seus dados na nuvem</p>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Erro</p>
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status e Ações */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Status de Backup */}
            <div>
              <h3 className="font-semibold mb-2">Status do Backup</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {backupAutomatico ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-sm">
                    {backupAutomatico ? 'Backup automático ativado' : 'Backup automático desativado'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {ultimoBackup > 0
                    ? `Último backup: ${formatarData(ultimoBackup)}`
                    : 'Nenhum backup realizado ainda'}
                </div>
                {precisaFazer && (
                  <div className="text-sm text-yellow-600">
                    ⚠️ Backup desatualizado. Faça um novo backup agora.
                  </div>
                )}
              </div>
            </div>

            {/* Controles */}
            <div>
              <h3 className="font-semibold mb-2">Ações</h3>
              <div className="space-y-2">
                <Button
                  onClick={handleFazerBackup}
                  disabled={carregando}
                  className="w-full"
                >
                  {carregando ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Fazendo backup...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 mr-2" />
                      Fazer Backup Agora
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => alternarBackupAutomatico(!backupAutomatico)}
                  variant={backupAutomatico ? 'default' : 'outline'}
                  className="w-full"
                >
                  {backupAutomatico ? '✓ Automático Ativado' : 'Ativar Automático'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Backups */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Backups Disponíveis</h3>

          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Cloud className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum backup disponível</p>
              <p className="text-sm text-muted-foreground">Clique em "Fazer Backup Agora" para criar o primeiro</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3">Data</th>
                    <th className="text-left py-2 px-3">Tamanho</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-3">{formatarData(backup.timestamp)}</td>
                      <td className="py-3 px-3">{formatarTamanho(backup.tamanho)}</td>
                      <td className="py-3 px-3">
                        {backup.status === 'sucesso' ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Sucesso
                          </span>
                        ) : backup.status === 'erro' ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            Erro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleRestaurar(backup.id)}
                            disabled={restaurando === backup.id || carregando}
                            size="sm"
                            variant="outline"
                            title="Restaurar este backup"
                          >
                            {restaurando === backup.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDeletar(backup.id)}
                            disabled={deletando === backup.id || carregando}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            title="Deletar este backup"
                          >
                            {deletando === backup.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Informações de Segurança */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informações de Segurança</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Backups são criptografados e armazenados com segurança na nuvem</li>
            <li>• Backup automático é realizado a cada 1 hora se habilitado</li>
            <li>• Você pode restaurar qualquer backup anterior a qualquer momento</li>
            <li>• Backups antigos são mantidos por 90 dias antes de serem deletados automaticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
