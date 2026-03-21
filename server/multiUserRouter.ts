/**
 * multiUserRouter.ts - Endpoints para Sistema Multi-Usuário
 * 
 * Fornece:
 * - Sincronização em tempo real
 * - Rastreamento de mudanças
 * - Gerenciamento de locks
 * - Notificações
 * - Auditoria
 */

import { Router, Request, Response } from 'express';
import * as auditService from './auditService';
import { requireAuth, requirePermission, addAuditInfo } from './rbacMiddleware';

const router = Router();

/**
 * GET /api/multiuser/audit-history/:entityType/:entityId
 * Obter histórico de mudanças de um registro
 */
router.get(
  '/audit-history/:entityType/:entityId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const { limit = 50 } = req.query;

      console.log(`📋 Obtendo histórico de ${entityType}/${entityId}`);

      const history = await auditService.getAuditHistory(
        entityType,
        entityId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter histórico',
      });
    }
  }
);

/**
 * GET /api/multiuser/modified-by/:entityType/:entityId
 * Obter quem modificou um registro
 */
router.get(
  '/modified-by/:entityType/:entityId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;

      console.log(`👥 Obtendo quem modificou ${entityType}/${entityId}`);

      const modifiers = await auditService.getModifiedBy(entityType, entityId);

      res.json({
        success: true,
        data: modifiers,
      });
    } catch (error) {
      console.error('❌ Erro ao obter modificadores:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter modificadores',
      });
    }
  }
);

/**
 * POST /api/multiuser/lock
 * Adquirir lock para editar um registro
 */
router.post(
  '/lock',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.body;
      const userId = (req as any).user?.id;

      if (!entityType || !entityId || !userId) {
        res.status(400).json({
          success: false,
          error: 'entityType, entityId e userId são obrigatórios',
        });
        return;
      }

      console.log(`🔒 Tentando adquirir lock para ${entityType}/${entityId}`);

      // Verificar se já existe lock
      const lockStatus = await auditService.checkLock(entityType, entityId);
      if (lockStatus.locked && lockStatus.lockedBy !== userId) {
        res.status(409).json({
          success: false,
          error: 'Registro já está sendo editado por outro usuário',
          lockedBy: lockStatus.lockedBy,
          expiresIn: lockStatus.expiresIn,
        });
        return;
      }

      // Adquirir lock
      const acquired = await auditService.acquireLock(entityType, entityId, userId);

      if (acquired) {
        res.json({
          success: true,
          message: 'Lock adquirido com sucesso',
          expiresIn: 300, // 5 minutos
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao adquirir lock',
        });
      }
    } catch (error) {
      console.error('❌ Erro ao adquirir lock:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao adquirir lock',
      });
    }
  }
);

/**
 * DELETE /api/multiuser/lock
 * Liberar lock
 */
router.delete(
  '/lock',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.body;
      const userId = (req as any).user?.id;

      if (!entityType || !entityId || !userId) {
        res.status(400).json({
          success: false,
          error: 'entityType, entityId e userId são obrigatórios',
        });
        return;
      }

      console.log(`🔓 Liberando lock para ${entityType}/${entityId}`);

      const released = await auditService.releaseLock(entityType, entityId, userId);

      if (released) {
        res.json({
          success: true,
          message: 'Lock liberado com sucesso',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao liberar lock',
        });
      }
    } catch (error) {
      console.error('❌ Erro ao liberar lock:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao liberar lock',
      });
    }
  }
);

/**
 * GET /api/multiuser/lock-status/:entityType/:entityId
 * Verificar status do lock
 */
router.get(
  '/lock-status/:entityType/:entityId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;

      const lockStatus = await auditService.checkLock(entityType, entityId);

      res.json({
        success: true,
        data: lockStatus,
      });
    } catch (error) {
      console.error('❌ Erro ao verificar lock:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao verificar lock',
      });
    }
  }
);

/**
 * GET /api/multiuser/notifications
 * Obter notificações não lidas
 */
router.get(
  '/notifications',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId é obrigatório',
        });
        return;
      }

      console.log(`📬 Obtendo notificações para usuário ${userId}`);

      const notifications = await auditService.getUnreadNotifications(userId);

      res.json({
        success: true,
        data: notifications,
        count: notifications.length,
      });
    } catch (error) {
      console.error('❌ Erro ao obter notificações:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter notificações',
      });
    }
  }
);

/**
 * PUT /api/multiuser/notifications/:notificationId/read
 * Marcar notificação como lida
 */
router.put(
  '/notifications/:notificationId/read',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;

      console.log(`✅ Marcando notificação ${notificationId} como lida`);

      const marked = await auditService.markNotificationAsRead(notificationId);

      if (marked) {
        res.json({
          success: true,
          message: 'Notificação marcada como lida',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao marcar notificação como lida',
        });
      }
    } catch (error) {
      console.error('❌ Erro ao marcar notificação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao marcar notificação como lida',
      });
    }
  }
);

/**
 * GET /api/multiuser/active-users
 * Obter usuários ativos no sistema
 */
router.get(
  '/active-users',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      console.log('👥 Obtendo usuários ativos');

      // Aqui você buscaria sessões ativas do banco
      // const activeSessions = await db.query.sessions.findMany({
      //   where: gt(sessions.expiresAt, new Date()),
      // });

      res.json({
        success: true,
        data: [],
        count: 0,
      });
    } catch (error) {
      console.error('❌ Erro ao obter usuários ativos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter usuários ativos',
      });
    }
  }
);

/**
 * GET /api/multiuser/conflicts
 * Obter conflitos não resolvidos
 */
router.get(
  '/conflicts',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      console.log('⚠️ Obtendo conflitos não resolvidos');

      // Aqui você buscaria conflitos do banco
      // const conflicts = await db.query.conflicts.findMany({
      //   where: isNull(conflicts.resolvedAt),
      // });

      res.json({
        success: true,
        data: [],
        count: 0,
      });
    } catch (error) {
      console.error('❌ Erro ao obter conflitos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter conflitos',
      });
    }
  }
);

export default router;
