export function dataIsoValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const [ano, mes, dia] = data.split('-').map(Number);
  if (ano === 0 || mes < 1 || mes > 12 || dia < 1) return false;
  const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
  const diasPorMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return dia <= diasPorMes[mes - 1];
}

export function formatarDataBr(data: string | null | undefined): string {
  if (!data || !dataIsoValida(data)) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function converterDataBrParaIso(data: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);
  if (!partes) return null;
  const [, dia, mes, ano] = partes;
  const iso = `${ano}-${mes}-${dia}`;
  return dataIsoValida(iso) ? iso : null;
}

export function aplicarMascaraDataBr(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4)].filter(Boolean).join('/');
}

export function horarioCivilIso(dataHora: string): string {
  const partes = /^\d{4}-\d{2}-\d{2}T((?:[01]\d|2[0-3]):[0-5]\d)(?::[0-5]\d(?:\.\d{1,9})?)?$/.exec(dataHora);
  return partes && dataIsoValida(dataHora.slice(0, 10)) ? partes[1] : '';
}
