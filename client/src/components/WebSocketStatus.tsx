/**
 * WebSocketStatus.tsx - Componente para mostrar status de sincronização WebSocket
 * 
 * Exibe indicador visual de conexão e admins conectados
 */

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';

interface AdminStatus {
  email: string;
  timestamp: number;
}

export default function WebSocketStatus() {
  const { usuarioLogado } = useAuth();
  const { status } = useWebSocket(usuarioLogado);
  const [adminsConectados, setAdminsConectados] = useState<AdminStatus[]>([]);

  useEffect(() => {
    const handleAdminConnected = (event: CustomEvent) => {
      console.log('👤 Admin conectado:', event.detail);
      setAdminsConectados(event.detail.connectedAdmins || []);
    };

    const handleAdminDisconnected = (event: CustomEvent) => {
      console.log('👤 Admin desconectado:', event.detail);
      setAdminsConectados(event.detail.connectedAdmins || []);
    };

    window.addEventListener('websocket:admin-connected', handleAdminConnected as EventListener);
    window.addEventListener('websocket:admin-disconnected', handleAdminDisconnected as EventListener);

    return () => {
      window.removeEventListener('websocket:admin-connected', handleAdminConnected as EventListener);
      window.removeEventListener('websocket:admin-disconnected', handleAdminDisconnected as EventListener);
    };
  }, []);

  // Não mostrar se não for admin
  if (usuarioLogado?.tipo !== 'admin') {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
      {/* Status de Conexão */}
      <div className="flex items-center gap-2">
        {status.isConnected ? (
          <>
            <Wifi size={16} className="text-green-600 animate-pulse" />
            <span className="text-sm text-green-700 font-medium">Online</span>
          </>
        ) : status.isConnecting ? (
          <>
            <Wifi size={16} className="text-yellow-600 animate-pulse" />
            <span className="text-sm text-yellow-700 font-medium">Conectando...</span>
          </>
        ) : (
          <>
            <WifiOff size={16} className="text-red-600" />
            <span className="text-sm text-red-700 font-medium">Offline</span>
          </>
        )}
      </div>

      {/* Separador */}
      <div className="w-px h-6 bg-slate-300" />

      {/* Admins Conectados */}
      <div className="flex items-center gap-2">
        <Users size={16} className="text-blue-600" />
        <span className="text-sm text-slate-700 font-medium">
          {adminsConectados.length} admin{adminsConectados.length !== 1 ? 's' : ''} online
        </span>
      </div>

      {/* Tooltip com lista de admins */}
      {adminsConectados.length > 0 && (
        <div className="hidden group-hover:block absolute top-full mt-2 bg-slate-900 text-white text-xs rounded-md p-2 z-50">
          {adminsConectados.map((admin, idx) => (
            <div key={idx} className="whitespace-nowrap">
              ✓ {admin.email}
            </div>
          ))}
        </div>
      )}

      {/* Mensagem de erro */}
      {status.error && (
        <div className="text-xs text-red-600 ml-auto">
          {status.error}
        </div>
      )}
    </div>
  );
}
