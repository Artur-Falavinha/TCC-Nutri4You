import { dataIsoValida, horarioCivilIso } from '../../../shared/utils/data-br.util';
import { Consulta, ConsultaPayload, MedidasConsulta, ModoPercentualGordura } from './consultas.service';

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
  { key: 'massaMuscularKg', label: 'Massa muscular (kg)', min: 0, max: 500 },
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
const SETE_PREGAS: CampoMedida[] = ['pregaPeitoral', 'pregaAxilarMedia', 'pregaTricipital',
  'pregaSubescapular', 'pregaAbdominal', 'pregaSuprailiaca', 'pregaCoxa'];
const CALCULADO = 'Calculado automaticamente.';
const MEDIDAS_INVALIDAS = 'Não foi possível calcular com as medidas informadas. Confira os valores.';

export const STATUS_CONSULTA = [
  { value: 'AGUARDANDO_CONFIRMACAO', label: 'Aguardando confirmação' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'REALIZADA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'RECUSADA', label: 'Recusada' }
];
export function numero(valor: string): number | null {
  return valor.trim() === '' ? null : /^\d+(?:[.,]\d{1,2})?$/.test(valor.trim())
    ? Number(valor.trim().replace(',', '.')) : NaN;
}
export function decimal(valor: number | null | undefined): string {
  return valor == null ? '' : Number(valor.toFixed(2)).toString().replace('.', ',');
}
export class ConsultaForm {
  private dataHoraAtual = '';
  modoPercentualGordura: ModoPercentualGordura = 'MANUAL';
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
  get dataHora(): string {
    return this.dataHoraAtual;
  }

  set dataHora(valor: string) {
    if (this.dataHoraAtual === valor) return;
    this.dataHoraAtual = valor;
    if (this.automatico) this.recalcularGordura();
  }

  private get automatico(): boolean {
    return this.modoPercentualGordura === 'AUTOMATICO';
  }

  definirContextoAntropometrico(dataNascimento: string | null, sexo: string | null): void {
    if (this.dataNascimento === dataNascimento && this.sexo === sexo) return;
    this.dataNascimento = dataNascimento;
    this.sexo = sexo;
    if (this.automatico) this.recalcularGordura();
  }

  atualizarModoPercentualGordura(modo: ModoPercentualGordura): void {
    if (this.modoPercentualGordura === modo) return;
    this.modoPercentualGordura = modo;
    this.medidas.percentualGordura = '';
    this.recalcularGordura();
  }

  preencherDaAnamnese(respostas: Record<string, unknown> | null | undefined): void {
    if (this.tinhaAvaliacao || !respostas) return;
    const peso = typeof respostas['weight'] === 'number' ? respostas['weight'] : Number(respostas['weight']);
    const altura = typeof respostas['height'] === 'number' ? respostas['height'] : Number(respostas['height']);
    if (!this.medidas.peso && Number.isFinite(peso) && peso >= 1 && peso <= 500) this.medidas.peso = decimal(peso);
    if (!this.medidas.altura && Number.isFinite(altura) && altura >= 0.3 && altura <= 2.7) this.medidas.altura = decimal(altura * 100);
    this.recalcularMassas();
  }

  atualizarMedida(campo: CampoMedida, valor: string): void {
    if (this.campoSomenteLeitura(campo)) return;
    this.medidas[campo] = valor;
    if (this.automatico && SETE_PREGAS.includes(campo)) {
      this.recalcularGordura();
    } else if (campo === 'peso' || campo === 'percentualGordura') {
      this.recalcularMassas();
    }
  }

  campoSomenteLeitura(campo: CampoMedida): boolean {
    return campo === 'massaMagraKg' || campo === 'massaGordaKg'
      || (campo === 'percentualGordura' && this.automatico);
  }

  ajudaMedida(campo: CampoMedida): string {
    if (!this.campoSomenteLeitura(campo)) return '';
    if (campo === 'percentualGordura') {
      const { motivos } = this.calcularGordura();
      if (motivos.length) {
        return [this.medidas.percentualGordura ? 'Resultado registrado.' : '', ...motivos].filter(Boolean).join(' ');
      }
    }
    if (this.medidas[campo]) return CALCULADO;
    if (!this.pesoValido(numero(this.medidas.peso))) return 'Informe um peso válido para calcular.';
    return this.automatico ? 'Aguardando o cálculo da gordura corporal.' : 'Informe um percentual de gordura válido para calcular.';
  }

  carregar(consulta: Consulta): void {
    this.dataHoraAtual = consulta.dataHora.slice(0, 16);
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
    this.modoPercentualGordura = consulta.avaliacao?.metodoPercentualGordura?.startsWith('Jackson-Pollock')
      ? 'AUTOMATICO' : 'MANUAL';
  }
  get exigeMedidas(): boolean {
    return this.status === 'REALIZADA' || this.tinhaAvaliacao || Object.values(this.medidas).some(v => !!v.trim());
  }
  get imc(): string {
    const peso = numero(this.medidas.peso), altura = numero(this.medidas.altura);
    return peso && altura && peso >= 1 && peso <= 500 && altura >= 30 && altura <= 270
      ? decimal(peso / (altura / 100) ** 2) : '';
  }

  get ajudaImc(): string {
    return this.imc ? CALCULADO : 'Informe peso e altura válidos para calcular.';
  }

  private recalcularGordura(): void {
    if (this.automatico) this.medidas.percentualGordura = this.calcularGordura().percentual;
    this.recalcularMassas();
  }

  private calcularGordura(): { percentual: string; motivos: string[] } {
    const motivos: string[] = [];
    const sexo = (this.sexo ?? '').trim().toLowerCase();
    const masculino = sexo === 'masculino' || sexo === 'm';
    const feminino = sexo === 'feminino' || sexo === 'f';
    if (!sexo || sexo === 'prefiro não informar') {
      motivos.push('Informe o sexo do paciente no cadastro para utilizar o cálculo automático.');
    } else if (!masculino && !feminino) {
      motivos.push('O cálculo automático requer sexo masculino ou feminino no cadastro.');
    }

    const dataConsulta = this.dataHora.slice(0, 10);
    const nascimento = this.dataNascimento ?? '';
    const idade = this.idadeNaConsulta(nascimento, dataConsulta);
    if (!dataIsoValida(nascimento) || (dataIsoValida(dataConsulta) && nascimento > dataConsulta)) {
      motivos.push('Informe uma data de nascimento válida no cadastro.');
    } else if (idade === null) {
      motivos.push('Informe uma data de avaliação válida.');
    } else if ((masculino || feminino) && (idade < 18 || idade > (masculino ? 61 : 55))) {
      motivos.push(masculino
        ? 'O método está disponível para pacientes do sexo masculino entre 18 e 61 anos.'
        : 'O método está disponível para pacientes do sexo feminino entre 18 e 55 anos.');
    }

    const pregas = SETE_PREGAS.map(chave => numero(this.medidas[chave]));
    if (pregas.some(valor => valor === null)) {
      motivos.push('Preencha as sete pregas para calcular automaticamente.');
    }
    if (pregas.some(valor => valor !== null && (!Number.isFinite(valor) || valor < 0.1 || valor > 100))) {
      motivos.push(MEDIDAS_INVALIDAS);
    }
    if (motivos.length || idade === null) return { percentual: '', motivos };

    const soma = pregas.reduce<number>((total, valor) => total + (valor ?? 0), 0);
    const densidade = masculino
      ? 1.112 - 0.00043499 * soma + 0.00000055 * soma ** 2 - 0.00028826 * idade
      : 1.097 - 0.00046971 * soma + 0.00000056 * soma ** 2 - 0.00012828 * idade;
    const percentual = 495 / densidade - 450;
    if (!this.percentualValido(percentual)) return { percentual: '', motivos: [MEDIDAS_INVALIDAS] };
    const arredondado = decimal(percentual);
    return this.percentualValido(numero(arredondado))
      ? { percentual: arredondado, motivos }
      : { percentual: '', motivos: [MEDIDAS_INVALIDAS] };
  }

  private recalcularMassas(): void {
    const peso = numero(this.medidas.peso);
    const gordura = numero(this.medidas.percentualGordura);
    if (!this.pesoValido(peso) || !this.percentualValido(gordura)) {
      this.medidas.massaGordaKg = '';
      this.medidas.massaMagraKg = '';
      return;
    }
    const pesoEmCentesimos = Math.round(peso * 100);
    const massaGordaEmCentesimos = Math.round(pesoEmCentesimos * Math.round(gordura * 100) / 10_000);
    this.medidas.massaGordaKg = decimal(massaGordaEmCentesimos / 100);
    this.medidas.massaMagraKg = decimal((pesoEmCentesimos - massaGordaEmCentesimos) / 100);
  }

  private pesoValido(peso: number | null): peso is number {
    return peso !== null && peso >= 1 && peso <= 500;
  }

  private percentualValido(percentual: number | null): percentual is number {
    return percentual !== null && percentual > 0 && percentual < 100;
  }

  private idadeNaConsulta(nascimento: string, consulta: string): number | null {
    if (!dataIsoValida(nascimento) || !dataIsoValida(consulta) || nascimento > consulta) return null;
    const anos = Number(consulta.slice(0, 4)) - Number(nascimento.slice(0, 4));
    return consulta.slice(5) < nascimento.slice(5) ? anos - 1 : anos;
  }
  validar(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (this.dataHora.length !== 16 || !horarioCivilIso(this.dataHora)
      || this.dataHora < '1900' || this.dataHora >= '2101') {
      errors['dataHora'] = 'Informe uma data e hora válidas, entre 1900 e 2100.';
    } else if (this.status === 'REALIZADA' && !this.iniciada) {
      // Datas de consultas representam o horario civil da clinica, em Sao Paulo.
      const agora = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .format(new Date()).replace(' ', 'T');
      if (this.dataHora > agora) errors['dataHora'] = 'Uma consulta futura não pode ser concluída.';
    }
    if (!STATUS_CONSULTA.some(s => s.value === this.status)) errors['status'] = 'Selecione o status.';
    const peso = numero(this.medidas.peso);
    for (const c of CAMPOS_MEDIDAS) {
      if (this.campoSomenteLeitura(c.key)) continue;
      const value = numero(this.medidas[c.key]);
      if (value === null) {
        if (this.status === 'REALIZADA' && (c.key === 'peso' || c.key === 'altura')) errors[c.key] = 'Este campo é obrigatório.';
      } else if (c.key === 'percentualGordura' && !this.percentualValido(value)) {
        errors[c.key] = 'Informe um percentual maior que 0 e menor que 100, com até 2 casas decimais.';
      } else if (c.key === 'massaMuscularKg' && (!(value > 0) || (this.pesoValido(peso) && value >= peso))) {
        errors[c.key] = 'A massa muscular deve ser positiva e menor que o peso corporal.';
      } else if (!Number.isFinite(value) || value < c.min || value > c.max || (c.inteiro && !Number.isInteger(value))) {
        errors[c.key] = `Informe ${c.inteiro ? 'um valor inteiro' : 'um valor com até 2 casas decimais'} entre ${decimal(c.min)} e ${decimal(c.max)}.`;
      }
    }
    if (this.observacao.length > 5000) errors['observacao'] = 'Máximo de 5.000 caracteres.';
    return errors;
  }
  payload(): ConsultaPayload {
    const medidas = Object.fromEntries(CAMPOS_MEDIDAS.map(c => {
      const value = this.campoSomenteLeitura(c.key) ? null : numero(this.medidas[c.key]);
      return [c.key, value !== null && c.key === 'altura' ? value / 100 : value];
    })) as unknown as MedidasConsulta;
    const avaliacao = this.exigeMedidas ? { ...medidas, modoPercentualGordura: this.modoPercentualGordura } : null;
    return { dataHora: this.dataHora === this.dataHoraExibida ? this.dataHoraOriginal : this.dataHora, status: this.status, observacao: this.observacao.trim(), avaliacao, versao: this.versao };
  }
  assinatura(): string { return JSON.stringify([this.dataHora, this.status, this.observacao, this.modoPercentualGordura, this.medidas]); }
}
