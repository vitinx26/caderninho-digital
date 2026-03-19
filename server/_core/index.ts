/**
 * Bridge para servidor Express
 * Este arquivo é o entrypoint do servidor em desenvolvimento
 * Importa e executa o servidor principal de server/index.ts
 */

import('../index.js').catch(err => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
