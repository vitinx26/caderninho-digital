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

      // Salvar senha com segurança para recuperação após atualização
      console.log('💾 Salvando senha com segurança...');
      await salvarSenhaSegura(email, senha);

      // Se é admin, sincronizar dados compartilhados
      if (usuario.tipo === 'admin') {
        console.log('🔄 Sincronizando dados compartilhados entre admins...');
        await sincronizarDadosDoLocalStorage();
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

      // Salvar senha com segurança imediatamente após registro
      console.log('💾 Salvando senha do novo usuário com segurança...');
      await salvarSenhaSegura(email, senha);

      // Criar cliente automaticamente para o novo usuário
      // Isso permite que o usuário apareça na Conta Geral e em listas de seleção
      try {
        const novoCliente = {
          id: novoUsuario.id, // Usar mesmo ID do usuário para vinculação
          nome: novoUsuario.nome,
          telefone: novoUsuario.telefone,
          email: novoUsuario.email,
          dataCriacao: Date.now(),
          ativo: true,
          adminId: tipo === 'admin' ? novoUsuario.id : undefined, // Se é admin, é seu próprio admin
        };
        await db.adicionarCliente(novoCliente);
        console.log('✓ Cliente criado automaticamente para novo usuário:', novoUsuario.email);
      } catch (e) {
        console.warn('Erro ao criar cliente para novo usuário:', e);
        // Não falhar o registro se cliente não for criado
      }

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

      // Se é novo admin, salvar dados para sincronização
      if (tipo === 'admin') {
        console.log('💾 Salvando dados do novo admin para sincronização...');
        const clientes = await db.obterClientes();
        const lancamentos = await db.obterTodosLancamentos();
        salvarDadosSync(clientes, lancamentos);
      }
    } catch (error) {
      throw error;
    }
  };

  const fazer_logout = () => {
    // Se era admin, salvar dados para sincronização com outros admins
    if (usuarioLogado?.tipo === 'admin') {
      console.log('💾 Salvando dados para sincronização entre admins...');
      (async () => {
        try {
          const clientes = await db.obterClientes();
          const lancamentos = await db.obterTodosLancamentos();
          salvarDadosSync(clientes, lancamentos);
        } catch (e) {
          console.error('Erro ao salvar dados para sincronização:', e);
        }
      })();
    }

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
