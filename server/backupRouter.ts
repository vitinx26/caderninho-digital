/**
 * Rotas de API para Backup na Nuvem
 * Sincroniza dados com servidor backend para proteção total
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';


const router = Router();

// Diretório para armazenar backups
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// Criar diretório se não existir
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

interface BackupData {
  id: string;
  timestamp: number;
  usuarioId: string;
  usuarioEmail: string;
  clientes: any[];
  lancamentos: any[];
  usuarios: any[];
  versao: string;
}

interface BackupMetadata {
  id: string;
  timestamp: number;
  usuarioEmail: string;
  tamanho: number;
  status: 'sucesso' | 'erro' | 'pendente';
  mensagem?: string;
}

/**
 * POST /api/backup/upload - Fazer upload de backup
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const backup: BackupData = req.body;

    if (!backup || !backup.usuarioEmail) {
      return res.status(400).json({ error: 'Dados de backup inválidos' });
    }

    // Gerar ID único para backup
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupPath = path.join(BACKUPS_DIR, `${backupId}.json`);

    // Salvar backup em arquivo
    const backupContent = JSON.stringify(backup, null, 2);
    fs.writeFileSync(backupPath, backupContent, 'utf-8');

    // Obter tamanho do arquivo
    const stats = fs.statSync(backupPath);
    const tamanho = stats.size || 0;

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: backup.timestamp,
      usuarioEmail: backup.usuarioEmail,
      tamanho,
      status: 'sucesso',
    };

    console.log(`✓ Backup salvo: ${backupId} (${tamanho} bytes)`);
    res.json(metadata);
  } catch (error) {
    console.error('Erro ao fazer upload de backup:', error);
    res.status(500).json({
      error: 'Erro ao fazer upload de backup',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
      status: 'erro',
    });
  }
});

/**
 * GET /api/backup/list - Listar backups do usuário
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Listar todos os arquivos de backup
    const files = fs.readdirSync(BACKUPS_DIR);
    const backups: BackupMetadata[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(BACKUPS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const backup: BackupData = JSON.parse(content);

      // Filtrar apenas backups do usuário
      if (backup.usuarioEmail === email) {
        const stats = fs.statSync(filePath);
        backups.push({
          id: backup.id,
          timestamp: backup.timestamp,
          usuarioEmail: backup.usuarioEmail,
          tamanho: stats.size,
          status: 'sucesso',
        });
      }
    }

    // Ordenar por data decrescente
    backups.sort((a, b) => b.timestamp - a.timestamp);

    console.log(`✓ ${backups.length} backups encontrados para ${email}`);
    res.json(backups);
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({
      error: 'Erro ao listar backups',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * GET /api/backup/download/:id - Baixar backup específico
 */
router.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const backupPath = path.join(BACKUPS_DIR, `${id}.json`);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    const content = fs.readFileSync(backupPath, 'utf-8');
    const backup: BackupData = JSON.parse(content);

    console.log(`✓ Backup baixado: ${id}`);
    res.json(backup);
  } catch (error) {
    console.error('Erro ao baixar backup:', error);
    res.status(500).json({
      error: 'Erro ao baixar backup',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * DELETE /api/backup/delete/:id - Deletar backup
 */
router.delete('/delete/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const backupPath = path.join(BACKUPS_DIR, `${id}.json`);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    fs.unlinkSync(backupPath);

    console.log(`✓ Backup deletado: ${id}`);
    res.json({ sucesso: true, mensagem: 'Backup deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar backup:', error);
    res.status(500).json({
      error: 'Erro ao deletar backup',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

/**
 * GET /api/backup/status - Status de sincronização
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Contar backups do usuário
    const files = fs.readdirSync(BACKUPS_DIR);
    let totalBackups = 0;
    let ultimoBackup = 0;
    let tamanhoTotal = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(BACKUPS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const backup: BackupData = JSON.parse(content);

      if (backup.usuarioEmail === email) {
        totalBackups++;
        const stats = fs.statSync(filePath);
        tamanhoTotal += stats.size;
        ultimoBackup = Math.max(ultimoBackup, backup.timestamp);
      }
    }

    const status = {
      email,
      totalBackups,
      ultimoBackup,
      tamanhoTotal,
      dataUltimoBackup: ultimoBackup > 0 ? new Date(ultimoBackup).toISOString() : null,
      sincronizado: true,
    };

    res.json(status);
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({
      error: 'Erro ao obter status',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

export default router;
