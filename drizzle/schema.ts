import { mysqlTable, varchar, text, int, timestamp, boolean, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

/**
 * Tabela de usuários (admins e clientes)
 * Estrutura real do banco de dados
 */
export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    openId: varchar('openId', { length: 64 }).notNull().unique(),
    name: text('name'),
    email: varchar('email', { length: 320 }),
    loginMethod: varchar('loginMethod', { length: 64 }),
    role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' ou 'admin'
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow().onUpdateNow(),
    lastSignedIn: timestamp('lastSignedIn').notNull().defaultNow(),
    templateWhatsapp: text('template_whatsapp'),
    emailNotificacao: varchar('email_notificacao', { length: 255 }),
    ativo: boolean('ativo').notNull().default(true),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
    roleIdx: index('role_idx').on(table.role),
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
    dataCriacao: timestamp('data_criacao').notNull().defaultNow(),
    dataAtualizacao: timestamp('data_atualizacao').notNull().defaultNow().onUpdateNow(),
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
    data: timestamp('data').notNull().defaultNow(), // Data da transação
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
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    restaurantId: varchar('restaurant_id', { length: 36 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  }
);

/**
 * Relações
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
