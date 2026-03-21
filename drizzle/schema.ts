import { mysqlTable, varchar, text, int, timestamp, boolean, index, bigint } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

/**
 * SCHEMA LIMPO E SIMPLES
 * Estrutura otimizada para sincronização em tempo real
 */

/**
 * Tabela de usuários (admins e clientes)
 * Estrutura simples: email, senha, nome, tipo
 */
export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    senha: text('senha').notNull(), // Hash da senha
    nome: varchar('nome', { length: 255 }).notNull(),
    tipo: varchar('tipo', { length: 20 }).notNull().default('cliente'), // 'admin' ou 'cliente'
    telefone: varchar('telefone', { length: 20 }),
    ativo: boolean('ativo').notNull().default(true),
    dataCriacao: timestamp('data_criacao').notNull().defaultNow(),
    dataAtualizacao: timestamp('data_atualizacao').notNull().defaultNow().onUpdateNow(),
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
    adminId: int('admin_id').notNull(), // ID do admin que criou
    nome: varchar('nome', { length: 255 }).notNull(),
    telefone: varchar('telefone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    ativo: boolean('ativo').notNull().default(true),
    dataCriacao: timestamp('data_criacao').notNull().defaultNow(),
    dataAtualizacao: timestamp('data_atualizacao').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    adminIdIdx: index('admin_id_idx').on(table.adminId),
    nomeIdx: index('nome_idx').on(table.nome),
  })
);

/**
 * Tabela de transações (débitos e pagamentos)
 */
export const transactions = mysqlTable(
  'transactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    adminId: int('admin_id').notNull(), // ID do admin que registrou
    clienteId: varchar('cliente_id', { length: 36 }).notNull(), // ID do cliente
    tipo: varchar('tipo', { length: 20 }).notNull(), // 'debito' ou 'pagamento'
    valor: int('valor').notNull(), // Valor em centavos
    descricao: text('descricao').notNull(),
    data: timestamp('data').notNull().defaultNow(),
    dataCriacao: timestamp('data_criacao').notNull().defaultNow(),
    dataAtualizacao: timestamp('data_atualizacao').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    adminIdIdx: index('admin_id_idx').on(table.adminId),
    clienteIdIdx: index('cliente_id_idx').on(table.clienteId),
    dataIdx: index('data_idx').on(table.data),
  })
);

/**
 * Tabela de cardápios
 */
export const menus = mysqlTable(
  'menus',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    adminId: int('admin_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    ativo: boolean('ativo').notNull().default(true),
    dataCriacao: timestamp('data_criacao').notNull().defaultNow(),
    dataAtualizacao: timestamp('data_atualizacao').notNull().defaultNow().onUpdateNow(),
  }
);

/**
 * Tabela de categorias de cardápio
 */
export const menuCategories = mysqlTable(
  'menu_categories',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    menuId: varchar('menu_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    dataCriacao: timestamp('data_criacao').notNull().defaultNow(),
    dataAtualizacao: timestamp('data_atualizacao').notNull().defaultNow().onUpdateNow(),
  }
);

/**
 * Tabela de itens de cardápio
 */
export const menuItems = mysqlTable(
  'menu_items',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    categoryId: varchar('category_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: int('price').notNull(),
    dataCriacao: timestamp('data_criacao').notNull().defaultNow(),
    dataAtualizacao: timestamp('data_atualizacao').notNull().defaultNow().onUpdateNow(),
  }
);

/**
 * Tabela de sincronização (rastreia mudanças para sincronização em tempo real)
 */
export const syncLog = mysqlTable(
  'sync_log',
  {
    id: int('id').primaryKey().autoincrement(),
    tabela: varchar('tabela', { length: 50 }).notNull(), // Nome da tabela modificada
    operacao: varchar('operacao', { length: 20 }).notNull(), // 'INSERT', 'UPDATE', 'DELETE'
    registroId: varchar('registro_id', { length: 36 }).notNull(), // ID do registro modificado
    usuarioId: int('usuario_id').notNull(), // ID do usuário que fez a mudança
    dados: text('dados'), // JSON com dados da mudança
    dataCriacao: timestamp('data_criacao').notNull().defaultNow(),
  },
  (table) => ({
    tabelaIdx: index('tabela_idx').on(table.tabela),
    usuarioIdIdx: index('usuario_id_idx').on(table.usuarioId),
    dataCriacaoIdx: index('data_criacao_idx').on(table.dataCriacao),
  })
);

/**
 * Relações
 */
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  transactions: many(transactions),
  menus: many(menus),
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

export const menusRelations = relations(menus, ({ one, many }) => ({
  admin: one(users, {
    fields: [menus.adminId],
    references: [users.id],
  }),
  categories: many(menuCategories),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
  menu: one(menus, {
    fields: [menuCategories.menuId],
    references: [menus.id],
  }),
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));
