/**
 * Gerador de mensagens WhatsApp com template personalizado
 */

import { Lancamento, Cliente } from '@/types';

/**
 * Template padrão de mensagem de cobrança
 */
export const TEMPLATE_PADRAO = `Olá {cliente}, você tem um débito de R$ {valor} vencido em {data}. Por favor, efetue o pagamento.`;

/**
 * Variáveis disponíveis no template
 */
export const VARIAVEIS_DISPONIVEIS = {
  cliente: 'Nome do cliente',
  valor: 'Valor do débito (formatado)',
  data: 'Data do vencimento (formatada)',
  descricao: 'Descrição do débito',
};

/**
 * Formatar valor em reais
 */
function formatarValor(valor: number): string {
  return (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formatar data
 */
function formatarData(timestamp: number): string {
  const data = new Date(timestamp);
  return data.toLocaleDateString('pt-BR');
}

/**
 * Gerar mensagem WhatsApp substituindo variáveis
 */
export function gerarMensagemWhatsApp(
  template: string | undefined,
  cliente: Cliente,
  lancamento: Lancamento
): string {
  // Usar template personalizado ou padrão
  const templateFinal = template || TEMPLATE_PADRAO;

  // Substituir variáveis
  let mensagem = templateFinal
    .replace(/{cliente}/g, cliente.nome)
    .replace(/{valor}/g, formatarValor(lancamento.valor))
    .replace(/{data}/g, formatarData(lancamento.data))
    .replace(/{descricao}/g, lancamento.descricao);

  return mensagem;
}

/**
 * Gerar URL do WhatsApp para enviar mensagem
 */
export function gerarUrlWhatsApp(
  numeroWhatsApp: string,
  mensagem: string
): string {
  // Remover caracteres especiais do número
  const numeroLimpo = numeroWhatsApp.replace(/\D/g, '');
  
  // Codificar mensagem para URL
  const mensagemCodificada = encodeURIComponent(mensagem);
  
  // Retornar URL do WhatsApp Web ou API
  return `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
}

/**
 * Validar template (verificar se contém variáveis válidas)
 */
export function validarTemplate(template: string): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];

  // Verificar se o template não está vazio
  if (!template || template.trim().length === 0) {
    erros.push('Template não pode estar vazio');
  }

  // Verificar se há variáveis inválidas
  const variaveisEncontradas = template.match(/{[^}]+}/g) || [];
  const variaveisValidas = Object.keys(VARIAVEIS_DISPONIVEIS);

  for (const variavel of variaveisEncontradas) {
    const nomeVariavel = variavel.slice(1, -1); // Remove { e }
    if (!variaveisValidas.includes(nomeVariavel)) {
      erros.push(`Variável inválida: ${variavel}`);
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
