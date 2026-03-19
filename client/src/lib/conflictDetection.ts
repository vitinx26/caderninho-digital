/**
 * Módulo de Detecção de Conflitos
 * Detecta e resolve conflitos entre versões local e servidor
 */

import { Cliente, Lancamento, Usuario } from '@/types';
import { SyncConflict } from './serverBackupSync';

export interface ConflictResolution {
  tipo: 'cliente' | 'lancamento' | 'usuario';
  id: string;
  acao: 'usar_local' | 'usar_servidor' | 'mesclar';
  motivo: string;
}

/**
 * Detecta conflitos entre dados locais e do servidor
 */
export function detectarConflitos(
  dadosLocais: {
    clientes: Cliente[];
    lancamentos: Lancamento[];
    usuarios: Usuario[];
  },
  dadosServidor: {
    clientes: Cliente[];
    lancamentos: Lancamento[];
    usuarios: Usuario[];
  }
): SyncConflict[] {
  const conflitos: SyncConflict[] = [];

  // Detectar conflitos em clientes
  conflitos.push(...detectarConflitosClientes(dadosLocais.clientes, dadosServidor.clientes));

  // Detectar conflitos em lançamentos
  conflitos.push(...detectarConflitosLancamentos(dadosLocais.lancamentos, dadosServidor.lancamentos));

  // Detectar conflitos em usuários
  conflitos.push(...detectarConflitosUsuarios(dadosLocais.usuarios, dadosServidor.usuarios));

  return conflitos;
}

/**
 * Detecta conflitos em clientes
 */
function detectarConflitosClientes(locais: Cliente[], servidor: Cliente[]): SyncConflict[] {
  const conflitos: SyncConflict[] = [];
  const mapServidor = new Map(servidor.map((c) => [c.id, c]));

  for (const clienteLocal of locais) {
    const clienteServidor = mapServidor.get(clienteLocal.id);

    if (!clienteServidor) {
      // Cliente existe localmente mas não no servidor - será criado
      continue;
    }

    // Comparar timestamps
    const tsLocal = new Date(clienteLocal.dataCriacao).getTime();
    const tsServidor = new Date(clienteServidor.dataCriacao).getTime();

    if (tsLocal !== tsServidor) {
      // Versões diferentes - detectar conflito
      conflitos.push({
        tipo: 'cliente',
        id: clienteLocal.id,
        localTimestamp: tsLocal,
        servidorTimestamp: tsServidor,
        acao: tsServidor > tsLocal ? 'usar_servidor' : 'usar_local',
      });
    }
  }

  return conflitos;
}

/**
 * Detecta conflitos em lançamentos
 */
function detectarConflitosLancamentos(locais: Lancamento[], servidor: Lancamento[]): SyncConflict[] {
  const conflitos: SyncConflict[] = [];
  const mapServidor = new Map(servidor.map((l) => [l.id, l]));

  for (const lancLocal of locais) {
    const lancServidor = mapServidor.get(lancLocal.id);

    if (!lancServidor) {
      continue;
    }

    const tsLocal = new Date(lancLocal.dataCriacao).getTime();
    const tsServidor = new Date(lancServidor.dataCriacao).getTime();

    if (tsLocal !== tsServidor) {
      conflitos.push({
        tipo: 'lancamento',
        id: lancLocal.id,
        localTimestamp: tsLocal,
        servidorTimestamp: tsServidor,
        acao: tsServidor > tsLocal ? 'usar_servidor' : 'usar_local',
      });
    }
  }

  return conflitos;
}

/**
 * Detecta conflitos em usuários
 */
function detectarConflitosUsuarios(locais: Usuario[], servidor: Usuario[]): SyncConflict[] {
  const conflitos: SyncConflict[] = [];
  const mapServidor = new Map(servidor.map((u) => [u.id, u]));

  for (const usuarioLocal of locais) {
    const usuarioServidor = mapServidor.get(usuarioLocal.id);

    if (!usuarioServidor) {
      continue;
    }

    const tsLocal = new Date(usuarioLocal.dataCriacao).getTime();
    const tsServidor = new Date(usuarioServidor.dataCriacao).getTime();

    if (tsLocal !== tsServidor) {
      conflitos.push({
        tipo: 'usuario',
        id: usuarioLocal.id,
        localTimestamp: tsLocal,
        servidorTimestamp: tsServidor,
        acao: tsServidor > tsLocal ? 'usar_servidor' : 'usar_local',
      });
    }
  }

  return conflitos;
}

/**
 * Resolve conflitos automaticamente
 */
export function resolverConflitosAutomaticamente(
  conflitos: SyncConflict[],
  dadosLocais: {
    clientes: Cliente[];
    lancamentos: Lancamento[];
    usuarios: Usuario[];
  },
  dadosServidor: {
    clientes: Cliente[];
    lancamentos: Lancamento[];
    usuarios: Usuario[];
  }
): ConflictResolution[] {
  const resolucoes: ConflictResolution[] = [];

  for (const conflito of conflitos) {
    let resolucao: ConflictResolution;

    // Por padrão, usar versão mais recente (timestamp maior)
    if (conflito.servidorTimestamp > conflito.localTimestamp) {
      resolucao = {
        tipo: conflito.tipo,
        id: conflito.id,
        acao: 'usar_servidor',
        motivo: 'Versão do servidor é mais recente',
      };
    } else {
      resolucao = {
        tipo: conflito.tipo,
        id: conflito.id,
        acao: 'usar_local',
        motivo: 'Versão local é mais recente',
      };
    }

    resolucoes.push(resolucao);
  }

  return resolucoes;
}

/**
 * Aplica resoluções de conflitos
 */
export function aplicarResolucoes(
  resolucoes: ConflictResolution[],
  dadosLocais: {
    clientes: Cliente[];
    lancamentos: Lancamento[];
    usuarios: Usuario[];
  },
  dadosServidor: {
    clientes: Cliente[];
    lancamentos: Lancamento[];
    usuarios: Usuario[];
  }
): {
  clientes: Cliente[];
  lancamentos: Lancamento[];
  usuarios: Usuario[];
} {
  const resultado = {
    clientes: [...dadosLocais.clientes],
    lancamentos: [...dadosLocais.lancamentos],
    usuarios: [...dadosLocais.usuarios],
  };

  for (const resolucao of resolucoes) {
    if (resolucao.tipo === 'cliente') {
      const idx = resultado.clientes.findIndex((c) => c.id === resolucao.id);
      if (idx >= 0) {
        if (resolucao.acao === 'usar_servidor') {
          const clienteServidor = dadosServidor.clientes.find((c) => c.id === resolucao.id);
          if (clienteServidor) {
            resultado.clientes[idx] = clienteServidor;
          }
        }
        // Se usar_local, já está no resultado
      }
    } else if (resolucao.tipo === 'lancamento') {
      const idx = resultado.lancamentos.findIndex((l) => l.id === resolucao.id);
      if (idx >= 0) {
        if (resolucao.acao === 'usar_servidor') {
          const lancServidor = dadosServidor.lancamentos.find((l) => l.id === resolucao.id);
          if (lancServidor) {
            resultado.lancamentos[idx] = lancServidor;
          }
        }
      }
    } else if (resolucao.tipo === 'usuario') {
      const idx = resultado.usuarios.findIndex((u) => u.id === resolucao.id);
      if (idx >= 0) {
        if (resolucao.acao === 'usar_servidor') {
          const usuarioServidor = dadosServidor.usuarios.find((u) => u.id === resolucao.id);
          if (usuarioServidor) {
            resultado.usuarios[idx] = usuarioServidor;
          }
        }
      }
    }
  }

  return resultado;
}

/**
 * Detecta duplicatas
 */
export function detectarDuplicatas(dados: {
  clientes: Cliente[];
  lancamentos: Lancamento[];
  usuarios: Usuario[];
}): {
  clientes: string[];
  lancamentos: string[];
  usuarios: string[];
} {
  const duplicatas = {
    clientes: [] as string[],
    lancamentos: [] as string[],
    usuarios: [] as string[],
  };

  // Detectar clientes duplicados
  const clientesIds = new Set<string>();
  for (const cliente of dados.clientes) {
    if (clientesIds.has(cliente.id)) {
      duplicatas.clientes.push(cliente.id);
    }
    clientesIds.add(cliente.id);
  }

  // Detectar lançamentos duplicados
  const lancamentosIds = new Set<string>();
  for (const lancamento of dados.lancamentos) {
    if (lancamentosIds.has(lancamento.id)) {
      duplicatas.lancamentos.push(lancamento.id);
    }
    lancamentosIds.add(lancamento.id);
  }

  // Detectar usuários duplicados
  const usuariosIds = new Set<string>();
  for (const usuario of dados.usuarios) {
    if (usuariosIds.has(usuario.id)) {
      duplicatas.usuarios.push(usuario.id);
    }
    usuariosIds.add(usuario.id);
  }

  return duplicatas;
}
