import { formatarDataAceite, formatarVersaoTermos } from '../privacidade';

describe('formatação da versão dos termos', () => {
  it('apresenta a data em formato brasileiro e identifica a revisão', () => {
    expect(formatarVersaoTermos('2026-11-16.2')).toBe('16/11/2026 (revisão 2)');
    expect(formatarVersaoTermos('2026-01-03')).toBe('03/01/2026');
    expect(formatarVersaoTermos('versão especial')).toBe('versão especial');
  });

  it('formata a data do aceite no fuso de São Paulo', () => {
    expect(formatarDataAceite('2026-11-17T01:00:00Z')).toBe('16/11/2026');
    expect(formatarDataAceite('data inválida')).toBe('');
  });
});
