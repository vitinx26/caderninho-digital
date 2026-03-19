/**
 * Utilitário para trabalhar com data/hora de Brasília
 * Garante que todos os registros usem o fuso horário correto
 */

/**
 * Obter data/hora atual em Brasília (UTC-3)
 * @returns Data atual em Brasília
 */
export function obterDataBrasilia(): Date {
  // Criar data em UTC
  const agora = new Date();
  
  // Converter para Brasília (UTC-3)
  // Brasília usa horário de verão (UTC-2) de outubro a fevereiro
  const fusoHorarioBrasilia = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });

  const partes = fusoHorarioBrasilia.formatToParts(agora);
  const dia = parseInt(partes.find(p => p.type === 'day')?.value || '1');
  const mes = parseInt(partes.find(p => p.type === 'month')?.value || '1') - 1;
  const ano = parseInt(partes.find(p => p.type === 'year')?.value || '2026');
  const hora = parseInt(partes.find(p => p.type === 'hour')?.value || '0');
  const minuto = parseInt(partes.find(p => p.type === 'minute')?.value || '0');
  const segundo = parseInt(partes.find(p => p.type === 'second')?.value || '0');

  return new Date(ano, mes, dia, hora, minuto, segundo);
}

/**
 * Obter timestamp em milissegundos (Brasília)
 * @returns Timestamp em Brasília
 */
export function obterTimestampBrasilia(): number {
  return obterDataBrasilia().getTime();
}

/**
 * Formatar data em Brasília para exibição
 * @param data Data a formatar
 * @returns String formatada (DD/MM/YYYY HH:MM:SS)
 */
export function formatarDataBrasilia(data: Date): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return formatter.format(data);
}

/**
 * Formatar apenas a data em Brasília
 * @param data Data a formatar
 * @returns String formatada (DD/MM/YYYY)
 */
export function formatarDataBrasiliaSimples(data: Date): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(data);
}

/**
 * Formatar apenas a hora em Brasília
 * @param data Data a formatar
 * @returns String formatada (HH:MM:SS)
 */
export function formatarHoraBrasilia(data: Date): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return formatter.format(data);
}

/**
 * Obter apenas o dia em Brasília
 * @returns Dia do mês (1-31)
 */
export function obterDiaBrasilia(): number {
  const data = obterDataBrasilia();
  return data.getDate();
}

/**
 * Obter apenas o mês em Brasília
 * @returns Mês (0-11)
 */
export function obterMesBrasilia(): number {
  const data = obterDataBrasilia();
  return data.getMonth();
}

/**
 * Obter apenas o ano em Brasília
 * @returns Ano (ex: 2026)
 */
export function obterAnoBrasilia(): number {
  const data = obterDataBrasilia();
  return data.getFullYear();
}

/**
 * Obter apenas a hora em Brasília
 * @returns Hora (0-23)
 */
export function obterHoraBrasilia(): number {
  const data = obterDataBrasilia();
  return data.getHours();
}

/**
 * Obter apenas o minuto em Brasília
 * @returns Minuto (0-59)
 */
export function obterMinutoBrasilia(): number {
  const data = obterDataBrasilia();
  return data.getMinutes();
}

/**
 * Obter apenas o segundo em Brasília
 * @returns Segundo (0-59)
 */
export function obterSegundoBrasilia(): number {
  const data = obterDataBrasilia();
  return data.getSeconds();
}

/**
 * Validar se uma data é de hoje em Brasília
 * @param data Data a validar
 * @returns true se for hoje, false caso contrário
 */
export function ehHojeBrasilia(data: Date): boolean {
  const hoje = obterDataBrasilia();
  return (
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear()
  );
}

/**
 * Obter início do dia em Brasília
 * @returns Data com hora 00:00:00
 */
export function obterInicioDiaBrasilia(): Date {
  const data = obterDataBrasilia();
  data.setHours(0, 0, 0, 0);
  return data;
}

/**
 * Obter fim do dia em Brasília
 * @returns Data com hora 23:59:59
 */
export function obterFimDiaBrasilia(): Date {
  const data = obterDataBrasilia();
  data.setHours(23, 59, 59, 999);
  return data;
}
