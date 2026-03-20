import { mysqlTable, varchar, text, int, bigint, boolean, datetime, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

/**
 * Tabela de usuários (admins e clientes)
 */
export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    nome: varchar('nome', { length: 255 }).notNull(),
    tipo: varchar('tipo', { length: 20 }).notNull(), // 'admin' ou 'cliente'
    telefone: varchar('telefone', { length: 20 }),
    nomeEstabelecimento: varchar('nome_estabelecimento', { length: 255 }), // Para admins
    templateWhatsapp: text('template_whatsapp'), // Template de mensagem para cobrança via WhatsApp
    senha: text('senha').notNull(), // Hash da senha
    dataCriacao: bigint('data_criacao', { mode: 'number' }).notNull(),
    dataAtualizacao: bigint('data_atualizacao', { mode: 'number' }).notNull(),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
    tipoIdx: index('tipo_idx').on(table.tipo),
  })
);

/**
 * Tabela de clientes (criados por admins)
 */
export const clients = mysqlTable(
  'clients',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    adminId: varchar('admin_id', { length: 36 }).notNull(), // ID do admin que criou
    nome: varchar('nome', { length: 255 }).notNull(),
    telefone: varchar('telefone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    ativo: boolean('ativo').notNull().default(true),
    dataCriacao: bigint('data_criacao', { mode: 'number' }).notNull(),
    dataAtualizacao: bigint('data_atualizacao', { mode: 'number' }).notNull(),
  },
  (table) => ({
    adminIdIdx: index('admin_id_idx').on(table.adminId),
    nomeIdx: index('nome_idx').on(table.nome),
  })
);

/**
 * Tabela de lançamentos (débitos e pagamentos)
 */
export const transactions = mysqlTable(
  'transactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    adminId: varchar('admin_id', { length: 36 }).notNull(), // ID do admin que registrou
    clienteId: varchar('cliente_id', { length: 36 }).notNull(), // ID do cliente
    tipo: varchar('tipo', { length: 20 }).notNull(), // 'debito' ou 'pagamento'
    valor: int('valor').notNull(), // Valor em centavos (para evitar problemas com float)
    descricao: text('descricao').notNull(),
    data: bigint('data', { mode: 'number' }).notNull(), // Data da transação
    dataCriacao: bigint('data_criacao', { mode: 'number' }).notNull(),
    dataAtualizacao: bigint('data_atualizacao', { mode: 'number' }).notNull(),
  },
  (table) => ({
    adminIdIdx: index('admin_id_idx').on(table.adminId),
    clienteIdIdx: index('cliente_id_idx').on(table.clienteId),
    dataIdx: index('data_idx').on(table.data),
  })
);

/**
 * Relações entre tabelas
 */
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  transactions: many(transactions),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  admin: one(users, {
    fields: [clients.adminId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  admin: one(users, {
    fields: [transactions.adminId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [transactions.clienteId],
    references: [clients.id],
  }),
}));

/**
 * Tipos exportados para uso no frontend e backend
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
