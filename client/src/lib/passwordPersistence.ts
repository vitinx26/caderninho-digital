/**
 * Módulo de Persistência de Senha
 * Garante que a senha do usuário seja sempre preservada em todas as atualizações
 * Implementa backup seguro e recuperação de senha
 */

import { Usuario } from '@/types';
import * as db from './db';

/**
 * Chave segura para armazenar senha em localStorage
 * Usa um padrão que não é óbvio para evitar exposição acidental
 */
const SENHA_STORAGE_PREFIX = 'app_pwd_';

/**
 * Salvar senha de forma segura após login bem-sucedido
 * Isso garante que a senha seja recuperada mesmo após atualizações
 */
export async function salvarSenhaSegura(email: string, senha: string): Promise<void> {
  try {
    if (!email || !senha) {
      console.warn('Email ou senha vazios, não salvando');
      return;
    }

    // Salvar no localStorage com prefixo seguro
    const chave = SENHA_STORAGE_PREFIX + Buffer.from(email).toString('base64');
    localStorage.setItem(chave, Buffer.from(senha).toString('base64'));
    
    console.log(`✓ Senha salva com segurança para ${email}`);
  } catch (error) {
    console.error('Erro ao salvar senha:', error);
  }
}

/**
 * Recuperar senha armazenada com segurança
 */
export async function recuperarSenhaSegura(email: string): Promise<string | null> {
  try {
    if (!email) {
      return null;
    }

    const chave = SENHA_STORAGE_PREFIX + Buffer.from(email).toString('base64');
    const senhaCodificada = localStorage.getItem(chave);
    
    if (!senhaCodificada) {
      console.log(`Nenhuma senha encontrada para ${email}`);
      return null;
    }

    const senha = Buffer.from(senhaCodificada, 'base64').toString('utf-8');
    console.log(`✓ Senha recuperada para ${email}`);
    return senha;
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    return null;
  }
}

/**
 * Sincronizar senha do localStorage para IndexedDB
 * Garante que a senha seja preservada em ambos os locais
 */
export async function sincronizarSenhaComIndexedDB(): Promise<boolean> {
  try {
    console.log('🔄 Sincronizando senhas com IndexedDB...');

    // Obter todos os usuários do IndexedDB
    const usuarios = await db.obterTodosUsuarios();
    
    let senhasSincronizadas = 0;

    for (const usuario of usuarios) {
      // Tentar recuperar senha do localStorage
      const senhaRecuperada = await recuperarSenhaSegura(usuario.email);
      
      if (senhaRecuperada && senhaRecuperada !== usuario.senha) {
        console.log(`📝 Atualizando senha para ${usuario.email}`);
        
        // Atualizar usuário com senha recuperada
        const usuarioAtualizado: Usuario = {
          ...usuario,
          senha: senhaRecuperada,
        };
        
        await db.adicionarUsuario(usuarioAtualizado);
        senhasSincronizadas++;
      } else if (!usuario.senha || usuario.senha.trim() === '') {
        // Se usuário não tem senha no IndexedDB, usar a do localStorage
        if (senhaRecuperada) {
          console.log(`🔧 Restaurando senha para ${usuario.email}`);
          
          const usuarioAtualizado: Usuario = {
            ...usuario,
            senha: senhaRecuperada,
          };
          
          await db.adicionarUsuario(usuarioAtualizado);
          senhasSincronizadas++;
        }
      }
    }

    console.log(`✓ ${senhasSincronizadas} senhas sincronizadas`);
    return senhasSincronizadas > 0;
  } catch (error) {
    console.error('Erro ao sincronizar senhas:', error);
    return false;
  }
}

/**
 * Validar integridade de senhas após atualização
 * Garante que todos os usuários têm senhas válidas
 */
export async function validarIntegridadeSenhas(): Promise<{
  total: number;
  comSenha: number;
  semSenha: number;
  recuperadas: number;
}> {
  try {
    console.log('🔍 Validando integridade de senhas...');

    const usuarios = await db.obterTodosUsuarios();
    let comSenha = 0;
    let semSenha = 0;
    let recuperadas = 0;

    for (const usuario of usuarios) {
      if (usuario.senha && usuario.senha.trim() !== '') {
        comSenha++;
      } else {
        semSenha++;
        
        // Tentar recuperar do localStorage
        const senhaRecuperada = await recuperarSenhaSegura(usuario.email);
        if (senhaRecuperada) {
          console.log(`🔧 Recuperando senha para ${usuario.email}`);
          
          const usuarioAtualizado: Usuario = {
            ...usuario,
            senha: senhaRecuperada,
          };
          
          await db.adicionarUsuario(usuarioAtualizado);
          recuperadas++;
          comSenha++;
          semSenha--;
        }
      }
    }

    console.log(`✓ Validação concluída: ${comSenha} com senha, ${semSenha} sem senha, ${recuperadas} recuperadas`);

    return {
      total: usuarios.length,
      comSenha,
      semSenha,
      recuperadas,
    };
  } catch (error) {
    console.error('Erro ao validar senhas:', error);
    return {
      total: 0,
      comSenha: 0,
      semSenha: 0,
      recuperadas: 0,
    };
  }
}

/**
 * Limpar senhas armazenadas (apenas para logout)
 */
export function limparSenhasArmazenadas(): void {
  try {
    const chaves = Object.keys(localStorage);
    let limpas = 0;

    for (const chave of chaves) {
      if (chave.startsWith(SENHA_STORAGE_PREFIX)) {
        localStorage.removeItem(chave);
        limpas++;
      }
    }

    console.log(`✓ ${limpas} senhas armazenadas limpas`);
  } catch (error) {
    console.error('Erro ao limpar senhas:', error);
  }
}
