/**
 * Tipos compartilhados para o Caderninho Digital
 * Design: Minimalismo Funcional com Tipografia Forte
 */

export type TipoUsuario = 'admin' | 'cliente';

export interface Usuario {
  id: string;
  email: string;
  senha: string; // Hash em produção
  nome: string;
  tipo: TipoUsuario;
  telefone?: string;
  dataCriacao: number;
}

export interface UsuarioLogado {
  id: string;
  email: string;
  nome: string;
  tipo: TipoUsuario;
  telefone?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  dataCriacao: number; // timestamp
  ativo: boolean;
  adminId?: string; // ID do admin que criou (para clientes criados por admin)
}

export interface Lancamento {
  id: string;
  clienteId: string;
  tipo: 'debito' | 'pagamento'; // débito = dívida, pagamento = recebimento
  valor: number;
  descricao: string;
  data: number; // timestamp
  dataCriacao: number; // timestamp
  adminId?: string; // ID do admin que registrou
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
  numeroWhatsAppAdmin?: string; // Número do WhatsApp do admin para cobranças
}

export interface RelatorioMensal {
  mes: number;
  ano: number;
  totalRecebido: number;
  totalPendente: number;
  totalVencido: number;
  clientesAtivos: number;
}
