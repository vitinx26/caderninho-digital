import { db } from './db-client';
import { users, clients, transactions } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Operações de usuários
 */
export async function createUser(user: typeof users.$inferInsert) {
  const now = Date.now();
  return db.insert(users).values({
    ...user,
    dataCriacao: user.dataCriacao || now,
    dataAtualizacao: now,
  });
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function updateUser(id: string, data: Partial<typeof users.$inferInsert>) {
  return db.update(users).set({
    ...data,
    dataAtualizacao: Date.now(),
  }).where(eq(users.id, id));
}

/**
 * Operações de clientes
 */
export async function createClient(client: typeof clients.$inferInsert) {
  const now = Date.now();
  return db.insert(clients).values({
    ...client,
    dataCriacao: client.dataCriacao || now,
    dataAtualizacao: now,
  });
}

export async function createManyClients(clientsList: (typeof clients.$inferInsert)[]) {
  const now = Date.now();
  return db.insert(clients).values(
    clientsList.map(client => ({
      ...client,
      dataCriacao: client.dataCriacao || now,
      dataAtualizacao: now,
    }))
  );
}

export async function getClientsByAdminId(adminId: string) {
  return db.query.clients.findMany({
    where: eq(clients.adminId, adminId),
  });
}

export async function getClientById(id: string) {
  return db.query.clients.findFirst({
    where: eq(clients.id, id),
  });
}

export async function updateClient(id: string, data: Partial<typeof clients.$inferInsert>) {
  return db.update(clients).set({
    ...data,
    dataAtualizacao: Date.now(),
  }).where(eq(clients.id, id));
}

/**
 * Operações de transações
 */
export async function createTransaction(transaction: typeof transactions.$inferInsert) {
  const now = Date.now();
  return db.insert(transactions).values({
    ...transaction,
    dataCriacao: transaction.dataCriacao || now,
    dataAtualizacao: now,
  });
}

export async function createManyTransactions(transactionsList: (typeof transactions.$inferInsert)[]) {
  const now = Date.now();
  return db.insert(transactions).values(
    transactionsList.map(tx => ({
      ...tx,
      dataCriacao: tx.dataCriacao || now,
      dataAtualizacao: now,
    }))
  );
}

export async function getTransactionsByAdminId(adminId: string) {
  return db.query.transactions.findMany({
    where: eq(transactions.adminId, adminId),
  });
}

export async function getTransactionsByClientId(clientId: string) {
  return db.query.transactions.findMany({
    where: eq(transactions.clienteId, clientId),
  });
}

export async function getTransactionsByAdminAndClient(adminId: string, clientId: string) {
  return db.query.transactions.findMany({
    where: and(
      eq(transactions.adminId, adminId),
      eq(transactions.clienteId, clientId)
    ),
  });
}

export async function updateTransaction(id: string, data: Partial<typeof transactions.$inferInsert>) {
  return db.update(transactions).set({
    ...data,
    dataAtualizacao: Date.now(),
  }).where(eq(transactions.id, id));
}
