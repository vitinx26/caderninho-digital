/**
 * Tipos compartilhados para o Caderninho Digital
 * Design: Minimalismo Funcional com Tipografia Forte
 */

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  dataCriacao: number; // timestamp
  ativo: boolean;
}

export interface Lancamento {
  id: string;
  clienteId: string;
  tipo: 'debito' | 'pagamento'; // débito = dívida, pagamento = recebimento
  valor: number;
  descricao: string;
  data: number; // timestamp
  dataCriacao: number; // timestamp
}

export interface Saldo {
  clienteId: string;
  nomeCliente: string;
  saldoTotal: number;
  ultimoLancamento: number; // timestamp
  status: 'pago' | 'pendente' | 'vencido'; // Será calculado baseado em regras
}

export interface ConfiguracaoApp {
  diasParaVencer: number; // Quantos dias até marcar como vencido
  ultimoBackup: number; // timestamp do último backup
  versao: string;
}

export interface RelatorioMensal {
  mes: number;
  ano: number;
  totalRecebido: number;
  totalPendente: number;
  totalVencido: number;
  clientesAtivos: number;
}
