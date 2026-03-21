/**
 * SCHEMA PARA SISTEMA MULTI-USUÁRIO
 * Adiciona tabelas para auditoria, permissões e sincronização
 */

import { mysqlTable, int, varchar, text, timestamp, boolean, index } from 'drizzle-orm/mysql-core';

/**
 * Tabela de Audit Log - Rastreia todas as mudanças
 * Quem fez o quê, quando e com quais dados
 */
export const auditLog = mysqlTable(
  'audit_log',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id').notNull(), // Quem fez a mudança
    action: varchar('action', { length: 50 }).notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
    entityType: varchar('entity_type', { length: 50 }).notNull(), // 'client', 'transaction', 'menu', 'user'
    entityId: varchar('entity_id', { length: 36 }).notNull(), // ID do registro afetado
    oldValues: text('old_values'), // JSON com valores antigos
    newValues: text('new_values'), // JSON com valores novos
    reason: text('reason'), // Por que foi feita a mudança
    ipAddress: varchar('ip_address', { length: 45 }), // IP do usuário
    userAgent: text('user_agent'), // Browser/App info
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('audit_user_id_idx').on(table.userId),
    entityTypeIdx: index('audit_entity_type_idx').on(table.entityType),
    entityIdIdx: index('audit_entity_id_idx').on(table.entityId),
    createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
  })
);

/**
 * Tabela de Permissões - Define o que cada role pode fazer
 */
export const permissions = mysqlTable(
  'permissions',
  {
    id: int('id').primaryKey().autoincrement(),
    role: varchar('role', { length: 20 }).notNull(), // 'admin', 'user', 'viewer'
    resource: varchar('resource', { length: 50 }).notNull(), // 'clients', 'transactions', 'menus'
    action: varchar('action', { length: 20 }).notNull(), // 'create', 'read', 'update', 'delete'
    allowed: boolean('allowed').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    roleResourceActionIdx: index('perm_role_resource_action_idx').on(table.role, table.resource, table.action),
  })
);

/**
 * Tabela de Sessões - Rastreia quem está online
 */
export const sessions = mysqlTable(
  'sessions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id').notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    lastActivity: timestamp('last_activity').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('session_user_id_idx').on(table.userId),
    tokenIdx: index('session_token_idx').on(table.token),
    expiresAtIdx: index('session_expires_at_idx').on(table.expiresAt),
  })
);

/**
 * Tabela de Notificações - Notifica usuários sobre mudanças
 */
export const notifications = mysqlTable(
  'notifications',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id').notNull(), // Quem recebe a notificação
    type: varchar('type', { length: 50 }).notNull(), // 'client_created', 'transaction_updated', etc
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    relatedEntityType: varchar('related_entity_type', { length: 50 }),
    relatedEntityId: varchar('related_entity_id', { length: 36 }),
    read: boolean('read').notNull().default(false),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('notif_user_id_idx').on(table.userId),
    readIdx: index('notif_read_idx').on(table.read),
    createdAtIdx: index('notif_created_at_idx').on(table.createdAt),
  })
);

/**
 * Tabela de Locks - Previne edições simultâneas do mesmo registro
 */
export const locks = mysqlTable(
  'locks',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 36 }).notNull(),
    userId: int('user_id').notNull(), // Quem tem o lock
    lockedAt: timestamp('locked_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(), // Lock expira em 5 minutos
  },
  (table) => ({
    entityTypeIdIdx: index('lock_entity_type_id_idx').on(table.entityType, table.entityId),
    userIdIdx: index('lock_user_id_idx').on(table.userId),
    expiresAtIdx: index('lock_expires_at_idx').on(table.expiresAt),
  })
);

/**
 * Tabela de Conflitos - Rastreia edições simultâneas
 */
export const conflicts = mysqlTable(
  'conflicts',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id', { length: 36 }).notNull(),
    user1Id: int('user1_id').notNull(), // Primeiro usuário
    user2Id: int('user2_id').notNull(), // Segundo usuário
    user1Values: text('user1_values').notNull(), // JSON com dados do user1
    user2Values: text('user2_values').notNull(), // JSON com dados do user2
    resolvedBy: int('resolved_by'), // Quem resolveu o conflito
    resolution: varchar('resolution', { length: 50 }), // 'user1', 'user2', 'merged'
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    entityTypeIdIdx: index('conflict_entity_type_id_idx').on(table.entityType, table.entityId),
    createdAtIdx: index('conflict_created_at_idx').on(table.createdAt),
  })
);
