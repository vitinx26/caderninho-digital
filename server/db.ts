import { db } from './db-client';
import { users, transactions } from '../drizzle/schema';
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
 * Operações de clientes (legado - usar users em vez disso)
 * Clientes agora são usuários com role='user' na tabela users
 */

/**
 * Operações de transações
 */
export async function createTransaction(transaction: typeof transactions.$inferInsert) {
  const now = Date.now();
  const txData = {
    ...transaction,
    dataCriacao: typeof transaction.dataCriacao === 'number' ? transaction.dataCriacao : Date.now(),
    dataAtualizacao: Date.now(),
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
    where: eq(transactions.admin_id, typeof adminId === 'string' ? adminId : String(adminId)),
  });
}

export async function getTransactionsByClientId(clientId: string) {
  return db.query.transactions.findMany({
    where: eq(transactions.cliente_id, clientId),
  });
}

export async function getTransactionsByAdminAndClient(adminId: number | string, clientId: string) {
  return db.query.transactions.findMany({
    where: and(
      eq(transactions.admin_id, typeof adminId === 'string' ? adminId : String(adminId)),
      eq(transactions.cliente_id, clientId)
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
 * Operações de transações
 */

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
 * Clientes são usuários com role='user'
 */
export async function getAllClients() {
  try {
    return db.query.users.findMany({
      where: eq(users.role, 'user'),
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
}

/**
 * Obter TODAS as transações
 */
export async function getAllTransactions() {
  return db.query.transactions.findMany();
}
