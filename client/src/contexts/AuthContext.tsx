/**
 * Contexto de autenticação para o Caderninho Digital
 * Gerencia login, logout e estado do usuário logado
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioLogado, TipoUsuario } from '@/types';
import * as db from '@/lib/db';
import { garantirUsuarioExiste, recuperarDadosAutomaticamente, monitorarMudancasStorage } from '@/lib/autoRecovery';

interface AuthContextType {
  usuarioLogado: UsuarioLogado | null;
  carregando: boolean;
  fazer_login: (email: string, senha: string) => Promise<void>;
  fazer_registro: (email: string, senha: string, nome: string, tipo: TipoUsuario, telefone?: string, nomeEstabelecimento?: string) => Promise<void>;
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
        // Recuperar dados antigos automaticamente
        console.log('🔄 Iniciando recuperação automática de dados...');
        const resultado = await recuperarDadosAutomaticamente();
        console.log('✓ Recuperação concluída:', resultado);

        const sessionData = localStorage.getItem('caderninho_session');
        if (sessionData) {
          const usuario = JSON.parse(sessionData) as UsuarioLogado;
          setUsuarioLogado(usuario);
        }
        
        const contaGeral = localStorage.getItem('caderninho_conta_geral');
        if (contaGeral === 'true') {
          setUsuarioGeral(true);
        }
      } catch (error) {
        console.error('Erro ao verificar login:', error);
      } finally {
        setCarregando(false);
      }
    };

    verificarLogin();

    // Monitorar mudanças no storage
    const cancelarMonitoramento = monitorarMudancasStorage();

    return () => {
      cancelarMonitoramento();
    };
  }, []);

  const fazer_login = async (email: string, senha: string) => {
    try {
      // Tentar garantir que usuário existe (recupera dados antigos se necessário)
      let usuario = await garantirUsuarioExiste(email);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Em produção, usar hash de senha
      if (usuario.senha !== senha) {
        throw new Error('Senha incorreta');
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
      setUsuarioGeral(false);
    } catch (error) {
      throw error;
    }
  };

  const fazer_registro = async (email: string, senha: string, nome: string, tipo: TipoUsuario, telefone?: string, nomeEstabelecimento?: string) => {
    try {
      const usuarioExistente = await db.obterUsuarioPorEmail(email);
      if (usuarioExistente) {
        throw new Error('Usuário já existe');
      }

      const novoUsuario: any = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        senha, // Em produção, fazer hash
        nome,
        tipo,
        telefone: telefone || '',
        nomeEstabelecimento: nomeEstabelecimento || '',
        dataCriacao: Date.now(),
      };

      await db.adicionarUsuario(novoUsuario);

      const usuarioLogado: UsuarioLogado = {
        id: novoUsuario.id,
        email: novoUsuario.email,
        nome: novoUsuario.nome,
        tipo: novoUsuario.tipo,
        telefone: novoUsuario.telefone,
      };

      setUsuarioLogado(usuarioLogado);
      localStorage.setItem('caderninho_session', JSON.stringify(usuarioLogado));
      localStorage.removeItem('caderninho_conta_geral');
      setUsuarioGeral(false);
    } catch (error) {
      throw error;
    }
  };

  const fazer_logout = () => {
    setUsuarioLogado(null);
    setUsuarioGeral(false);
    localStorage.removeItem('caderninho_session');
    localStorage.removeItem('caderninho_conta_geral');
  };

  const entrarComContaGeral = () => {
    setUsuarioGeral(true);
    localStorage.setItem('caderninho_conta_geral', 'true');
    localStorage.removeItem('caderninho_session');
    setUsuarioLogado(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuarioLogado,
        carregando,
        fazer_login,
        fazer_registro,
        fazer_logout,
        usuarioGeral,
        entrarComContaGeral,
      }}
    >
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
