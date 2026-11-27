import { ConsultaForm, numero } from './consulta-form';

describe('ConsultaForm', () => {
  let form: ConsultaForm;
  beforeEach(() => { form = new ConsultaForm(); form.dataHora = '2025-01-15T14:30'; form.status = 'REALIZADA'; });

  it('valida o calendário sem depender do fuso horário do navegador', () => {
    form.status = 'CONFIRMADA';
    form.dataHora = '2025-02-29T00:30';
    expect(form.validar()['dataHora']).toBeDefined();
    form.dataHora = '2024-02-29T00:30';
    expect(form.validar()['dataHora']).toBeUndefined();
    form.dataHora = '2025-04-03T24:00';
    expect(form.validar()['dataHora']).toBeDefined();
  });
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
  it('permite concluir uma consulta iniciada sem limitar sua duracao ao horario agendado', () => {
    form.carregar({ id: 1, idPaciente: 1, dataHora: '2099-12-01T12:00:00', status: 'CONFIRMADA',
      observacao: null, versao: 1, iniciadaEm: '2099-12-01T11:45:00-03:00', avaliacao: null });
    form.status = 'REALIZADA'; form.medidas.peso = '75'; form.medidas.altura = '180';

    expect(form.validar()['dataHora']).toBeUndefined();
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
  it('preserva segundos do agendamento legado ao editar somente medidas', () => {
    form.carregar({ id: 1, idPaciente: 1, dataHora: '2025-01-15T14:30:45',
      status: 'CONFIRMADA', observacao: null, versao: 0, avaliacao: null });
    expect(form.dataHora).toBe('2025-01-15T14:30');
    expect(form.payload().dataHora).toBe('2025-01-15T14:30:45');
  });
  it('preenche peso e altura a partir da anamnese quando a consulta ainda nao tem avaliacao', () => {
    form.preencherDaAnamnese({ weight: 72.5, height: 1.68 });
    expect(form.medidas.peso).toBe('72,5');
    expect(form.medidas.altura).toBe('168');
  });
  const pregas = ['pregaPeitoral', 'pregaAxilarMedia', 'pregaTricipital', 'pregaSubescapular',
    'pregaAbdominal', 'pregaSuprailiaca', 'pregaCoxa'] as const;

  function prepararMedidas(): void {
    form.definirContextoAntropometrico('1995-01-15', 'Masculino');
    form.atualizarMedida('peso', '80');
    form.atualizarMedida('altura', '180');
  }

  it('mantém o percentual manual com as sete pregas e arredonda as massas para somar o peso', () => {
    prepararMedidas();
    form.atualizarMedida('peso', '73,25');
    form.atualizarMedida('percentualGordura', '2');
    for (const campo of pregas) form.atualizarMedida(campo, '20');

    expect(form.medidas.percentualGordura).toBe('2');
    expect(form.medidas.massaGordaKg).toBe('1,47');
    expect(form.medidas.massaMagraKg).toBe('71,78');
    expect(form.campoSomenteLeitura('percentualGordura')).toBeFalse();
    expect(form.payload().avaliacao).toEqual(jasmine.objectContaining({
      percentualGordura: 2, modoPercentualGordura: 'MANUAL', massaMuscularKg: null
    }));
  });

  it('recalcula gordura pelas sete pregas e remove o resultado quando o cálculo fica inválido', () => {
    prepararMedidas();
    form.atualizarModoPercentualGordura('AUTOMATICO');
    for (const campo of pregas) form.atualizarMedida(campo, '20');
    expect(form.medidas.percentualGordura).toBe('19,98');
    expect(form.medidas.massaMagraKg).toBe('64,02');
    expect(form.medidas.massaGordaKg).toBe('15,98');
    expect(form.campoSomenteLeitura('percentualGordura')).toBeTrue();
    expect(form.ajudaMedida('percentualGordura')).toBe('Calculado automaticamente.');

    for (const campo of pregas) form.atualizarMedida(campo, '22');
    expect(form.medidas.percentualGordura).toBe('21,69');
    expect(form.medidas.massaGordaKg).toBe('17,35');
    expect(form.medidas.massaMagraKg).toBe('62,65');

    form.atualizarMedida('pregaPeitoral', '101');
    expect(form.medidas.percentualGordura).toBe('');
    expect(form.ajudaMedida('percentualGordura')).toContain('Confira os valores');
    for (const campo of pregas) form.atualizarMedida(campo, '0,1');
    expect(form.medidas.percentualGordura).toBe('');
    expect(form.medidas.massaGordaKg).toBe('');
    expect(form.medidas.massaMagraKg).toBe('');
    expect(form.ajudaMedida('percentualGordura')).toContain('Confira os valores');
    expect(form.validar()).toEqual({});
  });

  it('permite salvar pregas incompletas após perder um resultado automático', () => {
    prepararMedidas();
    form.atualizarModoPercentualGordura('AUTOMATICO');
    for (const campo of pregas) form.atualizarMedida(campo, '20');
    form.atualizarMedida('pregaCoxa', '');

    expect(form.ajudaMedida('percentualGordura')).toBe('Preencha as sete pregas para calcular automaticamente.');
    expect(form.validar()).toEqual({});
    expect(form.payload().avaliacao).toEqual(jasmine.objectContaining({
      modoPercentualGordura: 'AUTOMATICO', percentualGordura: null, massaGordaKg: null,
      massaMagraKg: null, pregaCoxa: null, pregaPeitoral: 20
    }));
  });

  it('explica impedimentos independentes e usa a idade no dia da avaliação', () => {
    prepararMedidas();
    form.atualizarModoPercentualGordura('AUTOMATICO');
    form.definirContextoAntropometrico('2000-02-30', null);
    expect(form.ajudaMedida('percentualGordura')).toBe(
      'Informe o sexo do paciente no cadastro para utilizar o cálculo automático. '
      + 'Informe uma data de nascimento válida no cadastro. Preencha as sete pregas para calcular automaticamente.'
    );
    form.definirContextoAntropometrico('1990-01-01', 'Prefiro não informar');
    expect(form.ajudaMedida('percentualGordura')).toContain('Informe o sexo do paciente');
    form.definirContextoAntropometrico('1990-01-01', 'Outro');
    expect(form.ajudaMedida('percentualGordura')).toContain('requer sexo masculino ou feminino');
    for (const campo of pregas) form.atualizarMedida(campo, '20');
    form.definirContextoAntropometrico('1969-01-16', 'Feminino');
    expect(form.medidas.percentualGordura).not.toBe('');
    form.dataHora = '2025-01-16T14:30';
    expect(form.medidas.percentualGordura).toBe('');
    expect(form.ajudaMedida('percentualGordura')).toBe(
      'O método está disponível para pacientes do sexo feminino entre 18 e 55 anos.'
    );
    form.definirContextoAntropometrico('1963-01-16', 'M');
    expect(form.ajudaMedida('percentualGordura')).toContain('sexo masculino entre 18 e 61 anos');
    expect(form.validar()).toEqual({});
  });

  it('mantém valores registrados ao reabrir e interpreta o método existente', () => {
    const avaliacao = { id: 3, imc: 24.69, peso: 80, altura: 1.8, percentualGordura: 23,
      massaGordaKg: 18.4, massaMagraKg: 61.6, massaMuscularKg: null, pregaBicipital: null,
      pregaTricipital: 10, pregaSubescapular: null, pregaSuprailiaca: null, circunferenciaCintura: null,
      circunferenciaQuadril: null, circunferenciaBraco: null };
    const consulta = { id: 1, idPaciente: 1, dataHora: '2025-01-15T14:30:00', status: 'REALIZADA',
      observacao: null, versao: 1, avaliacao };

    form.carregar(consulta);
    expect(form.modoPercentualGordura).toBe('MANUAL');
    expect(form.medidas.percentualGordura).toBe('23');
    form.carregar({ ...consulta, avaliacao: { ...avaliacao, metodoPercentualGordura: 'Jackson-Pollock 7 pregas + Siri' } });
    form.preencherDaAnamnese({ weight: 75, height: 1.75 });
    expect(form.modoPercentualGordura).toBe('AUTOMATICO');
    expect(form.medidas.percentualGordura).toBe('23');
    expect(form.medidas.massaGordaKg).toBe('18,4');
    expect(form.medidas.massaMagraKg).toBe('61,6');
    expect(form.ajudaMedida('percentualGordura')).toContain('Resultado registrado.');
    form.atualizarMedida('pregaTricipital', '22');
    expect(form.medidas.percentualGordura).toBe('');
    expect(form.medidas.massaGordaKg).toBe('');
  });

  it('rejeita os extremos de gordura e massa muscular fora do peso', () => {
    prepararMedidas();
    for (const valor of ['0', '100']) {
      form.atualizarMedida('percentualGordura', valor);
      expect(form.validar()['percentualGordura']).toBeDefined();
      expect(form.medidas.massaGordaKg).toBe('');
    }
    form.atualizarMedida('percentualGordura', '25');
    for (const valor of ['0', '80', '80,01']) {
      form.atualizarMedida('massaMuscularKg', valor);
      expect(form.validar()['massaMuscularKg']).toBeDefined();
    }
    form.atualizarMedida('massaMuscularKg', '79,99');
    expect(form.validar()).toEqual({});
  });
});
