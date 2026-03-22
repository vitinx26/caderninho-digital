import { db } from './server/db-client.ts';
import { users } from './drizzle/schema.ts';

try {
  const allUsers = await db.select().from(users);
  console.log('Usuários no banco:');
  console.log(JSON.stringify(allUsers, null, 2));
} catch (err) {
  console.error('Erro:', err.message);
}
