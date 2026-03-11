import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  estabelecimentos: router({
    criar: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        telefone: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return db.criarEstabelecimento(ctx.user.id, input.nome, input.telefone, input.email);
      }),
    listar: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return db.obterEstabelecimentosPorAdmin(ctx.user.id);
      }),
    obter: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const est = await db.obterEstabelecimento(input.id);
        if (!est || est.adminId !== ctx.user.id) throw new Error('Unauthorized');
        return est;
      }),
    atualizar: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().min(1).optional(),
        telefone: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const { id, ...dados } = input;
        return db.atualizarEstabelecimento(id, ctx.user.id, dados);
      }),
  }),

  clientes: router({
    criar: protectedProcedure
      .input(z.object({
        estabelecimentoId: z.number(),
        nome: z.string().min(1),
        telefone: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const est = await db.obterEstabelecimento(input.estabelecimentoId);
        if (!est || est.adminId !== ctx.user.id) throw new Error('Unauthorized');
        return db.criarCliente(input.estabelecimentoId, input.nome, input.telefone, input.email);
      }),
    listar: protectedProcedure
      .input(z.object({ estabelecimentoId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const est = await db.obterEstabelecimento(input.estabelecimentoId);
        if (!est || est.adminId !== ctx.user.id) throw new Error('Unauthorized');
        return db.obterClientesPorEstabelecimento(input.estabelecimentoId);
      }),
    atualizar: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().min(1).optional(),
        telefone: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const cliente = await db.obterCliente(input.id);
        if (!cliente) throw new Error('Not found');
        const est = await db.obterEstabelecimento(cliente.estabelecimentoId);
        if (!est || est.adminId !== ctx.user.id) throw new Error('Unauthorized');
        const { id, ...dados } = input;
        return db.atualizarCliente(id, dados);
      }),
  }),

  lancamentos: router({
    criar: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        estabelecimentoId: z.number(),
        tipo: z.enum(['debito', 'pagamento']),
        valor: z.number().positive(),
        descricao: z.string().optional(),
        data: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const est = await db.obterEstabelecimento(input.estabelecimentoId);
        if (!est || est.adminId !== ctx.user.id) throw new Error('Unauthorized');
        // Converter valor para centavos
        const valorCentavos = Math.round(input.valor * 100);
        return db.criarLancamento(input.clienteId, input.estabelecimentoId, input.tipo, valorCentavos, input.descricao, input.data);
      }),
    listarPorEstabelecimento: protectedProcedure
      .input(z.object({ estabelecimentoId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const est = await db.obterEstabelecimento(input.estabelecimentoId);
        if (!est || est.adminId !== ctx.user.id) throw new Error('Unauthorized');
        return db.obterLancamentosPorEstabelecimento(input.estabelecimentoId);
      }),
    listarPorCliente: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const cliente = await db.obterCliente(input.clienteId);
        if (!cliente) throw new Error('Not found');
        const est = await db.obterEstabelecimento(cliente.estabelecimentoId);
        if (!est || est.adminId !== ctx.user.id) throw new Error('Unauthorized');
        return db.obterLancamentosPorCliente(input.clienteId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
