/**
 * syncPollingRouter.ts - Endpoints de sincronização via polling HTTP
 */

import express, { Request, Response } from 'express';
import { db } from './db-client';
import { users, transactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * POST /api/sync/dados - Buscar dados atualizados desde última sincronização
 */
router.post('/dados', async (req: Request, res: Response) => {
  try {
    const { usuarioId, lastSync } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: 'usuarioId é obrigatório' });
    }

    // Buscar usuários (clientes) - todos os users com role='user'
    const clientesAtualizados = await db
      .select()
      .from(users)
      .where(eq(users.role, 'user'))
      .execute();

    // Buscar lançamentos atualizados
    const lancamentosAtualizados = await db
      .select()
      .from(transactions)
      .where(eq(transactions.admin_id, String(usuarioId)))
      .execute();

    res.json({
      clientes: clientesAtualizados || [],
      lancamentos: lancamentosAtualizados || [],
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Erro ao buscar dados para sincronização:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

/**
 * POST /api/sync/enviar - Enviar dados locais para servidor
 */
router.post('/enviar', async (req: Request, res: Response) => {
  try {
    const { usuarioId, clientes: clientesLocal, lancamentos: lancamentosLocal } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ error: 'usuarioId é obrigatório' });
    }

    let clientesCriados = 0;
    let lancamentosCriados = 0;
    let erros = [];

    // Sincronizar clientes (agora são users com role='user')
    for (const cliente of clientesLocal || []) {
      try {
        await db.insert(users).values({
          ...cliente,
          role: 'user',
        }).onDuplicateKeyUpdate({
          set: { ...cliente, role: 'user' },
        }).execute();
        clientesCriados++;
      } catch (error) {
        erros.push(`Erro ao sincronizar cliente ${cliente.id}: ${error}`);
      }
    }

    // Sincronizar lançamentos
    for (const lancamento of lancamentosLocal || []) {
      try {
        await db.insert(transactions).values({
          ...lancamento,
          admin_id: String(usuarioId),
        }).onDuplicateKeyUpdate({
          set: { ...lancamento, admin_id: String(usuarioId) },
        }).execute();
        lancamentosCriados++;
      } catch (error) {
        erros.push(`Erro ao sincronizar lançamento ${lancamento.id}: ${error}`);
      }
    }

    res.json({
      success: true,
      clientesCriados,
      lancamentosCriados,
      erros: erros.length > 0 ? erros : undefined,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Erro ao receber dados para sincronização:', error);
    res.status(500).json({ error: 'Erro ao receber dados' });
  }
});

/**
 * GET /api/sync/status - Obter status de sincronização
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    isConnected: true,
    timestamp: Date.now(),
    version: '1.0.0',
  });
});

export default router;
