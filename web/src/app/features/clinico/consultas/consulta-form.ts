import { Consulta, ConsultaPayload, MedidasConsulta } from './consultas.service';

export type CampoMedida = keyof MedidasConsulta;
export interface CampoConsulta {
  key: CampoMedida; label: string; min: number; max: number; inteiro?: boolean;
}
export const CAMPOS_MEDIDAS: CampoConsulta[] = [
  { key: 'peso', label: 'Peso (kg)', min: 1, max: 500 },
  { key: 'altura', label: 'Altura (cm)', min: 30, max: 270, inteiro: true },
  { key: 'percentualGordura', label: 'Gordura corporal (%)', min: 0, max: 100 },
  { key: 'massaMagraKg', label: 'Massa magra (kg)', min: 0, max: 500 },
  { key: 'massaGordaKg', label: 'Massa gorda (kg)', min: 0, max: 500 },
  { key: 'massaMuscularKg', label: 'Massa muscular (kg)', min: 0, max: 300 },
  { key: 'pregaBicipital', label: 'Prega bicipital (mm)', min: 0.1, max: 100 },
  { key: 'pregaPeitoral', label: 'Prega peitoral (mm)', min: 0.1, max: 100 },
  { key: 'pregaAxilarMedia', label: 'Prega axilar média (mm)', min: 0.1, max: 100 },
  { key: 'pregaTricipital', label: 'Prega tricipital (mm)', min: 0.1, max: 100 },
  { key: 'pregaSubescapular', label: 'Prega subescapular (mm)', min: 0.1, max: 100 },
  { key: 'pregaAbdominal', label: 'Prega abdominal (mm)', min: 0.1, max: 100 },
  { key: 'pregaSuprailiaca', label: 'Prega supra-ilíaca (mm)', min: 0.1, max: 100 },
  { key: 'pregaCoxa', label: 'Prega da coxa (mm)', min: 0.1, max: 100 },
  { key: 'circunferenciaCintura', label: 'Cintura (cm)', min: 0.1, max: 300 },
  { key: 'circunferenciaQuadril', label: 'Quadril (cm)', min: 0.1, max: 300 },
  { key: 'circunferenciaBraco', label: 'Braço (cm)', min: 0.1, max: 150 }
];
export const STATUS_CONSULTA = [
  { value: 'AGUARDANDO_CONFIRMACAO', label: 'Aguardando confirmação' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'REALIZADA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' }
];
export function numero(valor: string): number | null {
  return valor.trim() === '' ? null : /^\d+(?:[.,]\d{1,2})?$/.test(valor.trim())
    ? Number(valor.trim().replace(',', '.')) : NaN;
}
export function decimal(valor: number | null | undefined): string {
  return valor == null ? '' : Number(valor.toFixed(2)).toString().replace('.', ',');
}
export class ConsultaForm {
  dataHora = '';
  status = '';
  observacao = '';
  versao: number | null = null;
  medidas = Object.fromEntries(CAMPOS_MEDIDAS.map(c => [c.key, ''])) as Record<CampoMedida, string>;
  tinhaAvaliacao = false;
  private dataHoraOriginal = '';
  private dataHoraExibida = '';
  private iniciada = false;
  private dataNascimento: string | null = null;
  private sexo: string | null = null;
  private calculoSetePregas = false;

  definirContextoAntropometrico(dataNascimento: string | null, sexo: string | null): void {
    this.dataNascimento = dataNascimento;
    this.sexo = sexo;
    this.recalcularComposicao();
  }

  preencherDaAnamnese(respostas: Record<string, unknown> | null | undefined): void {
    if (this.tinhaAvaliacao || !respostas) return;
    const peso = typeof respostas['weight'] === 'number' ? respostas['weight'] : Number(respostas['weight']);
    const altura = typeof respostas['height'] === 'number' ? respostas['height'] : Number(respostas['height']);
    if (!this.medidas.peso && Number.isFinite(peso) && peso >= 1 && peso <= 500) this.medidas.peso = decimal(peso);
    if (!this.medidas.altura && Number.isFinite(altura) && altura >= 0.3 && altura <= 2.7) this.medidas.altura = decimal(altura * 100);
    this.recalcularComposicao();
  }

  atualizarMedida(campo: CampoMedida, valor: string): void {
    if (campo === 'massaMagraKg' || campo === 'massaGordaKg') return;
    this.medidas[campo] = valor;
    this.recalcularComposicao();
  }

  campoSomenteLeitura(campo: CampoMedida): boolean {
    return campo === 'massaMagraKg' || campo === 'massaGordaKg'
      || (campo === 'percentualGordura' && this.calculoSetePregas);
  }

  get metodoComposicao(): string {
    return this.calculoSetePregas ? 'Jackson-Pollock (7 pregas) + equação de Siri' : '';
  }

  carregar(consulta: Consulta): void {
    this.dataHora = consulta.dataHora.slice(0, 16);
    this.dataHoraExibida = this.dataHora;
    this.dataHoraOriginal = consulta.dataHora;
    this.status = consulta.status;
    this.observacao = consulta.observacao || '';
    this.versao = consulta.versao;
    this.iniciada = !!consulta.iniciadaEm;
    this.tinhaAvaliacao = !!consulta.avaliacao;
    for (const c of CAMPOS_MEDIDAS) {
      const value = consulta.avaliacao?.[c.key];
      this.medidas[c.key] = decimal(value == null ? null : c.key === 'altura' ? value * 100 : value);
    }
    this.calculoSetePregas = consulta.avaliacao?.metodoPercentualGordura?.startsWith('Jackson-Pollock') ?? false;
    this.recalcularComposicao();
  }
  get exigeMedidas(): boolean {
    return this.status === 'REALIZADA' || this.tinhaAvaliacao || Object.values(this.medidas).some(v => !!v.trim());
  }
  get imc(): string {
    const peso = numero(this.medidas.peso), altura = numero(this.medidas.altura);
    return peso && altura && peso >= 1 && peso <= 500 && altura >= 30 && altura <= 270
      ? decimal(peso / (altura / 100) ** 2) : '';
  }

  private recalcularComposicao(): void {
    const chaves: CampoMedida[] = ['pregaPeitoral', 'pregaAxilarMedia', 'pregaTricipital',
      'pregaSubescapular', 'pregaAbdominal', 'pregaSuprailiaca', 'pregaCoxa'];
    const pregas = chaves.map(chave => numero(this.medidas[chave]));
    const peso = numero(this.medidas.peso);
    const idade = this.idadeNaConsulta();
    const sexo = (this.sexo ?? '').trim().toLocaleLowerCase('pt-BR');
    const masculino = sexo.startsWith('m');
    const feminino = sexo.startsWith('f');
    const faixaValida = idade !== null && idade >= 18 && idade <= (masculino ? 61 : feminino ? 55 : -1);
    const podeCalcular = pregas.every(valor => valor !== null && Number.isFinite(valor)) && faixaValida;
    if (podeCalcular) {
      const soma = pregas.reduce<number>((total, valor) => total + (valor ?? 0), 0);
      const densidade = masculino
        ? 1.112 - 0.00043499 * soma + 0.00000055 * soma ** 2 - 0.00028826 * idade!
        : 1.097 - 0.00046971 * soma + 0.00000056 * soma ** 2 - 0.00012828 * idade!;
      const percentual = 495 / densidade - 450;
      if (Number.isFinite(percentual) && percentual >= 0 && percentual <= 100) {
        this.medidas.percentualGordura = decimal(percentual);
        this.calculoSetePregas = true;
      }
    } else if (this.calculoSetePregas) {
      this.medidas.percentualGordura = '';
      this.calculoSetePregas = false;
    }
    const gordura = numero(this.medidas.percentualGordura);
    if (peso !== null && gordura !== null && Number.isFinite(peso) && Number.isFinite(gordura)) {
      const massaGorda = peso * gordura / 100;
      this.medidas.massaGordaKg = decimal(massaGorda);
      this.medidas.massaMagraKg = decimal(peso - massaGorda);
    } else {
      this.medidas.massaGordaKg = '';
      this.medidas.massaMagraKg = '';
    }
  }

  private idadeNaConsulta(): number | null {
    if (!this.dataNascimento || !/^\d{4}-\d{2}-\d{2}/.test(this.dataNascimento)
      || !/^\d{4}-\d{2}-\d{2}/.test(this.dataHora)) return null;
    const nascimento = this.dataNascimento.slice(0, 10).split('-').map(Number);
    const consulta = this.dataHora.slice(0, 10).split('-').map(Number);
    let idade = consulta[0] - nascimento[0];
    if (consulta[1] < nascimento[1] || (consulta[1] === nascimento[1] && consulta[2] < nascimento[2])) idade--;
    return idade;
  }
  validar(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(this.dataHora)
      || Number.isNaN(Date.parse(this.dataHora)) || this.dataHora < '1900' || this.dataHora >= '2101') {
      errors['dataHora'] = 'Informe uma data e hora válidas, entre 1900 e 2100.';
    } else if (this.status === 'REALIZADA' && !this.iniciada) {
      // Datas de consultas representam o horario civil da clinica, em Sao Paulo.
      const agora = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .format(new Date()).replace(' ', 'T');
      if (this.dataHora > agora) errors['dataHora'] = 'Uma consulta futura não pode ser concluída.';
    }
    if (!STATUS_CONSULTA.some(s => s.value === this.status)) errors['status'] = 'Selecione o status.';
    for (const c of CAMPOS_MEDIDAS) {
      const value = numero(this.medidas[c.key]);
      if (value === null) {
        if (this.exigeMedidas && (c.key === 'peso' || c.key === 'altura')) errors[c.key] = 'Este campo é obrigatório.';
      } else if (!Number.isFinite(value) || value < c.min || value > c.max || (c.inteiro && !Number.isInteger(value))) {
        errors[c.key] = `Informe ${c.inteiro ? 'um valor inteiro' : 'um valor com até 2 casas decimais'} entre ${decimal(c.min)} e ${decimal(c.max)}.`;
      }
    }
    const pregasSete: CampoMedida[] = ['pregaPeitoral', 'pregaAxilarMedia', 'pregaTricipital',
      'pregaSubescapular', 'pregaAbdominal', 'pregaSuprailiaca', 'pregaCoxa'];
    const pregasExclusivas: CampoMedida[] = ['pregaPeitoral', 'pregaAxilarMedia', 'pregaAbdominal', 'pregaCoxa'];
    const informouProtocolo = pregasExclusivas.some(chave => this.medidas[chave].trim() !== '');
    if (informouProtocolo) {
      const faltantes = pregasSete.filter(chave => this.medidas[chave].trim() === '');
      for (const chave of faltantes) errors[chave] = 'Preencha as sete pregas do protocolo.';
      if (!faltantes.length && !this.calculoSetePregas) {
        errors['pregaPeitoral'] = 'Não foi possível aplicar o método. Verifique sexo, data de nascimento e faixa etária do paciente.';
      }
    }
    if (this.observacao.length > 5000) errors['observacao'] = 'Máximo de 5.000 caracteres.';
    return errors;
  }
  payload(): ConsultaPayload {
    const avaliacao = this.exigeMedidas ? Object.fromEntries(CAMPOS_MEDIDAS.map(c => {
      const value = numero(this.medidas[c.key]);
      return [c.key, value !== null && c.key === 'altura' ? value / 100 : value];
    })) as unknown as MedidasConsulta : null;
    return { dataHora: this.dataHora === this.dataHoraExibida ? this.dataHoraOriginal : this.dataHora, status: this.status, observacao: this.observacao.trim(), avaliacao, versao: this.versao };
  }
  assinatura(): string { return JSON.stringify([this.dataHora, this.status, this.observacao, this.medidas]); }
}
