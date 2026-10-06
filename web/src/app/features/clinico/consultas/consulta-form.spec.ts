import { ConsultaForm, numero } from './consulta-form';

describe('ConsultaForm', () => {
  let form: ConsultaForm;
  beforeEach(() => { form = new ConsultaForm(); form.dataHora = '2025-01-15T14:30'; form.status = 'REALIZADA'; });
  it('exige peso e altura para concluir e converte centimetros para metros', () => {
    expect(form.validar()['peso']).toBeTruthy();
    expect(form.validar()['altura']).toBeTruthy();
    form.medidas.peso = '80,5'; form.medidas.altura = '180';
    expect(form.validar()).toEqual({});
    expect(form.payload().avaliacao?.altura).toBe(1.8);
    expect(form.payload().avaliacao?.peso).toBe(80.5);
    expect(form.imc).toBe('24,85');
  });
  it('permite agendar sem fabricar medidas', () => {
    form.status = 'CONFIRMADA';
    expect(form.validar()).toEqual({});
    expect(form.payload().avaliacao).toBeNull();
  });
  it('exige peso e altura quando qualquer medida for preenchida', () => {
    form.status = 'CONFIRMADA'; form.medidas.pregaBicipital = '12';
    expect(form.validar()['peso']).toBeTruthy(); expect(form.validar()['altura']).toBeTruthy();
  });
  it('rejeita valores fora do limite, altura fracionada e precisao excessiva', () => {
    form.medidas.peso = '501'; form.medidas.altura = '175,5'; form.medidas.percentualGordura = '20,001';
    expect(Object.keys(form.validar())).toEqual(['peso', 'altura', 'percentualGordura']);
  });
  it('nao interpreta texto invalido como zero', () => {
    expect(numero('')).toBeNull(); expect(numero('abc')).toBeNaN();
    expect(numero('12,5')).toBe(12.5); expect(numero('12.5')).toBe(12.5); expect(numero('-1')).toBeNaN();
  });
  it('nao permite concluir no futuro e limita observacoes', () => {
    form.dataHora = '2099-12-01T12:00'; form.observacao = 'x'.repeat(5001);
    expect(form.validar()['dataHora']).toBeTruthy(); expect(form.validar()['observacao']).toBeTruthy();
  });
  it('preserva a avaliacao e a versao ao abrir para editar', () => {
    form.carregar({ id: 1, idPaciente: 1, dataHora: '2025-01-15T14:30:00', status: 'REALIZADA',
      observacao: 'Exames', versao: 2, avaliacao: { id: 3, imc: 24.69, peso: 80, altura: 1.8,
        percentualGordura: null, massaMuscularKg: null, pregaBicipital: null, pregaTricipital: null,
        pregaSubescapular: null, pregaSuprailiaca: null, circunferenciaCintura: null,
        circunferenciaQuadril: null, circunferenciaBraco: null } });
    expect(form.medidas.altura).toBe('180'); expect(form.payload().versao).toBe(2);
    form.status = 'CANCELADA'; form.medidas.peso = ''; form.medidas.altura = '';
    expect(form.validar()['peso']).toBeTruthy();
  });
});
