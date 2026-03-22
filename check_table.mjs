import { db } from './server/db-client.ts';
import { users } from './drizzle/schema.ts';

try {
  const result = await db.select().from(users).limit(1);
  console.log('Sucesso! Tabela users existe');
  console.log('Campos retornados:', Object.keys(result[0] || {}));
} catch (err) {
  console.error('Erro:', err.message);
}
