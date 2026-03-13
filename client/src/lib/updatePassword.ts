/**
 * Script para atualizar senha do usuário victorhgs26@gmail.com
 * Execute no console do navegador: updateVictorPassword()
 */

export async function updateVictorPassword() {
  try {
    console.log('🔍 Procurando usuário victorhgs26@gmail.com...');
    
    // Abrir IndexedDB
    const dbName = 'CaderninhoDigital';
    const dbVersion = 3;
    
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onerror = () => {
      console.error('❌ Erro ao abrir IndexedDB:', request.error);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      console.log('✅ IndexedDB aberto');
      
      // Obter transação de leitura/escrita
      const transaction = db.transaction(['usuarios'], 'readwrite');
      const store = transaction.objectStore('usuarios');
      const index = store.index('email');
      
      // Procurar usuário por email
      const getRequest = index.get('victorhgs26@gmail.com');
      
      getRequest.onerror = () => {
        console.error('❌ Erro ao procurar usuário:', getRequest.error);
      };
      
      getRequest.onsuccess = () => {
        const usuario = getRequest.result;
        
        if (!usuario) {
          console.error('❌ Usuário victorhgs26@gmail.com não encontrado no IndexedDB');
          console.log('📋 Listando todos os usuários...');
          
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => {
            console.log('Usuários encontrados:', getAllRequest.result);
          };
          return;
        }
        
        console.log('✅ Usuário encontrado:', usuario);
        
        // Atualizar senha
        const usuarioAtualizado = {
          ...usuario,
          senha: 'Vitinx@26'
        };
        
        const updateRequest = store.put(usuarioAtualizado);
        
        updateRequest.onerror = () => {
          console.error('❌ Erro ao atualizar usuário:', updateRequest.error);
        };
        
        updateRequest.onsuccess = () => {
          console.log('✅ Senha atualizada com sucesso!');
          console.log('📝 Novo usuário:', usuarioAtualizado);
          console.log('🔐 Nova senha: Vitinx@26');
          console.log('✨ Você pode fazer login agora!');
        };
      };
    };
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
  }
}

// Exportar para uso no console
if (typeof window !== 'undefined') {
  (window as any).updateVictorPassword = updateVictorPassword;
  console.log('✅ Função updateVictorPassword() disponível no console');
  console.log('   Execute: updateVictorPassword()');
}
