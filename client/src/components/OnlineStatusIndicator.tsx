/**
 * OnlineStatusIndicator.tsx - Componente para mostrar status de conectividade
 * 
 * Exibe indicador visual e mensagem de status
 */

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export default function OnlineStatusIndicator() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm border border-green-200">
        <Wifi size={16} className="animate-pulse" />
        <span>Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm border border-red-200 animate-pulse">
      <WifiOff size={16} />
      <span>Offline - Chama o proprietário</span>
    </div>
  );
}
