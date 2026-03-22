/**
 * Hook para buscar lançamentos do servidor em tempo real
 * Substitui useLancamentos() que busca apenas do IndexedDB local
 */

import { useState, useEffect, useCallback } from 'react';
import { Lancamento } from '@/types';

export function useServerTransactions() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/transactions');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar transações: ${response.status}`);
      }

      const resposta = await response.json();
      
      // Converter dados do servidor para formato Lancamento
      // O endpoint retorna { success, data: [...], count, timestamp }
      const dados = resposta.data || resposta;
      const lancamentosFormatados: Lancamento[] = (Array.isArray(dados) ? dados : []).map((t: any) => ({
        id: t.id,
        clienteId: t.cliente_id || t.clienteId, // Suportar ambos snake_case e camelCase
        tipo: t.tipo as 'debito' | 'pagamento',
        valor: Math.round(t.valor / 100), // Converter centavos para reais
        descricao: t.descricao,
        data: typeof t.data === 'number' ? t.data : (t.data ? new Date(t.data).getTime() : Date.now()),
        dataCriacao: typeof t.dataCriacao === 'number' ? t.dataCriacao : (typeof t.data_criacao === 'number' ? t.data_criacao : Date.now()),
      }));

      // Ordenar por data (mais recente primeiro)
      lancamentosFormatados.sort((a, b) => b.data - a.data);
      
      console.log(`✅ ${lancamentosFormatados.length} transações carregadas do servidor`);
      setLancamentos(lancamentosFormatados);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar lançamentos do servidor');
      console.error('Erro ao carregar transações:', e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    
    // Polling automático a cada 5 segundos para sincronização em tempo real
    const intervalo = setInterval(() => {
      carregar();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [carregar]);

  return {
    lancamentos,
    carregando,
    erro,
    recarregar: carregar,
  };
}
