import { db } from './db-client';
import { users, clients, transactions } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Operações de usuários
 */
export async function createUser(user: typeof users.$inferInsert) {
  const { openId, ...userData } = user; // Remover openId para usar default do banco
  const result = await db.insert(users).values(userData as any);
  return { ...userData, openId: '' };
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function getUserById(id: number | string) {
  return db.query.users.findFirst({
    where: eq(users.id, typeof id === 'string' ? parseInt(id) : id),
  });
}

export async function updateUser(id: number | string, data: Partial<typeof users.$inferInsert>) {
  return db.update(users).set(data).where(eq(users.id, typeof id === 'string' ? parseInt(id) : id));
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
  return clientData;
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

export async function getClientsByAdminId(adminId: number | string) {
  return db.query.clients.findMany({
    where: eq(clients.adminId, typeof adminId === 'string' ? parseInt(adminId) : adminId),
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
  return txData;
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

export async function getTransactionsByAdminId(adminId: number | string) {
  return db.query.transactions.findMany({
    where: eq(transactions.adminId, typeof adminId === 'string' ? parseInt(adminId) : adminId),
  });
}

export async function getTransactionsByClientId(clientId: string) {
  return db.query.transactions.findMany({
    where: eq(transactions.clienteId, clientId),
  });
}

export async function getTransactionsByAdminAndClient(adminId: number | string, clientId: string) {
  return db.query.transactions.findMany({
    where: and(
      eq(transactions.adminId, typeof adminId === 'string' ? parseInt(adminId) : adminId),
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
  try {
    const result = await db.select().from(users);
    return result || [];
  } catch (error) {
    console.error('Erro ao buscar usuarios:', error);
    return [];
  }
}

/**
 * Obter todos os administradores
 */
export async function getAllAdmins() {
  return db.query.users.findMany({
    where: eq(users.role, 'admin'),
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
