import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * NOVA ARQUITETURA CENTRALIZADA
 * 
 * Uma única base de dados com todas as funcionalidades:
 * - Administradores
 * - Clientes
 * - Lançamentos
 * - Cardápios
 * - Configurações
 */

// ============================================================================
// TABELA PRINCIPAL: USUÁRIOS (Administradores + Clientes)
// ============================================================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  senha: text('senha').notNull(),
  nome: text('nome').notNull(),
  telefone: text('telefone'),
  tipo: text('tipo', { enum: ['admin', 'cliente'] }).notNull().default('cliente'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  criadoEm: integer('criado_em').notNull(),
  atualizadoEm: integer('atualizado_em').notNull(),
});

// ============================================================================
// TABELA: CLIENTES (Conta Geral)
// ============================================================================
export const clientes = sqliteTable('clientes', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  telefone: text('telefone'),
  email: text('email'),
  usuarioId: text('usuario_id').references(() => users.id),
  criadoEm: integer('criado_em').notNull(),
  atualizadoEm: integer('atualizado_em').notNull(),
});

// ============================================================================
// TABELA: LANÇAMENTOS (Transações)
// ============================================================================
export const lancamentos = sqliteTable('lancamentos', {
  id: text('id').primaryKey(),
  clienteId: text('cliente_id').notNull().references(() => clientes.id),
  usuarioId: text('usuario_id').references(() => users.id),
  tipo: text('tipo', { enum: ['debito', 'pagamento', 'compra'] }).notNull(),
  valor: real('valor').notNull(),
  descricao: text('descricao'),
  criadoEm: integer('criado_em').notNull(),
});

// ============================================================================
// TABELA: CARDÁPIOS
// ============================================================================
export const cardapios = sqliteTable('cardapios', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  preco: real('preco').notNull(),
  descricao: text('descricao'),
  criadoEm: integer('criado_em').notNull(),
  atualizadoEm: integer('atualizado_em').notNull(),
});

// ============================================================================
// TABELA: CONFIGURAÇÕES (Admin Settings)
// ============================================================================
export const configuracoes = sqliteTable('configuracoes', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull().references(() => users.id),
  chave: text('chave').notNull(),
  valor: text('valor').notNull(),
  criadoEm: integer('criado_em').notNull(),
  atualizadoEm: integer('atualizado_em').notNull(),
}, (table) => ({
  unq: primaryKey({ columns: [table.adminId, table.chave] }),
}));

// ============================================================================
// RELAÇÕES
// ============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  clientes: many(clientes),
  lancamentos: many(lancamentos),
  configuracoes: many(configuracoes),
}));

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  usuario: one(users, {
    fields: [clientes.usuarioId],
    references: [users.id],
  }),
  lancamentos: many(lancamentos),
}));

export const lancamentosRelations = relations(lancamentos, ({ one }) => ({
  cliente: one(clientes, {
    fields: [lancamentos.clienteId],
    references: [clientes.id],
  }),
  usuario: one(users, {
    fields: [lancamentos.usuarioId],
    references: [users.id],
  }),
}));

export const configuracoeRelations = relations(configuracoes, ({ one }) => ({
  admin: one(users, {
    fields: [configuracoes.adminId],
    references: [users.id],
  }),
}));
