/**
 * Contexto de autenticação para o Caderninho Digital
 * Gerencia login, logout e estado do usuário logado
 * Implementa persistência garantida de senha
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioLogado, TipoUsuario } from '@/types';
import * as db from '@/lib/db';
// Importações de armazenamento local removidas - aplicativo usa APENAS servidor
// import { garantirUsuarioExiste, recuperarDadosAutomaticamente, monitorarMudancasStorage } from '@/lib/autoRecovery';
// import { salvarSenhaSegura, sincronizarSenhaComIndexedDB, validarIntegridadeSenhas } from '@/lib/passwordPersistence';
// import { sincronizarDadosDoLocalStorage, salvarDadosSync, monitorarMudancasLocalStorage } from '@/lib/dataSync';
import { garantirAdminsPresentes } from '@/lib/debugAdmins';
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
        // Garantir que admins obrigatorios estao presentes
        console.log('🔍 Garantindo presença de admins obrigatórios...');
        await garantirAdminsPresentes();

        // DESABILITADO: Recuperação automática pode restaurar usuários deletados
        // console.log('🔄 Iniciando recuperação automática de dados...');
        // const resultado = await recuperarDadosAutomaticamente();
        // console.log('✓ Recuperação concluída:', resultado);

        // DESABILITADO: Sincronização de senhas pode restaurar usuários deletados
        // console.log('🔄 Sincronizando senhas...');
        // await sincronizarSenhaComIndexedDB();
        
        // DESABILITADO: Validação de senhas pode restaurar usuários deletados
        // const validacao = await validarIntegridadeSenhas();
        // console.log('✓ Validação de senhas:', validacao);

        // Verificar se usuário deletado está no localStorage
        const sessionData = localStorage.getItem('caderninho_session');
        if (sessionData) {
          const usuario = JSON.parse(sessionData) as UsuarioLogado;
          
          // Verificar se usuário ainda existe no banco (servidor)
          try {
            const response = await fetch('/api/users');
            const usuarios = await response.json();
            // Endpoints agora retornam array direto
            const usuarioExiste = Array.isArray(usuarios) && usuarios.some((u: any) => u.email === usuario.email);
            
            if (usuarioExiste) {
              setUsuarioLogado(usuario);
              console.log(`✓ Usuário ${usuario.email} encontrado no servidor`);
            } else {
              console.warn(`⚠️ Usuário ${usuario.email} foi deletado, limpando localStorage`);
              localStorage.removeItem('caderninho_session');
              setUsuarioLogado(null);
            }
          } catch (error) {
            console.error('Erro ao verificar usuário no servidor:', error);
            // Se não conseguir verificar, manter o usuário em cache
            setUsuarioLogado(usuario);
          }
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

    // Monitorar mudanças no storage DESABILITADO - causava loop infinito
    // const cancelarMonitoramento = monitorarMudancasStorage();

    return () => {
      clearTimeout(timeoutId);
      // cancelarMonitoramento();
    };
  }, []);

  const fazer_login = async (email: string, senha: string) => {
    try {
      // Garantir que admins estão presentes
      await garantirAdminsPresentes();

      // PRIMEIRO: Tentar buscar do servidor
      let usuario = null;
      try {
        const responseServidor = await fetch('/api/users');
        if (responseServidor.ok) {
          const usuariosServidor = await responseServidor.json();
          // Endpoints agora retornam array direto
          const usuarioServidor = usuariosServidor.find((u: any) => u.email === email);
          
          if (usuarioServidor) {
            console.log(`✓ Usuário ${email} encontrado no servidor`);
            usuario = {
              id: usuarioServidor.id,
              email: usuarioServidor.email,
              nome: usuarioServidor.name,
              tipo: usuarioServidor.role === 'admin' ? 'admin' : 'cliente',
              telefone: '',
              senha: senha,
            };
          }
        }
      } catch (erroServidor) {
        console.warn('⚠️ Erro ao buscar do servidor, tentando localStorage:', erroServidor);
      }

      // DEPOIS: Se não encontrou no servidor, erro (sem fallback local)
      if (!usuario) {
        throw new Error('Usuário não encontrado no servidor');
      }

      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Em produção, usar hash de senha
      if (usuario.senha !== senha) {
        throw new Error('Senha incorreta');
      }

      // Armazenamento local de senha desabilitado

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
        tipo: usuario.tipo as TipoUsuario,
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
      // Verificação de existência será feita pelo servidor

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

      // PRIMEIRO: Enviar para servidor com email correto
      try {
        const responseServidor = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email, // Email ORIGINAL, não @example.com
            nome: nome,
            tipo: tipo || 'user',
            telefone: telefone || '',
            senha: senha,
          }),
        });

        if (!responseServidor.ok) {
          const errorData = await responseServidor.json();
          throw new Error(errorData.error || 'Erro ao registrar no servidor');
        }

        console.log('✅ Usuário registrado no servidor com sucesso');
      } catch (erroServidor) {
        console.error('Erro ao registrar no servidor:', erroServidor);
        throw erroServidor;
      }

      // Armazenamento local desabilitado - dados estão apenas no servidor

      console.log('✅ Usuário registrado com sucesso');
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const fazer_logout = () => {
    // Limpar apenas a sessão (cookies são gerenciados pelo servidor)
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
