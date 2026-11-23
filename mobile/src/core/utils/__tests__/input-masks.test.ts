import { formatCpfDisplay, extractCpfDigits, normalizeCpf } from '../cpf-mask.util';
import { formatPhoneDisplay, extractPhoneDigits, normalizePhone } from '../phone-mask.util';
import {
  dataNascimentoParaIso,
  formatarDataCivil,
  formatarDataHoraCivil,
  formatDateDisplay,
  formatDateFromDate,
  parseDisplayDate,
  toIsoDate
} from '../date-mask.util';

describe('formatCpfDisplay', () => {
  it('aplica máscara progressiva', () => {
    expect(formatCpfDisplay('111')).toBe('111');
    expect(formatCpfDisplay('111222')).toBe('111.222');
    expect(formatCpfDisplay('111222333')).toBe('111.222.333');
    expect(formatCpfDisplay('11122233344')).toBe('111.222.333-44');
  });

  it('ignora nao digitos e limita a 11', () => {
    expect(extractCpfDigits('111.222.333-4455')).toBe('11122233344');
    expect(normalizeCpf('11122233344')).toBe('111.222.333-44');
  });
});

describe('formatPhoneDisplay', () => {
  it('mascara fixo e celular', () => {
    expect(formatPhoneDisplay('4198888888')).toBe('(41) 9888-8888');
    expect(formatPhoneDisplay('41999999999')).toBe('(41) 99999-9999');
  });

  it('normaliza para digitos na API', () => {
    expect(extractPhoneDigits('(41) 99999-9999')).toBe('41999999999');
    expect(normalizePhone('(41) 99999-9999')).toBe('41999999999');
  });
});

describe('formatDateDisplay / toIsoDate', () => {
  it('mascara DD/MM/AAAA', () => {
    expect(formatDateDisplay('0101')).toBe('01/01');
    expect(formatDateDisplay('01012000')).toBe('01/01/2000');
  });

  it('converte para ISO', () => {
    expect(toIsoDate('01/01/2000')).toBe('2000-01-01');
    expect(toIsoDate('2000-01-01')).toBe('2000-01-01');
    expect(toIsoDate('32/13/2000')).toBeUndefined();
  });

  it.each(['31/02/2000', '29/02/1900', '2000-02-31', '1900-02-29'])(
    'rejeita uma data inexistente (%s)',
    (valor) => expect(toIsoDate(valor)).toBeUndefined()
  );

  it('aceita o dia bissexto nos dois formatos', () => {
    expect(toIsoDate('29/02/2000')).toBe('2000-02-29');
    expect(toIsoDate('2000-02-29')).toBe('2000-02-29');
  });

  it('converte Date <-> display', () => {
    expect(formatDateFromDate(new Date(2000, 0, 1))).toBe('01/01/2000');
    expect(parseDisplayDate('01/01/2000')?.getFullYear()).toBe(2000);
    expect(parseDisplayDate('31/02/2000')).toBeNull();
  });

  it('preserva o dia civil exibido mesmo quando o horário está perto de meia-noite', () => {
    expect(formatarDataCivil('2026-10-05')).toBe('05/10/2026');
    expect(formatarDataCivil('05/10/2026')).toBe('05/10/2026');
    expect(formatarDataHoraCivil('2026-10-05T00:05:00')).toBe('05/10/2026, às 00:05');
    expect(formatarDataCivil('2026-02-30')).toBe('');
  });

  it('preserva o limite inferior do campo de nascimento', () => {
    expect(dataNascimentoParaIso('31/12/1899')).toBeUndefined();
    expect(dataNascimentoParaIso('01/01/1900')).toBe('1900-01-01');
  });
});
