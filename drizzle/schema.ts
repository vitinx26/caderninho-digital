import { mysqlTable, varchar, text, int, timestamp, boolean, index, bigint } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

/**
 * SCHEMA ATUALIZADO PARA CORRESPONDER AO BANCO REAL
 * Estrutura sincronizada com a base de dados existente
 */

/**
 * Tabela de usuários (admins e clientes logados)
 * Estrutura sincronizada com banco real
 */
export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    openId: varchar('openId', { length: 255 }).notNull().default(''),
    name: text('name'),
    email: varchar('email', { length: 320 }),
    loginMethod: varchar('loginMethod', { length: 64 }),
    role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' ou 'admin'
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
    lastSignedIn: timestamp('lastSignedIn').notNull().defaultNow(),
    template_whatsapp: text('template_whatsapp'),
    email_notificacao: varchar('email_notificacao', { length: 255 }),
    ativo: boolean('ativo').notNull().default(true),
    telefone: varchar('telefone', { length: 20 }),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
    roleIdx: index('role_idx').on(table.role),
  })
);

/**
 * Tabela de transações (débitos e pagamentos)
 * Estrutura sincronizada com banco real
 */
export const transactions = mysqlTable(
  'transactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    admin_id: varchar('admin_id', { length: 36 }).notNull(), // ID do admin que registrou (pode ser string)
    cliente_id: varchar('cliente_id', { length: 36 }).notNull(), // ID do cliente (pode ser user ou client)
    tipo: varchar('tipo', { length: 20 }).notNull(), // 'debito' ou 'pagamento'
    valor: int('valor').notNull(), // Valor em centavos
    descricao: text('descricao').notNull(),
    data: bigint('data', { mode: 'number' }), // Timestamp em milissegundos
    dataCriacao: bigint('data_criacao', { mode: 'number' }), // Timestamp em milissegundos
    dataAtualizacao: bigint('data_atualizacao', { mode: 'number' }), // Timestamp em milissegundos
  },
  (table) => ({
    clienteIdIdx: index('cliente_id_idx').on(table.cliente_id),
    adminIdIdx: index('admin_id_idx').on(table.admin_id),
  })
);

/**
 * Tabela de cardápios
 */
export const menus = mysqlTable(
  'menus',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    is_active: boolean('is_active').notNull().default(false),
    created_at: bigint('created_at', { mode: 'number' }).notNull(),
    updated_at: bigint('updated_at', { mode: 'number' }).notNull(),
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
    order: int('order').notNull().default(0),
    created_at: bigint('created_at', { mode: 'number' }).notNull(),
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
    price: int('price').notNull(),
    created_at: bigint('created_at', { mode: 'number' }).notNull(),
  }
);

/**
 * Relações
 */
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  menus: many(menus),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  // admin pode ser um user ou um valor string
  // clienteId pode ser um user ou um valor string
}));

export const menusRelations = relations(menus, ({ many }) => ({
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
