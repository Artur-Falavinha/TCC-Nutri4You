import { criarLinkGoogleAgenda } from './google-calendar-link';

describe('criarLinkGoogleAgenda', () => {
  it('monta um evento de 45 minutos no fuso da clínica', () => {
    const url = new URL(criarLinkGoogleAgenda({ dataHora: '2026-11-20T14:00:00', pacienteNome: 'Ana Souza' }));
    expect(url.origin).toBe('https://calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20261120T140000/20261120T144500');
    expect(url.searchParams.get('ctz')).toBe('America/Sao_Paulo');
    expect(url.searchParams.get('text')).toContain('Ana Souza');
  });
});
