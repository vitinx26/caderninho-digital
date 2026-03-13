/**
 * UpdateNotification - Componente para notificar sobre atualizações do PWA
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpdateNotificationProps {
  updateAvailable: boolean;
  onRefresh: () => void;
}

export default function UpdateNotification({
  updateAvailable,
  onRefresh,
}: UpdateNotificationProps) {
  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 p-4 shadow-lg z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Nova versão disponível
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Clique em "Atualizar" para baixar a versão mais recente
            </p>
          </div>
        </div>
        <Button
          onClick={onRefresh}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold whitespace-nowrap"
        >
          <RefreshCw size={16} />
          Atualizar
        </Button>
      </div>
    </div>
  );
}
