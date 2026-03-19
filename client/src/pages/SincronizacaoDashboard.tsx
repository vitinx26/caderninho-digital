/**
 * Dashboard de Sincronização
 * Mostra status de sincronização e conflitos entre admins
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  AlertTriangle,
  Download,
} from 'lucide-react';
import {
  sincronizarComServidor,
  obterStatusSincronizacao,
  obterHistoricoSincronizacao,
  tempoDesdeUltimaSincronizacao,
  SyncStatus,
  SyncHistory,
} from '@/lib/serverBackupSync';

export default function SincronizacaoDashboard() {
  const { usuarioLogado } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [historico, setHistorico] = useState<SyncHistory[]>([]);
  const [tempoDesdeUltima, setTempoDesdeUltima] = useState(0);

  // Carregar dados ao montar
  useEffect(() => {
    if (!usuarioLogado?.email) return;
    carregarDados();

    // Atualizar tempo a cada segundo
    const intervalo = setInterval(() => {
      setTempoDesdeUltima(tempoDesdeUltimaSincronizacao());
    }, 1000);

    return () => clearInterval(intervalo);
  }, [usuarioLogado]);

  const carregarDados = async () => {
    if (!usuarioLogado?.email) return;

    try {
      setCarregando(true);
      const [novoStatus, novoHistorico] = await Promise.all([
        obterStatusSincronizacao(usuarioLogado.email),
        obterHistoricoSincronizacao(usuarioLogado.email),
      ]);

      setStatus(novoStatus);
      setHistorico(novoHistorico);
      setTempoDesdeUltima(tempoDesdeUltimaSincronizacao());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de sincronização');
    } finally {
      setCarregando(false);
    }
  };

  const handleSincronizar = async () => {
    if (!usuarioLogado?.email) return;

    try {
      setCarregando(true);
      const resultado = await sincronizarComServidor(usuarioLogado.email);

      if (resultado.status === 'sucesso') {
        toast.success('✓ Sincronização concluída com sucesso!');
      } else {
        toast.error(`✗ Erro: ${resultado.mensagem}`);
      }

      setStatus(resultado);
      await carregarDados();
    } catch (error) {
      toast.error('Erro ao sincronizar');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatarTempo = (ms: number) => {
    if (ms === Infinity) return 'Nunca';
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    if (minutos === 0) return `${segundos}s atrás`;
    if (minutos < 60) return `${minutos}m atrás`;
    const horas = Math.floor(minutos / 60);
    return `${horas}h atrás`;
  };

  if (!usuarioLogado || usuarioLogado.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-semibold">Acesso Restrito</p>
          <p className="text-sm text-muted-foreground">Apenas administradores podem acessar sincronização</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Dashboard de Sincronização</h1>
          </div>
          <p className="text-muted-foreground">Monitore o status de sincronização com o servidor</p>
        </div>

        {/* Status Atual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Card de Status */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Status de Sincronização
            </h3>

            {status ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {status.status === 'sucesso' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : status.status === 'erro' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
                  )}
                  <span className="font-semibold capitalize">{status.status}</span>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Última sincronização: {formatarData(status.timestamp)}</p>
                  <p>Tempo desde última: {formatarTempo(tempoDesdeUltima)}</p>
                </div>

                {status.mensagem && (
                  <div className="text-sm bg-muted p-2 rounded">
                    {status.mensagem}
                  </div>
                )}

                {status.conflitos && status.conflitos.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <p className="text-sm text-yellow-800">
                      ⚠️ {status.conflitos.length} conflito(s) detectado(s)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma sincronização realizada ainda</p>
            )}
          </div>

          {/* Card de Ações */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Ações
            </h3>

            <div className="space-y-3">
              <Button
                onClick={handleSincronizar}
                disabled={carregando}
                className="w-full"
              >
                {carregando ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 mr-2" />
                    Sincronizar Agora
                  </>
                )}
              </Button>

              <Button
                onClick={carregarDados}
                disabled={carregando}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar Dados
              </Button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              <p>✓ Sincronização automática a cada 10 minutos</p>
            </div>
          </div>
        </div>

        {/* Conflitos */}
        {status?.conflitos && status.conflitos.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Conflitos Detectados
            </h3>

            <div className="space-y-3">
              {status.conflitos.map((conflito, idx) => (
                <div key={idx} className="bg-white p-3 rounded border border-yellow-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold capitalize">{conflito.tipo}: {conflito.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Local: {formatarData(conflito.localTimestamp)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Servidor: {formatarData(conflito.servidorTimestamp)}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded capitalize">
                      {conflito.acao}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de Sincronizações */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Sincronizações
          </h3>

          {historico.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma sincronização registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3">Data</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Itens</th>
                    <th className="text-left py-2 px-3">Conflitos</th>
                    <th className="text-left py-2 px-3">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((sync) => (
                    <tr key={sync.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-3">{formatarData(sync.timestamp)}</td>
                      <td className="py-3 px-3">
                        {sync.status === 'sucesso' ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Sucesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            Erro
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">{sync.itemsSincronizados}</td>
                      <td className="py-3 px-3">
                        {sync.conflitos > 0 ? (
                          <span className="text-yellow-600">{sync.conflitos}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3">{sync.duracao}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informações</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sincronização automática a cada 10 minutos</li>
            <li>• Conflitos são resolvidos automaticamente usando versão mais recente</li>
            <li>• Histórico completo de sincronizações é mantido</li>
            <li>• Todos os admins veem o mesmo status de sincronização</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
