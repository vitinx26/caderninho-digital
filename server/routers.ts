import { router, publicProcedure } from './trpc';
import { z } from 'zod';
import * as dbHelpers from './db';
import { TRPCError } from '@trpc/server';

/**
 * Schema de validação para sincronização
 */
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nome: z.string(),
  tipo: z.enum(['admin', 'cliente']),
  telefone: z.string().optional(),
  nomeEstabelecimento: z.string().optional(),
  senha: z.string(),
  dataCriacao: z.number(),
});

const clientSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  nome: z.string(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  ativo: z.boolean().default(true),
  dataCriacao: z.number(),
});

const transactionSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  clienteId: z.string(),
  tipo: z.enum(['debito', 'pagamento']),
  valor: z.number(),
  descricao: z.string(),
  data: z.number(),
  dataCriacao: z.number(),
});

export const appRouter = router({
  /**
   * Sincronizar usuários do cliente para o servidor
   */
  sync: router({
    users: publicProcedure
      .input(z.array(userSchema))
      .mutation(async ({ input }: any) => {
        try {
          const results = [];
          for (const user of input) {
            try {
              // Verificar se usuário já existe
              const existing = await dbHelpers.getUserByEmail(user.email);
              if (existing) {
                // Atualizar usuário existente
                await dbHelpers.updateUser(user.id, {
                  nome: user.nome,
                  tipo: user.tipo === 'admin' ? 'admin' : 'cliente',
                });
                results.push({ id: user.id, status: 'updated' });
              } else {
                // Criar novo usuário
                await dbHelpers.createUser({
                  email: user.email,
                  senha: 'temp-senha',
                  nome: user.nome,
                  tipo: user.tipo === 'admin' ? 'admin' : 'cliente',
                  telefone: '',
                  ativo: true,
                });
                results.push({ id: user.id, status: 'created' });
              }
            } catch (error) {
              console.error(`Erro ao sincronizar usuário ${user.email}:`, error);
              results.push({ id: user.id, status: 'error', error: String(error) });
            }
          }
          return { success: true, results };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao sincronizar usuários',
            cause: error,
          });
        }
      }),

    /**
     * Sincronizar clientes do cliente para o servidor
     */
    clients: publicProcedure
      .input(z.object({
        adminId: z.string(),
        clients: z.array(clientSchema),
      }))
      .mutation(async ({ input }: any) => {
        try {
          const results = [];
          for (const client of input.clients) {
            try {
              // Verificar se cliente já existe
              const existing = await dbHelpers.getClientById(client.id);
              if (existing) {
                // Atualizar cliente existente
                await dbHelpers.updateClient(client.id, {
                  nome: client.nome,
                  telefone: client.telefone,
                  email: client.email,
                  ativo: client.ativo,
                });
                results.push({ id: client.id, status: 'updated' });
              } else {
                // Criar novo cliente
                await dbHelpers.createClient({
                  id: client.id,
                  adminId: input.adminId,
                  nome: client.nome,
                  telefone: client.telefone,
                  email: client.email,
                  ativo: client.ativo,
                  dataCriacao: new Date(client.dataCriacao),
                  dataAtualizacao: new Date(),
                });
                results.push({ id: client.id, status: 'created' });
              }
            } catch (error) {
              console.error(`Erro ao sincronizar cliente ${client.nome}:`, error);
              results.push({ id: client.id, status: 'error', error: String(error) });
            }
          }
          return { success: true, results };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao sincronizar clientes',
            cause: error,
          });
        }
      }),

    /**
     * Sincronizar transações do cliente para o servidor
     */
    transactions: publicProcedure
      .input(z.object({
        adminId: z.string(),
        transactions: z.array(transactionSchema),
      }))
      .mutation(async ({ input }: any) => {
        try {
          const results = [];
          for (const transaction of input.transactions) {
            try {
              // Criar nova transação (não atualizar, pois são registros históricos)
              await dbHelpers.createTransaction({
                id: transaction.id,
                adminId: input.adminId,
                clienteId: transaction.clienteId,
                tipo: transaction.tipo as 'debito' | 'pagamento',
                valor: Math.round(transaction.valor * 100), // Converter para centavos
                descricao: transaction.descricao,
                data: new Date(transaction.data),
                dataCriacao: new Date(transaction.dataCriacao),
                dataAtualizacao: new Date(),
              });
              results.push({ id: transaction.id, status: 'created' });
            } catch (error) {
              console.error(`Erro ao sincronizar transação ${transaction.id}:`, error);
              results.push({ id: transaction.id, status: 'error', error: String(error) });
            }
          }
          return { success: true, results };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao sincronizar transações',
            cause: error,
          });
        }
      }),

    /**
     * Sincronizar todos os dados de um admin (migração completa)
     */
    migrateAll: publicProcedure
      .input(z.object({
        user: userSchema,
        clients: z.array(clientSchema),
        transactions: z.array(transactionSchema),
      }))
      .mutation(async ({ input }: any) => {
        try {
          // 1. Sincronizar usuário
          const userResult = await dbHelpers.createUser({
            ...input.user,
            dataAtualizacao: Date.now(),
          });
          
          // 2. Sincronizar clientes
          const clientsResult = await dbHelpers.createManyClients(
            input.clients.map((c: z.infer<typeof clientSchema>) => ({
              ...c,
              adminId: input.user.id,
              dataAtualizacao: Date.now(),
            }))
          );
          
          // 3. Sincronizar transações
          const transactionsResult = await dbHelpers.createManyTransactions(
            input.transactions.map((t: z.infer<typeof transactionSchema>) => ({
              ...t,
              adminId: input.user.id,
              valor: Math.round(t.valor * 100),
              dataAtualizacao: Date.now(),
            }))
          );

          return {
            success: true,
            message: 'Migração concluída com sucesso',
          };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao migrar dados',
            cause: error,
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
