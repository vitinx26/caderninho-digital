import { db } from './db-client';
import { users, clients, transactions } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Operações de usuários
 */
export async function createUser(user: typeof users.$inferInsert) {
  const now = Date.now();
  const userData = {
    ...user,
    dataCriacao: user.dataCriacao || now,
    dataAtualizacao: now,
  };
  await db.insert(users).values(userData);
  return await getUserById(user.id);
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
  const clientData = {
    ...client,
    dataCriacao: client.dataCriacao || now,
    dataAtualizacao: now,
  };
  await db.insert(clients).values(clientData);
  return await db.query.clients.findFirst({
    where: eq(clients.id, client.id),
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
  const txData = {
    ...transaction,
    dataCriacao: transaction.dataCriacao || now,
    dataAtualizacao: now,
  };
  await db.insert(transactions).values(txData);
  return await db.query.transactions.findFirst({
    where: eq(transactions.id, transaction.id),
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

/**
 * Obter todos os usuários (admins e clientes)
 */
export async function getAllUsers() {
  return db.query.users.findMany();
}

/**
 * Obter todos os administradores
 */
export async function getAllAdmins() {
  return db.query.users.findMany({
    where: eq(users.tipo, 'admin'),
  });
}

/**
 * Obter TODOS os clientes (de todos os admins)
 */
export async function getAllClients() {
  return db.query.clients.findMany();
}

/**
 * Obter TODAS as transações
 */
export async function getAllTransactions() {
  return db.query.transactions.findMany();
}
