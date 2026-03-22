/**
 * Hook para buscar clientes/usuários do servidor em tempo real
 * Busca da tabela users via GET /api/users
 */

import { useState, useEffect, useCallback } from 'react';

interface Usuario {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  role: 'admin' | 'user';
  dataCriacao: number;
  ativo: boolean;
}

export function useServerClientes() {
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar usuários: ${response.status}`);
      }

      const dados = await response.json();
      
      // Filtrar apenas usuários (não admins) e ordenar por nome
      const usuariosAtivos = dados
        .filter((u: Usuario) => u.role === 'user')
        .sort((a: Usuario, b: Usuario) => a.nome.localeCompare(b.nome));
      
      setClientes(usuariosAtivos);
      setErro(null);
    } catch (e) {
      console.error('Erro ao buscar clientes do servidor:', e);
      setErro(e instanceof Error ? e.message : 'Erro ao buscar clientes');
    } finally {
      setCarregando(false);
    }
  }, []);

  // Carregar dados na montagem
  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // Polling automático a cada 5 segundos
  useEffect(() => {
    const intervalo = setInterval(recarregar, 5000);
    return () => clearInterval(intervalo);
  }, [recarregar]);

  return {
    clientes,
    carregando,
    erro,
    recarregar,
  };
}
