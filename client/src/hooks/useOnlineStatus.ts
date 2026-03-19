/**
 * useOnlineStatus.ts - Hook para monitorar status de conectividade
 * 
 * Monitora se o navegador está online ou offline
 * Fornece indicador visual e função para bloquear operações offline
 */

import { useState, useEffect } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  lastOnlineTime: number;
  lastOfflineTime: number;
}

export function useOnlineStatus() {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastOnlineTime: Date.now(),
    lastOfflineTime: 0,
  });

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Voltou online');
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnlineTime: Date.now(),
      }));
      
      // Disparar evento customizado para sincronizar dados
      window.dispatchEvent(new Event('app:online'));
    };

    const handleOffline = () => {
      console.log('❌ Ficou offline');
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        lastOfflineTime: Date.now(),
      }));
      
      // Disparar evento customizado
      window.dispatchEvent(new Event('app:offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

/**
 * Verificar se pode fazer operações que requerem conexão
 */
export function requiresOnline(isOnline: boolean): boolean {
  return isOnline;
}

/**
 * Obter mensagem de erro para operação offline
 */
export function getOfflineMessage(): string {
  return 'Chama o proprietário - Sem conexão com a internet';
}
