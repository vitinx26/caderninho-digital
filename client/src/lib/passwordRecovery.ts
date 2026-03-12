/**
 * Serviço de recuperação de senha
 * Implementa fluxo seguro de reset de senha
 */

import { Usuario } from '@/types';
import * as db from './db';

/**
 * Gerar token de recuperação de senha
 */
export function gerarTokenRecuperacao(): string {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

/**
 * Solicitar recuperação de senha
 * Simula envio de email com link de recuperação
 */
export async function solicitarRecuperacaoSenha(email: string): Promise<{
  sucesso: boolean;
  mensagem: string;
  token?: string;
}> {
  try {
    const usuario = await db.obterUsuarioPorEmail(email);

    if (!usuario) {
      // Não revelar se email existe ou não (segurança)
      return {
        sucesso: true,
        mensagem: 'Se o email existe, um link de recuperação foi enviado',
      };
    }

    // Gerar token
    const token = gerarTokenRecuperacao();
    const dataExpiracao = Date.now() + 3600000; // 1 hora

    // Armazenar token no localStorage (em produção, seria no backend)
    const tokenData = {
      email,
      token,
      dataExpiracao,
      usado: false,
    };

    localStorage.setItem(`recovery_token_${email}`, JSON.stringify(tokenData));

    // Em produção, enviar email com link contendo o token
    console.log(`📧 Email de recuperação enviado para ${email}`);
    console.log(`🔑 Token: ${token}`);

    return {
      sucesso: true,
      mensagem: 'Link de recuperação enviado para seu email',
      token, // Retornar token apenas para desenvolvimento
    };
  } catch (error) {
    console.error('Erro ao solicitar recuperação:', error);
    return {
      sucesso: false,
      mensagem: 'Erro ao solicitar recuperação de senha',
    };
  }
}

/**
 * Validar token de recuperação
 */
export function validarTokenRecuperacao(email: string, token: string): {
  valido: boolean;
  mensagem: string;
} {
  try {
    const tokenData = localStorage.getItem(`recovery_token_${email}`);

    if (!tokenData) {
      return {
        valido: false,
        mensagem: 'Token não encontrado',
      };
    }

    const dados = JSON.parse(tokenData);

    // Verificar se token foi usado
    if (dados.usado) {
      return {
        valido: false,
        mensagem: 'Token já foi utilizado',
      };
    }

    // Verificar se token expirou
    if (Date.now() > dados.dataExpiracao) {
      return {
        valido: false,
        mensagem: 'Token expirou',
      };
    }

    // Verificar se token corresponde
    if (dados.token !== token) {
      return {
        valido: false,
        mensagem: 'Token inválido',
      };
    }

    return {
      valido: true,
      mensagem: 'Token válido',
    };
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return {
      valido: false,
      mensagem: 'Erro ao validar token',
    };
  }
}

/**
 * Resetar senha com token válido
 */
export async function resetarSenhaComToken(
  email: string,
  token: string,
  novaSenha: string
): Promise<{
  sucesso: boolean;
  mensagem: string;
}> {
  try {
    // Validar token
    const validacao = validarTokenRecuperacao(email, token);
    if (!validacao.valido) {
      return {
        sucesso: false,
        mensagem: validacao.mensagem,
      };
    }

    // Obter usuário
    const usuario = await db.obterUsuarioPorEmail(email);
    if (!usuario) {
      return {
        sucesso: false,
        mensagem: 'Usuário não encontrado',
      };
    }

    // Validar nova senha
    if (!novaSenha || novaSenha.length < 6) {
      return {
        sucesso: false,
        mensagem: 'Senha deve ter no mínimo 6 caracteres',
      };
    }

    // Atualizar senha
    const usuarioAtualizado = {
      ...usuario,
      senha: novaSenha,
      dataAtualizacao: Date.now(),
    };

    await db.atualizarUsuario(usuarioAtualizado);

    // Marcar token como usado
    const tokenData = JSON.parse(localStorage.getItem(`recovery_token_${email}`) || '{}');
    tokenData.usado = true;
    localStorage.setItem(`recovery_token_${email}`, JSON.stringify(tokenData));

    console.log(`✓ Senha resetada para ${email}`);

    return {
      sucesso: true,
      mensagem: 'Senha alterada com sucesso',
    };
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return {
      sucesso: false,
      mensagem: 'Erro ao alterar senha',
    };
  }
}

/**
 * Solicitar recuperação de senha por pergunta de segurança
 * Alternativa quando email não está disponível
 */
export async function recuperarPorPerguntaSeguranca(
  email: string,
  respostaSeguranca: string
): Promise<{
  sucesso: boolean;
  mensagem: string;
  token?: string;
}> {
  try {
    const usuario = await db.obterUsuarioPorEmail(email);

    if (!usuario) {
      return {
        sucesso: false,
        mensagem: 'Usuário não encontrado',
      };
    }

    // Verificar resposta de segurança (em produção, seria armazenada com hash)
    // Por enquanto, usar uma pergunta simples
    const perguntaPadrao = 'Qual é o seu nome?';
    const respostaEsperada = usuario.nome.toLowerCase();

    if (respostaSeguranca.toLowerCase() !== respostaEsperada) {
      return {
        sucesso: false,
        mensagem: 'Resposta de segurança incorreta',
      };
    }

    // Gerar token
    const token = gerarTokenRecuperacao();
    const dataExpiracao = Date.now() + 3600000; // 1 hora

    const tokenData = {
      email,
      token,
      dataExpiracao,
      usado: false,
    };

    localStorage.setItem(`recovery_token_${email}`, JSON.stringify(tokenData));

    return {
      sucesso: true,
      mensagem: 'Identidade verificada, você pode resetar sua senha',
      token,
    };
  } catch (error) {
    console.error('Erro ao recuperar por pergunta:', error);
    return {
      sucesso: false,
      mensagem: 'Erro ao processar recuperação',
    };
  }
}
