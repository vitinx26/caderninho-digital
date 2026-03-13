/**
 * Script de correção de dados
 * Execute no console do navegador para corrigir problemas de senha e clientes
 */

export function fixVictorPassword() {
  try {
    // Obter usuários do localStorage
    const usuariosStr = localStorage.getItem('caderninho_usuarios');
    if (!usuariosStr) {
      console.error('❌ Nenhum usuário encontrado no localStorage');
      return;
    }

    const usuarios = JSON.parse(usuariosStr);
    console.log('📋 Usuários encontrados:', usuarios);

    // Encontrar usuário victorhgs26@gmail.com
    const victorIndex = usuarios.findIndex((u: any) => u.email === 'victorhgs26@gmail.com');
    if (victorIndex === -1) {
      console.error('❌ Usuário victorhgs26@gmail.com não encontrado');
      console.log('Usuários disponíveis:', usuarios.map((u: any) => u.email));
      return;
    }

    // Atualizar senha
    usuarios[victorIndex].senha = 'Vitinx@26';
    localStorage.setItem('caderninho_usuarios', JSON.stringify(usuarios));
    
    console.log('✅ Senha do usuário victorhgs26@gmail.com alterada para "Vitinx@26"');
    console.log('📝 Usuário atualizado:', usuarios[victorIndex]);
  } catch (error) {
    console.error('❌ Erro ao corrigir senha:', error);
  }
}

export function fixVitinhoClient() {
  try {
    // Obter clientes do localStorage
    const clientesStr = localStorage.getItem('caderninho_clientes');
    if (!clientesStr) {
      console.error('❌ Nenhum cliente encontrado no localStorage');
      return;
    }

    const clientes = JSON.parse(clientesStr);
    console.log('📋 Clientes encontrados:', clientes);

    // Procurar por Vitinho
    const vitinhoIndex = clientes.findIndex((c: any) => 
      c.nome.toLowerCase().includes('vitinho') || 
      c.nome.toLowerCase().includes('vitor')
    );

    if (vitinhoIndex === -1) {
      console.error('❌ Cliente Vitinho não encontrado');
      console.log('Clientes disponíveis:', clientes.map((c: any) => c.nome));
      
      // Tentar procurar em outras chaves de localStorage
      console.log('\n🔍 Procurando em outras chaves de localStorage...');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('cliente')) {
          console.log(`Chave: ${key}`);
          const value = localStorage.getItem(key);
          console.log(`Valor: ${value}`);
        }
      }
      return;
    }

    console.log('✅ Cliente Vitinho encontrado:', clientes[vitinhoIndex]);
    console.log('📝 Dados do cliente:', JSON.stringify(clientes[vitinhoIndex], null, 2));
  } catch (error) {
    console.error('❌ Erro ao procurar cliente Vitinho:', error);
  }
}

export function listAllData() {
  try {
    console.log('=== DADOS ARMAZENADOS ===\n');

    // Listar todas as chaves do localStorage
    console.log('📦 Chaves do localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`  - ${key}`);
    }

    console.log('\n👥 Usuários:');
    const usuarios = localStorage.getItem('caderninho_usuarios');
    if (usuarios) {
      console.log(JSON.parse(usuarios));
    } else {
      console.log('  Nenhum usuário encontrado');
    }

    console.log('\n👤 Clientes:');
    const clientes = localStorage.getItem('caderninho_clientes');
    if (clientes) {
      console.log(JSON.parse(clientes));
    } else {
      console.log('  Nenhum cliente encontrado');
    }

    console.log('\n💰 Lançamentos:');
    const lancamentos = localStorage.getItem('caderninho_lancamentos');
    if (lancamentos) {
      console.log(JSON.parse(lancamentos));
    } else {
      console.log('  Nenhum lançamento encontrado');
    }
  } catch (error) {
    console.error('❌ Erro ao listar dados:', error);
  }
}

// Exportar para uso no console
if (typeof window !== 'undefined') {
  (window as any).fixVictorPassword = fixVictorPassword;
  (window as any).fixVitinhoClient = fixVitinhoClient;
  (window as any).listAllData = listAllData;
  console.log('✅ Funções de correção disponíveis:');
  console.log('  - fixVictorPassword() - Corrige senha do victor');
  console.log('  - fixVitinhoClient() - Procura cliente Vitinho');
  console.log('  - listAllData() - Lista todos os dados');
}
