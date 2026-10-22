import { apiClient } from '../api/api-client';

export interface AvaliacaoHistorico {
  id: number;
  dataAvaliacao: string;
  peso: number;
  altura: number;
  imc: number;
  razaoCinturaQuadril: number | null;
  percentualGordura: number | null;
  massaMuscularKg: number | null;
  pregaBicipital: number | null;
  pregaTricipital: number | null;
  pregaSubescapular: number | null;
  pregaSuprailiaca: number | null;
  circunferenciaCintura: number | null;
  circunferenciaQuadril: number | null;
  circunferenciaBraco: number | null;
}

export interface ConsultaResumo {
  id: number;
  pacienteNome: string;
  dataHora: string;
}

export interface EvolucaoHistorico {
  consultas: ConsultaResumo[];
  avaliacoes: AvaliacaoHistorico[];
}

export interface ConsumoProgresso {
  data: string;
  caloriasConsumidas: number;
  metaCalorias?: number | null;
  proteinas: number;
  metaProteinas?: number | null;
  carboidratos: number;
  metaCarboidratos?: number | null;
  gorduras: number;
  metaGorduras?: number | null;
}

export interface ProximaConsultaResumo {
  id: number;
  nutricionistaNome: string;
  dataHora: string;
  status: string;
}

export interface DietaAtivaResumo {
  idPlano: number;
  metaKcal: number | null;
  metaProteina: number | null;
  metaCarboidratos: number | null;
  metaGordura: number | null;
  nutricionistaNome: string;
}

export interface DashboardPacienteDados {
  nomePaciente: string;
  consumo: ConsumoProgresso | null;
  proximaConsulta: ProximaConsultaResumo | null;
  dietaAtiva: DietaAtivaResumo | null;
}

export interface VariacaoCalculada {
  valor: number;
  percentual: number;
  texto: string;
  direcao: 'queda' | 'alta' | 'estavel';
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_EXTENSO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

function extrairData(dataIso: string): { dia: number; mes: number } | null {
  if (!dataIso) return null;

  const isoLocal = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataIso);
  if (isoLocal) {
    const ano = Number(isoLocal[1]);
    const mes = Number(isoLocal[2]);
    const dia = Number(isoLocal[3]);
    const validacao = new Date(Date.UTC(ano, mes - 1, dia));
    if (
      validacao.getUTCFullYear() === ano &&
      validacao.getUTCMonth() === mes - 1 &&
      validacao.getUTCDate() === dia
    ) {
      return { dia, mes };
    }
    return null;
  }

  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return null;
  return { dia: data.getDate(), mes: data.getMonth() + 1 };
}

export function formatarDataMes(dataIso: string): string {
  const data = extrairData(dataIso);
  return data ? MESES[data.mes - 1] || '' : '';
}

export function formatarDataDiaMes(dataIso: string): string {
  const data = extrairData(dataIso);
  if (!data) return '';
  const dia = String(data.dia).padStart(2, '0');
  const mes = String(data.mes).padStart(2, '0');
  return `${dia}/${mes}`;
}

export function extrairPrimeiroNome(nomeCompleto?: string | null): string {
  const limpo = (nomeCompleto ?? '').trim();
  if (!limpo) {
    return 'Paciente';
  }
  return limpo.split(/\s+/)[0] || 'Paciente';
}

export function formatarNumeroMilhar(valor?: number | null): string {
  if (valor == null || isNaN(valor)) {
    return '0';
  }
  const arredondado = Math.round(valor);
  return arredondado.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function calcularPercentualMeta(consumido?: number | null, meta?: number | null): number {
  if (consumido == null || meta == null || isNaN(consumido) || isNaN(meta) || meta <= 0) {
    return 0;
  }
  return Math.max(0, Math.round((consumido / meta) * 100));
}

export function formatarDataHoraConsulta(dataIso?: string | null): string {
  if (!dataIso) {
    return '';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(dataIso);
  if (match) {
    const dia = Number(match[3]);
    const mesIdx = Number(match[2]) - 1;
    const mesNome = MESES_EXTENSO[mesIdx] ?? '';
    const hora = match[4];
    const minuto = match[5];
    if (mesNome) {
      return `${dia} de ${mesNome}, às ${hora}:${minuto}`;
    }
  }
  const d = new Date(dataIso);
  if (isNaN(d.getTime())) {
    return '';
  }
  const dia = d.getDate();
  const mesNome = MESES_EXTENSO[d.getMonth()] || '';
  const hora = String(d.getHours()).padStart(2, '0');
  const minuto = String(d.getMinutes()).padStart(2, '0');
  return `${dia} de ${mesNome}, às ${hora}:${minuto}`;
}

export function calcularVariacao(
  atual?: number | null,
  anterior?: number | null,
  unidade = '',
  decimais = 1
): VariacaoCalculada | null {
  if (atual == null || anterior == null || isNaN(atual) || isNaN(anterior)) {
    return null;
  }
  const diff = atual - anterior;
  const percentual = anterior !== 0 ? (diff / anterior) * 100 : 0;
  const absDiff = Math.abs(diff);

  if (Math.abs(diff) < 0.01) {
    return {
      valor: 0,
      percentual: 0,
      texto: `0 ${unidade}`.trim(),
      direcao: 'estavel'
    };
  }

  const sinal = diff > 0 ? '+' : '-';
  const casasDecimais = Math.max(0, Math.min(4, Math.trunc(decimais)));
  const texto = `${sinal}${absDiff.toFixed(casasDecimais)} ${unidade}`.trim();
  return {
    valor: Number(diff.toFixed(2)),
    percentual: Number(percentual.toFixed(1)),
    texto,
    direcao: diff < 0 ? 'queda' : 'alta'
  };
}

export async function carregarEvolucao(): Promise<EvolucaoHistorico> {
  return apiClient.get<EvolucaoHistorico>('/usuarios/me/historico');
}

export async function carregarMedidas(): Promise<AvaliacaoHistorico[]> {
  return apiClient.get<AvaliacaoHistorico[]>('/usuarios/me/medidas');
}

export async function carregarConsumoProgresso(): Promise<ConsumoProgresso | null> {
  return apiClient.get<ConsumoProgresso | null>('/usuarios/me/consumo-diario/progresso');
}

export async function carregarDashboardPaciente(): Promise<DashboardPacienteDados> {
  return apiClient.get<DashboardPacienteDados>('/usuarios/me/dashboard');
}

