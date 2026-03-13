/**
 * Hook para detectar e gerenciar atualizações do PWA
 * Verifica periodicamente por novas versões e notifica o usuário
 */

import { useEffect, useState, useCallback } from 'react';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  updateVersion?: string;
  refreshApp: () => void;
}

export function useUpdateCheck(): UpdateCheckResult {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string>();

  const refreshApp = useCallback(() => {
    // Limpar todos os caches
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }

    // Limpar localStorage e IndexedDB se necessário
    // localStorage.clear(); // Descomentar se quiser limpar dados locais

    // Recarregar a página
    window.location.reload();
  }, []);

  useEffect(() => {
    // Verificar se há service worker
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker não suportado');
      return;
    }

    let updateCheckInterval: NodeJS.Timeout;

    const checkForUpdates = async () => {
      try {
        // Buscar o manifest.json com cache-busting
        const response = await fetch('/manifest.json?t=' + Date.now(), {
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('Erro ao verificar atualizações:', response.status);
          return;
        }

        const manifest = await response.json();
        const currentVersion = localStorage.getItem('app_version');
        const newVersion = manifest.version || new Date().toISOString();

        console.log('Versão atual:', currentVersion);
        console.log('Nova versão:', newVersion);

        // Se a versão mudou, há uma atualização disponível
        if (currentVersion && currentVersion !== newVersion) {
          console.log('✅ Atualização disponível!');
          setUpdateAvailable(true);
          setUpdateVersion(newVersion);
        } else if (!currentVersion) {
          // Primeira execução
          localStorage.setItem('app_version', newVersion);
        }

        // Tentar atualizar o service worker
        const registration = await navigator.serviceWorker.ready;
        registration.update().catch((err) => {
          console.warn('Erro ao atualizar service worker:', err);
        });
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    // Verificar atualizações na primeira carga
    checkForUpdates();

    // Verificar a cada 5 minutos (300000ms)
    updateCheckInterval = setInterval(checkForUpdates, 300000);

    // Também verificar quando o app voltar ao foco
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(updateCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    updateAvailable,
    updateVersion,
    refreshApp,
  };
}
