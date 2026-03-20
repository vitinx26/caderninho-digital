/**
 * csvExport.ts - Utilitário para exportar lançamentos em formato CSV
 */

export interface LancamentoCSV {
  data: string;
  cliente: string;
  descricao: string;
  valor: number;
  tipo: string;
}

/**
 * Exporta lançamentos para CSV
 * @param lancamentos Array de lançamentos
 * @param nomeArquivo Nome do arquivo a ser baixado
 */
export function exportarParaCSV(
  lancamentos: any[],
  nomeArquivo: string = 'lancamentos.csv'
) {
  try {
    // Preparar cabeçalho
    const cabecalho = ['Data', 'Cliente', 'Descrição', 'Valor (R$)', 'Tipo'];
    
    // Preparar linhas
    const linhas = lancamentos.map(lancamento => [
      formatarData(lancamento.data_lancamento || lancamento.dataCriacao || new Date()),
      lancamento.cliente_nome || lancamento.nomeCliente || 'N/A',
      lancamento.descricao || lancamento.descricao || '',
      formatarValor(lancamento.valor || 0),
      lancamento.tipo || 'Consumo'
    ]);

    // Combinar cabeçalho e linhas
    const conteudo = [
      cabecalho.join(','),
      ...linhas.map(linha => 
        linha.map(celula => 
          typeof celula === 'string' && celula.includes(',')
            ? `"${celula}"`
            : celula
        ).join(',')
      )
    ].join('\n');

    // Adicionar BOM para UTF-8 (garante que Excel abra corretamente)
    const bom = '\uFEFF';
    const conteudoComBOM = bom + conteudo;

    // Criar blob
    const blob = new Blob([conteudoComBOM], { type: 'text/csv;charset=utf-8;' });

    // Criar link de download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ CSV exportado com sucesso:', nomeArquivo);
  } catch (error) {
    console.error('❌ Erro ao exportar CSV:', error);
    throw error;
  }
}

/**
 * Formata data para formato brasileiro (DD/MM/YYYY HH:MM)
 */
function formatarData(data: any): string {
  try {
    const date = new Date(data);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  } catch {
    return 'N/A';
  }
}

/**
 * Formata valor em reais
 */
function formatarValor(valor: number): string {
  try {
    // Se valor está em centavos (ex: 1500 = R$ 15,00)
    const valorEmReais = typeof valor === 'number' && valor > 100 
      ? valor / 100 
      : valor;
    
    return valorEmReais.toFixed(2).replace('.', ',');
  } catch {
    return '0,00';
  }
}

/**
 * Exporta lançamentos com filtros opcionais
 */
export function exportarLancamentosComFiltros(
  lancamentos: any[],
  filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    cliente?: string;
    tipo?: string;
  }
) {
  let lancamentosFiltrados = lancamentos;

  if (filtros) {
    if (filtros.dataInicio) {
      lancamentosFiltrados = lancamentosFiltrados.filter(l => 
        new Date(l.data_lancamento || l.dataCriacao) >= filtros.dataInicio!
      );
    }

    if (filtros.dataFim) {
      lancamentosFiltrados = lancamentosFiltrados.filter(l => 
        new Date(l.data_lancamento || l.dataCriacao) <= filtros.dataFim!
      );
    }

    if (filtros.cliente) {
      lancamentosFiltrados = lancamentosFiltrados.filter(l =>
        (l.cliente_nome || l.nomeCliente || '').toLowerCase().includes(filtros.cliente!.toLowerCase())
      );
    }

    if (filtros.tipo) {
      lancamentosFiltrados = lancamentosFiltrados.filter(l =>
        (l.tipo || 'Consumo').toLowerCase() === filtros.tipo!.toLowerCase()
      );
    }
  }

  const dataAtual = new Date();
  const nomeArquivo = `lancamentos_${dataAtual.toISOString().split('T')[0]}.csv`;
  
  exportarParaCSV(lancamentosFiltrados, nomeArquivo);
}
