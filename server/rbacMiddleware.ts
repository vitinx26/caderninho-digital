/**
 * rbacMiddleware.ts - Role-Based Access Control (RBAC)
 * 
 * Define permissões por role:
 * - admin: Acesso total a todos os recursos
 * - user: Acesso limitado aos seus próprios dados
 * - viewer: Apenas leitura
 */

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
  };
}

/**
 * Definição de permissões por role
 */
const permissions: Record<string, Record<string, string[]>> = {
  admin: {
    clients: ['create', 'read', 'update', 'delete'],
    transactions: ['create', 'read', 'update', 'delete'],
    menus: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    reports: ['read'],
    settings: ['read', 'update'],
  },
  user: {
    clients: ['create', 'read', 'update'], // Não pode deletar
    transactions: ['create', 'read', 'update'], // Não pode deletar
    menus: ['read'], // Apenas leitura
    users: ['read'], // Apenas ver outros usuários
    reports: ['read'],
    settings: ['read'], // Apenas ler suas próprias configurações
  },
  viewer: {
    clients: ['read'],
    transactions: ['read'],
    menus: ['read'],
    users: ['read'],
    reports: ['read'],
    settings: [], // Sem acesso
  },
};

/**
 * Middleware para verificar autenticação
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  next();
}

/**
 * Middleware para verificar permissão
 */
export function requirePermission(resource: string, action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const userRole = req.user.role;
    const userPermissions = permissions[userRole];

    if (!userPermissions) {
      res.status(403).json({ error: 'Role inválido' });
      return;
    }

    const resourcePermissions = userPermissions[resource];
    if (!resourcePermissions || !resourcePermissions.includes(action)) {
      res.status(403).json({ 
        error: `Sem permissão para ${action} ${resource}`,
        required: `${resource}:${action}`,
        userRole,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware para verificar se é admin
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem acessar' });
    return;
  }

  next();
}

/**
 * Middleware para verificar se é dono do recurso
 */
export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  // Se é admin, pode acessar qualquer coisa
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Se é user, verificar se é dono
  const resourceOwnerId = req.params.userId || req.body.userId;
  if (resourceOwnerId && parseInt(resourceOwnerId) !== req.user.id) {
    res.status(403).json({ error: 'Sem permissão para acessar recurso de outro usuário' });
    return;
  }

  next();
}

/**
 * Obter permissões de um role
 */
export function getPermissions(role: string): Record<string, string[]> {
  return permissions[role] || {};
}

/**
 * Verificar se um role tem permissão
 */
export function hasPermission(role: string, resource: string, action: string): boolean {
  const rolePermissions = permissions[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  return resourcePermissions ? resourcePermissions.includes(action) : false;
}

/**
 * Filtrar dados baseado em role
 * Usuários normais veem apenas seus próprios dados
 */
export function filterByRole(data: any[], userRole: string, userId: number, ownerField: string = 'userId'): any[] {
  if (userRole === 'admin') {
    return data; // Admin vê tudo
  }

  // User vê apenas seus próprios dados
  return data.filter(item => item[ownerField] === userId);
}

/**
 * Adicionar informações de auditoria ao request
 */
export function addAuditInfo(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user) {
    (req as any).auditInfo = {
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date(),
    };
  }
  next();
}
