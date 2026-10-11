import { Consulta, ConsultaPayload, MedidasConsulta } from './consultas.service';

export type CampoMedida = keyof MedidasConsulta;
export interface CampoConsulta {
  key: CampoMedida; label: string; min: number; max: number; inteiro?: boolean;
}
export const CAMPOS_MEDIDAS: CampoConsulta[] = [
  { key: 'peso', label: 'Peso (kg)', min: 1, max: 500 },
  { key: 'altura', label: 'Altura (cm)', min: 30, max: 270, inteiro: true },
  { key: 'percentualGordura', label: 'Gordura corporal (%)', min: 0, max: 100 },
  { key: 'massaMuscularKg', label: 'Massa muscular (kg)', min: 0, max: 300 },
  { key: 'pregaBicipital', label: 'Prega bicipital (mm)', min: 0.1, max: 100 },
  { key: 'pregaTricipital', label: 'Prega tricipital (mm)', min: 0.1, max: 100 },
  { key: 'pregaSubescapular', label: 'Prega subescapular (mm)', min: 0.1, max: 100 },
  { key: 'pregaSuprailiaca', label: 'Prega supra-ilíaca (mm)', min: 0.1, max: 100 },
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

  carregar(consulta: Consulta): void {
    this.dataHora = consulta.dataHora.slice(0, 16);
    this.status = consulta.status;
    this.observacao = consulta.observacao || '';
    this.versao = consulta.versao;
    this.tinhaAvaliacao = !!consulta.avaliacao;
    for (const c of CAMPOS_MEDIDAS) {
      const value = consulta.avaliacao?.[c.key];
      this.medidas[c.key] = decimal(value == null ? null : c.key === 'altura' ? value * 100 : value);
    }
  }
  get exigeMedidas(): boolean {
    return this.status === 'REALIZADA' || this.tinhaAvaliacao || Object.values(this.medidas).some(v => !!v.trim());
  }
  get imc(): string {
    const peso = numero(this.medidas.peso), altura = numero(this.medidas.altura);
    return peso && altura && peso >= 1 && peso <= 500 && altura >= 30 && altura <= 270
      ? decimal(peso / (altura / 100) ** 2) : '';
  }
  validar(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(this.dataHora)
      || Number.isNaN(Date.parse(this.dataHora)) || this.dataHora < '1900' || this.dataHora >= '2101') {
      errors['dataHora'] = 'Informe uma data e hora válidas, entre 1900 e 2100.';
    } else if (this.status === 'REALIZADA') {
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
    if (this.observacao.length > 5000) errors['observacao'] = 'Máximo de 5.000 caracteres.';
    return errors;
  }
  payload(): ConsultaPayload {
    const avaliacao = this.exigeMedidas ? Object.fromEntries(CAMPOS_MEDIDAS.map(c => {
      const value = numero(this.medidas[c.key]);
      return [c.key, value !== null && c.key === 'altura' ? value / 100 : value];
    })) as unknown as MedidasConsulta : null;
    return { dataHora: this.dataHora, status: this.status, observacao: this.observacao.trim(), avaliacao, versao: this.versao };
  }
  assinatura(): string { return JSON.stringify([this.dataHora, this.status, this.observacao, this.medidas]); }
}
