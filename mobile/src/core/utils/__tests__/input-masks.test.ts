import { formatCpfDisplay, extractCpfDigits, normalizeCpf } from '../cpf-mask.util';
import { formatPhoneDisplay, extractPhoneDigits, normalizePhone } from '../phone-mask.util';
import {
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

  it('converte Date <-> display', () => {
    expect(formatDateFromDate(new Date(2000, 0, 1))).toBe('01/01/2000');
    expect(parseDisplayDate('01/01/2000')?.getFullYear()).toBe(2000);
    expect(parseDisplayDate('31/02/2000')).toBeNull();
  });
});
