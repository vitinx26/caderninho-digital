/**
 * Serviço de autenticação com Google
 * Integra login via Google usando OAuth 2.0
 */

import { Usuario, UsuarioLogado } from '@/types';
import * as db from './db';

/**
 * Configuração do Google OAuth
 * Substitua pelos valores reais da sua aplicação
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'seu-client-id.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

/**
 * Tipo de dados retornados pelo Google
 */
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

/**
 * Gerar URL de login do Google
 */
export function gerarURLLoginGoogle(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Processar callback do Google
 * Chamado após usuário autorizar a aplicação
 */
export async function processarCallbackGoogle(code: string): Promise<{
  sucesso: boolean;
  usuario?: UsuarioLogado;
  mensagem: string;
}> {
  try {
    // Em desenvolvimento, simular resposta do Google
    if (code === 'dev-code') {
      const usuarioSimulado: GoogleUser = {
        id: 'google-dev-123',
        email: 'usuario@gmail.com',
        name: 'Usuário Teste',
        picture: 'https://via.placeholder.com/150',
      };

      return await autenticarComGoogle(usuarioSimulado);
    }

    // Em produção, trocar code por token com backend
    // const response = await fetch('/api/auth/google/token', {
    //   method: 'POST',
    //   body: JSON.stringify({ code }),
    // });

    // const googleUser = await response.json();
    // return await autenticarComGoogle(googleUser);

    return {
      sucesso: false,
      mensagem: 'Erro ao processar autenticação com Google',
    };
  } catch (error) {
    console.error('Erro ao processar callback Google:', error);
    return {
      sucesso: false,
      mensagem: 'Erro ao processar autenticação com Google',
    };
  }
}

/**
 * Autenticar usuário com dados do Google
 */
async function autenticarComGoogle(googleUser: GoogleUser): Promise<{
  sucesso: boolean;
  usuario?: UsuarioLogado;
  mensagem: string;
}> {
  try {
    // Verificar se usuário já existe
    let usuario = await db.obterUsuarioPorEmail(googleUser.email);

    if (!usuario) {
      // Criar novo usuário
      const novoUsuario: Usuario = {
        id: `google-${googleUser.id}`,
        email: googleUser.email,
        nome: googleUser.name,
        tipo: 'cliente', // Novos usuários do Google são clientes por padrão
        telefone: '',
        senha: `google-${googleUser.id}`, // Senha dummy para usuários Google
        dataCriacao: Date.now(),
        templateWhatsapp: '',
      };

      await db.adicionarUsuario(novoUsuario);
      usuario = novoUsuario;

      console.log(`✓ Novo usuário criado via Google: ${googleUser.email}`);
    }

    // Retornar usuário logado
    const usuarioLogado: UsuarioLogado = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      tipo: usuario.tipo,
      telefone: usuario.telefone,
    };

    return {
      sucesso: true,
      usuario: usuarioLogado,
      mensagem: 'Login com Google realizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao autenticar com Google:', error);
    return {
      sucesso: false,
      mensagem: 'Erro ao autenticar com Google',
    };
  }
}

/**
 * Inicializar script do Google
 * Deve ser chamado uma vez ao carregar a página
 */
export function inicializarGoogleAuth(): void {
  // Carregar script do Google
  if (!window.google) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        console.log('✓ Google Auth SDK carregado');
      }
    };
  }
}

/**
 * Renderizar botão de login do Google
 * Usar em componentes React
 */
export function renderizarBotaoGoogle(elementId: string): void {
  const googleWindow = window as any;
  if (!googleWindow.google || !googleWindow.google.accounts) {
    console.error('Google Auth SDK não carregado');
    return;
  }

  try {
    googleWindow.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      }
    );
  } catch (error) {
    console.error('Erro ao renderizar botão Google:', error);
  }
}


