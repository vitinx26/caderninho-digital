/**
 * Contexto de autenticação para o Caderninho Digital
 * Gerencia login, logout e estado do usuário logado
 * Implementa persistência garantida de senha
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioLogado, TipoUsuario } from '@/types';
import * as db from '@/lib/db';
import { garantirUsuarioExiste, recuperarDadosAutomaticamente, monitorarMudancasStorage } from '@/lib/autoRecovery';
import { salvarSenhaSegura, sincronizarSenhaComIndexedDB, validarIntegridadeSenhas } from '@/lib/passwordPersistence';
import { sincronizarDadosDoLocalStorage, salvarDadosSync, monitorarMudancasLocalStorage } from '@/lib/dataSync';
import { garantirAdminsPresentes } from '@/lib/debugAdmins';
import { iniciarPollingHTTP, pararPolling } from '@/lib/httpPolling';
// import { sincronizarBidirecional, iniciarSincronizacaoPeriodica, monitorarConexao } from '@/lib/serverSync';
// import { migrarDadosParaServidor, sincronizarDoServidor } from '@/lib/migrationToServer';

interface AuthContextType {
  usuarioLogado: UsuarioLogado | null;
  carregando: boolean;
  fazer_login: (email: string, senha: string) => Promise<void>;
  fazer_registro: (email: string, senha: string, nome: string, tipo: TipoUsuario, telefone?: string) => Promise<void>;
  fazer_logout: () => void;
  usuarioGeral: boolean;
  entrarComContaGeral: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);
  const [usuarioGeral, setUsuarioGeral] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Verificar se há usuário logado ao carregar
  useEffect(() => {
    const verificarLogin = async () => {
      try {
        // Garantir que admins obrigatórios estão presentes
        console.log('🔍 Garantindo presença de admins obrigatórios...');
        await garantirAdminsPresentes();

        // Recuperar dados antigos automaticamente
        console.log('🔄 Iniciando recuperação automática de dados...');
        const resultado = await recuperarDadosAutomaticamente();
        console.log('✓ Recuperação concluída:', resultado);

        // Sincronizar senhas após recuperação de dados
        console.log('🔄 Sincronizando senhas...');
        await sincronizarSenhaComIndexedDB();
        
        // Validar integridade de senhas
        const validacao = await validarIntegridadeSenhas();
        console.log('✓ Validação de senhas:', validacao);

        const sessionData = localStorage.getItem('caderninho_session');
        if (sessionData) {
          const usuario = JSON.parse(sessionData) as UsuarioLogado;
          setUsuarioLogado(usuario);
        }
        
        // Não restaurar Conta Geral automaticamente - sempre começar em Login/Home
        // const contaGeral = localStorage.getItem('caderninho_conta_geral');
        // if (contaGeral === 'true') {
        //   setUsuarioGeral(true);
        // }
        
        // Limpar flag de conta geral ao carregar
        localStorage.removeItem('caderninho_conta_geral');
        setUsuarioGeral(false);
      } catch (error) {
        console.error('Erro ao verificar login:', error);
      } finally {
        setCarregando(false);
      }
    };

    // Timeout de 5 segundos para evitar loop infinito
    const timeoutId = setTimeout(() => {
      console.warn('Timeout ao carregar dados, continuando mesmo assim...');
      setCarregando(false);
    }, 5000);

    verificarLogin();

    // Monitorar mudanças no storage
    const cancelarMonitoramento = monitorarMudancasStorage();

    return () => {
      clearTimeout(timeoutId);
      cancelarMonitoramento();
    };
  }, []);

  const fazer_login = async (email: string, senha: string) => {
    try {
      // Garantir que admins estão presentes
      await garantirAdminsPresentes();

      // Tentar garantir que usuário existe (recupera dados antigos se necessário)
      let usuario = await garantirUsuarioExiste(email);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Em produção, usar hash de senha
      if (usuario.senha !== senha) {
        throw new Error('Senha incorreta');
      }

      // Salvar senha com segurança para recuperação após atualização
      console.log('💾 Salvando senha com segurança...');
      await salvarSenhaSegura(email, senha);

      // Se é admin, iniciar polling HTTP para sincronização
      if (usuario.tipo === 'admin') {
        console.log('🔄 Iniciando polling HTTP para sincronização...');
        try {
          const usuarioComDados: UsuarioLogado = {
            id: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
            tipo: usuario.tipo,
            telefone: usuario.telefone,
          };
          
          // Polling HTTP desabilitado - usar sincronização manual apenas
          // const cancelarPolling = iniciarPollingHTTP(usuarioComDados, 5000);
          // (window as any).cancelarPollingHTTP = cancelarPolling;
          console.log('✅ Autenticação concluída - sincronização manual habilitada');
        } catch (error) {
          console.error('⚠️ Erro ao iniciar polling HTTP:', error);
        }
      }

      const usuarioLogado: UsuarioLogado = {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        tipo: usuario.tipo,
        telefone: usuario.telefone,
      };

      setUsuarioLogado(usuarioLogado);
      localStorage.setItem('caderninho_session', JSON.stringify(usuarioLogado));
      localStorage.removeItem('caderninho_conta_geral');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const fazer_registro = async (email: string, senha: string, nome: string, tipo: TipoUsuario, telefone?: string) => {
    try {
      // Verificar se usuário já existe
      const usuarioExistente = await garantirUsuarioExiste(email);
      if (usuarioExistente) {
        throw new Error('Usuário já existe');
      }

      // Criar novo usuário
      const novoUsuario = {
        id: `user_${Date.now()}`,
        email,
        nome,
        tipo,
        telefone,
        senha,
        dataCriacao: Date.now(),
      };

      // Salvar no IndexedDB
      await db.adicionarUsuario(novoUsuario);

      // Salvar no localStorage
      const usuariosStorage = localStorage.getItem('caderninho_usuarios');
      const usuarios = usuariosStorage ? JSON.parse(usuariosStorage) : [];
      usuarios.push(novoUsuario);
      localStorage.setItem('caderninho_usuarios', JSON.stringify(usuarios));

      // Salvar senha com segurança
      await salvarSenhaSegura(email, senha);

      console.log('✅ Usuário registrado com sucesso');
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const fazer_logout = () => {
    // Cancelar polling HTTP
    const cancelarPolling = (window as any).cancelarPollingHTTP;
    if (cancelarPolling) {
      cancelarPolling();
      pararPolling();
    }

    // Cancelar sincronização periódica
    const cancelarSync = (window as any).cancelarSyncPeriodica;
    if (cancelarSync) {
      cancelarSync();
    }

    // Cancelar monitoramento de conexão
    const cancelarMonitor = (window as any).cancelarMonitorConexao;
    if (cancelarMonitor) {
      cancelarMonitor();
    }

    setUsuarioLogado(null);
    setUsuarioGeral(false);
    localStorage.removeItem('caderninho_session');
    localStorage.removeItem('caderninho_conta_geral');
  };

  const entrarComContaGeral = () => {
    setUsuarioGeral(true);
    localStorage.setItem('caderninho_conta_geral', 'true');
  };

  return (
    <AuthContext.Provider value={{ usuarioLogado, carregando, fazer_login, fazer_registro, fazer_logout, usuarioGeral, entrarComContaGeral }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
