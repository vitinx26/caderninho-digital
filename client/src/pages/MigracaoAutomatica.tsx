/**
 * MigracaoAutomatica - Migração automática de dados do localStorage/IndexedDB para backend
 * Recupera TODOS os usuários, clientes e lançamentos salvos localmente
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as db from '@/lib/db';

export default function MigracaoAutomatica() {
  const { voltar } = useNavigation();
  const { usuarioLogado } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [migrando, setMigrando] = useState(false);
  const [dadosEncontrados, setDadosEncontrados] = useState<{
    usuarios: any[];
    clientes: any[];
    lancamentos: any[];
  } | null>(null);
  const [resultado, setResultado] = useState<{
    usuariosMigrados: number;
    clientesMigrados: number;
    lancamentosMigrados: number;
    erros: number;
  } | null>(null);

  // Verificar se é admin
  if (usuarioLogado?.tipo !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-foreground font-semibold mb-4">Acesso Negado</p>
          <p className="text-muted-foreground mb-6">Apenas administradores podem acessar esta página</p>
          <Button onClick={voltar} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Buscar dados locais (localStorage + IndexedDB)
  const handleBuscarDados = async () => {
    try {
      setCarregando(true);
      console.log('🔍 Buscando dados locais...');

      const usuarios: any[] = [];
      const clientes: any[] = [];
      const lancamentos: any[] = [];

      // 1. Buscar usuários do IndexedDB
      try {
        const usuariosDB = await db.obterTodosUsuarios();
        if (usuariosDB && usuariosDB.length > 0) {
          usuarios.push(...usuariosDB);
          console.log(`✓ ${usuariosDB.length} usuários encontrados no IndexedDB`);
        }
      } catch (e) {
        console.warn('Erro ao buscar usuários do IndexedDB:', e);
      }

      // 2. Buscar clientes do IndexedDB
      try {
        const clientesDB = await db.obterClientes();
        if (clientesDB && clientesDB.length > 0) {
          clientes.push(...clientesDB);
          console.log(`✓ ${clientesDB.length} clientes encontrados no IndexedDB`);
        }
      } catch (e) {
        console.warn('Erro ao buscar clientes do IndexedDB:', e);
      }

      // 3. Buscar lançamentos do IndexedDB
      try {
        const lancamentosDB = await db.obterTodosLancamentos();
        if (lancamentosDB && lancamentosDB.length > 0) {
          lancamentos.push(...lancamentosDB);
          console.log(`✓ ${lancamentosDB.length} lançamentos encontrados no IndexedDB`);
        }
      } catch (e) {
        console.warn('Erro ao buscar lançamentos do IndexedDB:', e);
      }

      // 4. Buscar dados do localStorage (compatibilidade com versão antiga)
      try {
        const usuariosLS = localStorage.getItem('caderninho_usuarios');
        if (usuariosLS) {
          const parsed = JSON.parse(usuariosLS);
          if (Array.isArray(parsed)) {
            for (const u of parsed) {
              if (!usuarios.find(us => us.id === u.id || us.email === u.email)) {
                usuarios.push(u);
              }
            }
            console.log(`✓ ${parsed.length} usuários adicionais do localStorage`);
          }
        }
      } catch (e) {
        console.warn('Erro ao buscar usuários do localStorage:', e);
      }

      try {
        const clientesLS = localStorage.getItem('caderninho_clientes');
        if (clientesLS) {
          const parsed = JSON.parse(clientesLS);
          if (Array.isArray(parsed)) {
            for (const c of parsed) {
              if (!clientes.find(cl => cl.id === c.id)) {
                clientes.push(c);
              }
            }
            console.log(`✓ ${parsed.length} clientes adicionais do localStorage`);
          }
        }
      } catch (e) {
        console.warn('Erro ao buscar clientes do localStorage:', e);
      }

      try {
        const lancamentosLS = localStorage.getItem('caderninho_lancamentos');
        if (lancamentosLS) {
          const parsed = JSON.parse(lancamentosLS);
          if (Array.isArray(parsed)) {
            for (const l of parsed) {
              if (!lancamentos.find(lc => lc.id === l.id)) {
                lancamentos.push(l);
              }
            }
            console.log(`✓ ${parsed.length} lançamentos adicionais do localStorage`);
          }
        }
      } catch (e) {
        console.warn('Erro ao buscar lançamentos do localStorage:', e);
      }

      setDadosEncontrados({
        usuarios: usuarios.filter(u => u && u.email),
        clientes: clientes.filter(c => c && c.nome),
        lancamentos: lancamentos.filter(l => l && l.id),
      });

      const total = usuarios.length + clientes.length + lancamentos.length;
      toast.success(`✓ ${total} registros encontrados!`);
      console.log(`✅ Total encontrado: ${total} registros`);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao buscar dados locais');
    } finally {
      setCarregando(false);
    }
  };

  // Migrar dados para backend
  const handleMigrar = async () => {
    if (!dadosEncontrados) {
      toast.error('Nenhum dado para migrar');
      return;
    }

    try {
      setMigrando(true);
      let usuariosMigrados = 0;
      let clientesMigrados = 0;
      let lancamentosMigrados = 0;
      let erros = 0;

      // Migrar cada usuário
      for (const usuario of dadosEncontrados.usuarios) {
        try {
          console.log(`📤 Migrando usuário: ${usuario.email}`);
          const response = await fetch('/api/migrate-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usuario: usuario,
              clientes: dadosEncontrados.clientes.filter(c => !c.adminId || c.adminId === usuario.id),
              lancamentos: dadosEncontrados.lancamentos.filter(l => !l.adminId || l.adminId === usuario.id),
            }),
          });

          if (response.ok) {
            const data = await response.json();
            usuariosMigrados += 1;
            clientesMigrados += data.data?.clientesMigrados || 0;
            lancamentosMigrados += data.data?.lancamentosMigrados || 0;
            console.log(`✓ Usuário migrado: ${usuario.email}`);
          } else {
            const error = await response.json();
            console.error(`❌ Erro ao migrar ${usuario.email}:`, error);
            erros++;
          }
        } catch (error) {
          console.error('Erro ao migrar usuário:', error);
          erros++;
        }
      }

      setResultado({
        usuariosMigrados,
        clientesMigrados,
        lancamentosMigrados,
        erros,
      });

      const total = usuariosMigrados + clientesMigrados + lancamentosMigrados;
      if (total > 0) {
        toast.success(`✅ Migração concluída! ${total} registros salvos no backend`);
        console.log(`✅ Migração completa: ${total} registros`);
      } else {
        toast.warning('⚠️ Nenhum registro foi migrado');
      }
    } catch (error) {
      console.error('Erro durante migração:', error);
      toast.error('Erro durante migração');
    } finally {
      setMigrando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={voltar}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recuperar Dados</h1>
            <p className="text-muted-foreground">Migre todos os dados salvos localmente para o backend</p>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Como Funciona</h2>
          <ol className="space-y-2 text-muted-foreground">
            <li>1. Clique em "Buscar Dados Locais" para encontrar usuários, clientes e lançamentos</li>
            <li>2. Sistema procura no IndexedDB e localStorage</li>
            <li>3. Revise os dados encontrados</li>
            <li>4. Clique em "Migrar para Backend" para salvar permanentemente</li>
            <li>5. Todos os dados estarão acessíveis em qualquer navegador/dispositivo</li>
          </ol>
        </div>

        {/* Botões */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={handleBuscarDados}
            disabled={carregando || migrando}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {carregando ? 'Buscando...' : 'Buscar Dados Locais'}
          </Button>

          {dadosEncontrados && (
            <Button
              onClick={handleMigrar}
              disabled={migrando || carregando}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {migrando ? 'Migrando...' : 'Migrar para Backend'}
            </Button>
          )}
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-green-800 font-semibold mb-2">✅ Migração Concluída!</p>
                <ul className="text-green-700 space-y-1">
                  <li>• {resultado.usuariosMigrados} usuários salvos</li>
                  <li>• {resultado.clientesMigrados} clientes salvos</li>
                  <li>• {resultado.lancamentosMigrados} lançamentos salvos</li>
                  {resultado.erros > 0 && <li className="text-orange-600">⚠️ {resultado.erros} erros durante migração</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Dados Encontrados */}
        {dadosEncontrados && (
          <div className="space-y-6">
            {/* Usuários */}
            {dadosEncontrados.usuarios.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Usuários ({dadosEncontrados.usuarios.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dadosEncontrados.usuarios.map((usuario, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{usuario.nome}</p>
                        <p className="text-sm text-muted-foreground">{usuario.email}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {usuario.tipo === 'admin' ? 'Admin' : 'Cliente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clientes */}
            {dadosEncontrados.clientes.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Clientes ({dadosEncontrados.clientes.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dadosEncontrados.clientes.map((cliente, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground">{cliente.telefone || 'Sem telefone'}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lançamentos */}
            {dadosEncontrados.lancamentos.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Lançamentos ({dadosEncontrados.lancamentos.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dadosEncontrados.lancamentos.slice(0, 10).map((lancamento, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{lancamento.descricao || 'Sem descrição'}</p>
                        <p className="text-sm text-muted-foreground">
                          {lancamento.tipo === 'debito' ? 'Débito' : 'Pagamento'} - R$ {(lancamento.valor / 100).toFixed(2)}
                        </p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                  {dadosEncontrados.lancamentos.length > 10 && (
                    <p className="text-center text-muted-foreground text-sm py-2">
                      ... e mais {dadosEncontrados.lancamentos.length - 10} lançamentos
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Nenhum dado */}
            {dadosEncontrados.usuarios.length === 0 &&
              dadosEncontrados.clientes.length === 0 &&
              dadosEncontrados.lancamentos.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-yellow-800 font-semibold">Nenhum dado encontrado</p>
                      <p className="text-yellow-700 text-sm">
                        Não foram encontrados usuários, clientes ou lançamentos salvos localmente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
