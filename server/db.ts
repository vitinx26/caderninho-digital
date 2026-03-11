import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, estabelecimentos, clientes, lancamentos, InsertEstabelecimento, InsertCliente, InsertLancamento } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Estabelecimentos
export async function criarEstabelecimento(adminId: number, nome: string, telefone?: string, email?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(estabelecimentos).values({
    adminId,
    nome,
    telefone: telefone || undefined,
    email: email || undefined,
  });

  return result;
}

export async function obterEstabelecimentosPorAdmin(adminId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(estabelecimentos).where(eq(estabelecimentos.adminId, adminId));
}

export async function obterEstabelecimento(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(estabelecimentos).where(eq(estabelecimentos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function atualizarEstabelecimento(id: number, adminId: number, dados: Partial<InsertEstabelecimento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se o admin é o proprietário
  const est = await obterEstabelecimento(id);
  if (!est || est.adminId !== adminId) {
    throw new Error("Unauthorized");
  }

  return db.update(estabelecimentos).set(dados).where(eq(estabelecimentos.id, id));
}

// Clientes
export async function criarCliente(estabelecimentoId: number, nome: string, telefone?: string, email?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clientes).values({
    estabelecimentoId,
    nome,
    telefone: telefone || undefined,
    email: email || undefined,
    ativo: 1,
  });

  return result;
}

export async function obterClientesPorEstabelecimento(estabelecimentoId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(clientes).where(eq(clientes.estabelecimentoId, estabelecimentoId));
}

export async function obterCliente(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function atualizarCliente(id: number, dados: Partial<InsertCliente>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(clientes).set(dados).where(eq(clientes.id, id));
}

// Lançamentos
export async function criarLancamento(clienteId: number, estabelecimentoId: number, tipo: "debito" | "pagamento", valor: number, descricao?: string, data?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(lancamentos).values({
    clienteId,
    estabelecimentoId,
    tipo,
    valor,
    descricao: descricao || undefined,
    data: data || new Date(),
  });

  return result;
}

export async function obterLancamentosPorEstabelecimento(estabelecimentoId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(lancamentos).where(eq(lancamentos.estabelecimentoId, estabelecimentoId));
}

export async function obterLancamentosPorCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(lancamentos).where(eq(lancamentos.clienteId, clienteId));
}
