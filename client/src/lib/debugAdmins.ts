/**
 * Script de Debug para Restaurar Admins - ADAPTADO PARA SERVIDOR
 * Garante que victorhgs26@gmail.com esteja salvo no servidor
 * NOTA: Armazenamento local está desabilitado - usa apenas servidor
 */

/**
 * Dados dos admins que devem estar sempre presentes
 * NOTA: Apenas victorhgs26@gmail.com deve ser restaurado automaticamente
 * Outros admins deletados não devem ser restaurados
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
];

/**
 * Verificar se admins estão salvos no servidor
 */
export async function verificarAdmins(): Promise<{
  encontrados: string[];
  faltando: string[];
}> {
  const encontrados: string[] = [];
  const faltando: string[] = [];

  try {
    // Buscar usuários do servidor
    const response = await fetch('/api/users');
    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar usuários do servidor');
      return { encontrados, faltando };
    }

    const data = await response.json();
    const usuariosServidor = data.data || [];

    for (const admin of ADMINS_OBRIGATORIOS) {
      const usuarioExistente = usuariosServidor.find((u: any) => u.email === admin.email);
      if (usuarioExistente) {
        encontrados.push(admin.email);
        console.log(`✓ Admin ${admin.email} encontrado no servidor`);
      } else {
        faltando.push(admin.email);
        console.log(`❌ Admin ${admin.email} NÃO encontrado no servidor`);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar admins no servidor:', error);
  }

  return { encontrados, faltando };
}

/**
 * Restaurar admins que estão faltando no servidor
 */
export async function restaurarAdmins(): Promise<{
  restaurados: string[];
  erros: string[];
}> {
  const restaurados: string[] = [];
  const erros: string[] = [];

  try {
    // Primeiro, verificar quais admins já existem
    const response = await fetch('/api/users');
    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar usuários do servidor');
      return { restaurados, erros };
    }

    const data = await response.json();
    const usuariosServidor = data.data || [];

    for (const admin of ADMINS_OBRIGATORIOS) {
      try {
        // Verificar se já existe no servidor
        const usuarioExistente = usuariosServidor.find((u: any) => u.email === admin.email);

        if (usuarioExistente) {
          console.log(`✓ Admin ${admin.email} já existe no servidor, pulando...`);
          continue;
        }

        // Criar novo admin no servidor
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: admin.email,
            nome: admin.nome,
            tipo: 'admin',
            telefone: admin.telefone,
            senha: admin.senha,
          }),
        });

        if (createResponse.ok) {
          restaurados.push(admin.email);
          console.log(`✓ Admin ${admin.email} restaurado no servidor com sucesso`);
        } else {
          const errorData = await createResponse.json();
          erros.push(admin.email);
          console.error(`❌ Erro ao restaurar ${admin.email}:`, errorData.error);
        }
      } catch (error) {
        erros.push(admin.email);
        console.error(`❌ Erro ao restaurar ${admin.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Erro ao restaurar admins:', error);
  }

  return { restaurados, erros };
}

/**
 * Função principal para garantir que admins estão presentes
 * Verifica no servidor e restaura se necessário
 */
export async function garantirAdminsPresentes(): Promise<void> {
  try {
    console.log('🔍 Verificando presença de admins obrigatórios no servidor...');

    // Verificar quais admins estão presentes
    const { encontrados, faltando } = await verificarAdmins();

    if (faltando.length === 0) {
      console.log('✅ Todos os admins obrigatórios estão presentes');
      return;
    }

    // Se faltam admins, tentar restaurar
    console.log(`⚠️ ${faltando.length} admin(s) faltando, tentando restaurar...`);
    const { restaurados, erros } = await restaurarAdmins();

    if (erros.length > 0) {
      console.error(`❌ Erro ao restaurar ${erros.length} admin(s): ${erros.join(', ')}`);
    }

    if (restaurados.length > 0) {
      console.log(`✅ ${restaurados.length} admin(s) restaurado(s): ${restaurados.join(', ')}`);
    }
  } catch (error) {
    console.error('Erro ao garantir presença de admins:', error);
  }
}

/**
 * Sincronizar admins entre localStorage e servidor - DESABILITADO
 * Armazenamento local não é mais permitido
 */
export async function sincronizarAdminsLocal(): Promise<boolean> {
  console.warn('Sincronização local desabilitada. Aplicativo usa APENAS servidor.');
  return false;
}
