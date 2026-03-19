/**
 * Script de Debug para Restaurar Admins
 * Garante que victorhgs26@gmail.com e trc290382@gmail.com estejam salvos
 */

import * as db from './db';

/**
 * Dados dos admins que devem estar sempre presentes
 */
const ADMINS_OBRIGATORIOS = [
  {
    id: 'admin-victorhgs26',
    email: 'victorhgs26@gmail.com',
    senha: 'Vitinx@26',
    nome: 'Victor',
    tipo: 'admin' as const,
    telefone: '11999999999',
    dataCriacao: Date.now(),
  },
  {
    id: 'admin-trc290382',
    email: 'trc290382@gmail.com',
    senha: 'Trc@123456',
    nome: 'TRC',
    tipo: 'admin' as const,
    telefone: '11988888888',
    dataCriacao: Date.now(),
  },
];

/**
 * Verificar se admins estão salvos
 */
export async function verificarAdmins(): Promise<{
  encontrados: string[];
  faltando: string[];
}> {
  const encontrados: string[] = [];
  const faltando: string[] = [];

  for (const admin of ADMINS_OBRIGATORIOS) {
    try {
      const usuarioExistente = await db.obterUsuarioPorEmail(admin.email);
      if (usuarioExistente) {
        encontrados.push(admin.email);
        console.log(`✓ Admin ${admin.email} encontrado`);
      } else {
        faltando.push(admin.email);
        console.log(`❌ Admin ${admin.email} NÃO encontrado`);
      }
    } catch (error) {
      faltando.push(admin.email);
      console.error(`Erro ao verificar ${admin.email}:`, error);
    }
  }

  return { encontrados, faltando };
}

/**
 * Restaurar admins que estão faltando
 */
export async function restaurarAdmins(): Promise<{
  restaurados: string[];
  erros: string[];
}> {
  const restaurados: string[] = [];
  const erros: string[] = [];

  for (const admin of ADMINS_OBRIGATORIOS) {
    try {
      // Verificar se já existe
      const usuarioExistente = await db.obterUsuarioPorEmail(admin.email);
      
      if (usuarioExistente) {
        console.log(`✓ Admin ${admin.email} já existe, pulando...`);
        continue;
      }

      // Adicionar novo admin
      await db.adicionarUsuario(admin);
      restaurados.push(admin.email);
      console.log(`✓ Admin ${admin.email} restaurado com sucesso`);

      // Salvar também no localStorage para persistência
      const usuariosLocal = localStorage.getItem('caderninho_usuarios');
      let usuarios = [];

      if (usuariosLocal) {
        try {
          usuarios = JSON.parse(usuariosLocal);
        } catch (e) {
          usuarios = [];
        }
      }

      // Adicionar admin ao localStorage se não existir
      const adminExisteLocal = usuarios.some((u: any) => u.email === admin.email);
      if (!adminExisteLocal) {
        usuarios.push(admin);
        localStorage.setItem('caderninho_usuarios', JSON.stringify(usuarios));
        console.log(`✓ Admin ${admin.email} salvo no localStorage`);
      }
    } catch (error) {
      erros.push(admin.email);
      console.error(`❌ Erro ao restaurar ${admin.email}:`, error);
    }
  }

  return { restaurados, erros };
}

/**
 * Sincronizar admins entre localStorage e IndexedDB
 */
export async function sincronizarAdminsLocal(): Promise<boolean> {
  try {
    console.log('🔄 Sincronizando admins entre localStorage e IndexedDB...');

    // Obter admins do localStorage
    const usuariosLocal = localStorage.getItem('caderninho_usuarios');
    if (!usuariosLocal) {
      console.log('⚠️ Nenhum usuário no localStorage');
      return false;
    }

    const usuarios = JSON.parse(usuariosLocal);
    const admins = usuarios.filter((u: any) => u.tipo === 'admin');

    console.log(`Encontrados ${admins.length} admins no localStorage`);

    // Adicionar cada admin ao IndexedDB
    for (const admin of admins) {
      try {
        const usuarioExistente = await db.obterUsuarioPorEmail(admin.email);
        if (!usuarioExistente) {
          await db.adicionarUsuario(admin);
          console.log(`✓ Admin ${admin.email} sincronizado`);
        }
      } catch (error) {
        console.error(`Erro ao sincronizar ${admin.email}:`, error);
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao sincronizar admins:', error);
    return false;
  }
}

/**
 * Garantir que admins estão sempre presentes
 * Chamado ao iniciar o app
 */
export async function garantirAdminsPresentes(): Promise<void> {
  try {
    console.log('🔍 Verificando presença de admins...');

    // 1. Sincronizar localStorage com IndexedDB
    await sincronizarAdminsLocal();

    // 2. Verificar quais admins estão faltando
    const { faltando } = await verificarAdmins();

    // 3. Se faltarem, restaurar
    if (faltando.length > 0) {
      console.log(`⚠️ ${faltando.length} admin(s) faltando, restaurando...`);
      const { restaurados, erros } = await restaurarAdmins();
      console.log(`✓ ${restaurados.length} admin(s) restaurado(s)`);
      if (erros.length > 0) {
        console.error(`❌ Erro ao restaurar ${erros.length} admin(s):`, erros);
      }
    } else {
      console.log('✓ Todos os admins estão presentes');
    }
  } catch (error) {
    console.error('Erro ao garantir presença de admins:', error);
  }
}

/**
 * Validar integridade das senhas dos admins
 */
export async function validarSenhasAdmins(): Promise<{
  validas: string[];
  invalidas: string[];
}> {
  const validas: string[] = [];
  const invalidas: string[] = [];

  for (const admin of ADMINS_OBRIGATORIOS) {
    try {
      const usuario = await db.obterUsuarioPorEmail(admin.email);
      if (usuario && usuario.senha === admin.senha) {
        validas.push(admin.email);
        console.log(`✓ Senha de ${admin.email} válida`);
      } else if (usuario) {
        invalidas.push(admin.email);
        console.log(`❌ Senha de ${admin.email} inválida ou diferente`);
      }
    } catch (error) {
      invalidas.push(admin.email);
      console.error(`Erro ao validar senha de ${admin.email}:`, error);
    }
  }

  return { validas, invalidas };
}
