/**
 * useMultiUser.ts - Hook para Sistema Multi-Usuário
 * 
 * Fornece:
 * - Sincronização em tempo real
 * - Notificações de mudanças
 * - Gerenciamento de locks
 * - Detecção de conflitos
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface Lock {
  locked: boolean;
  lockedBy?: number;
  expiresIn?: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditEntry {
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
}

/**
 * Hook para gerenciar locks de edição
 */
export function useLock(entityType: string, entityId: string) {
  const [lockStatus, setLockStatus] = useState<Lock>({ locked: false });
  const [loading, setLoading] = useState(false);
  const lockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Adquirir lock
  const acquireLock = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/multiuser/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Não foi possível editar: ${error.error}`);
        return false;
      }

      const data = await response.json();
      toast.success('Lock adquirido com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao adquirir lock:', error);
      toast.error('Erro ao adquirir lock');
      return false;
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  // Liberar lock
  const releaseLock = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/multiuser/lock', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao liberar lock');
      }

      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current);
      }

      return true;
    } catch (error) {
      console.error('Erro ao liberar lock:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  // Verificar status do lock
  const checkLock = useCallback(async () => {
    try {
      const response = await fetch(`/api/multiuser/lock-status/${entityType}/${entityId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLockStatus(data.data);
      }
    } catch (error) {
      console.error('Erro ao verificar lock:', error);
    }
  }, [entityType, entityId]);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current);
      }
    };
  }, []);

  return {
    lockStatus,
    loading,
    acquireLock,
    releaseLock,
    checkLock,
  };
}

/**
 * Hook para gerenciar notificações
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/multiuser/notifications', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/multiuser/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Polling de notificações
  useEffect(() => {
    loadNotifications();
    
    // Verificar novas notificações a cada 10 segundos
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);
    pollIntervalRef.current = interval;

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
  };
}

/**
 * Hook para obter histórico de auditoria
 */
export function useAuditHistory(entityType: string, entityId: string) {
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/multiuser/audit-history/${entityType}/${entityId}?limit=50`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    reload: loadHistory,
  };
}

/**
 * Hook para obter usuários ativos
 */
export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadActiveUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/multiuser/active-users', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários ativos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveUsers();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      loadActiveUsers();
    }, 30000);
    pollIntervalRef.current = interval;

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [loadActiveUsers]);

  return {
    activeUsers,
    loading,
  };
}

/**
 * Hook para obter conflitos não resolvidos
 */
export function useConflicts() {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConflicts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/multiuser/conflicts', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar conflitos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  return {
    conflicts,
    loading,
    reload: loadConflicts,
  };
}
