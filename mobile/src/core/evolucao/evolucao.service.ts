import { apiClient } from '../api/api-client';
import { formatarDataCivil } from '../utils/date-mask.util';

export { formatarDataHoraCivil as formatarDataHoraConsulta } from '../utils/date-mask.util';

export interface AvaliacaoHistorico {
  id: number;
  dataAvaliacao: string;
  peso: number;
  altura: number;
  imc: number;
  razaoCinturaQuadril: number | null;
  percentualGordura: number | null;
  massaMagraKg?: number | null;
  massaGordaKg?: number | null;
  massaMuscularKg: number | null;
  pregaBicipital: number | null;
  pregaPeitoral?: number | null;
  pregaAxilarMedia?: number | null;
  pregaTricipital: number | null;
  pregaSubescapular: number | null;
  pregaAbdominal?: number | null;
  pregaSuprailiaca: number | null;
  pregaCoxa?: number | null;
  somaSetePregas?: number | null;
  metodoPercentualGordura?: string | null;
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

export function formatarDataMes(dataIso: string): string {
  const mes = Number(formatarDataCivil(dataIso).slice(3, 5));
  return MESES[mes - 1] ?? '';
}

export function formatarDataDiaMes(dataIso: string): string {
  return formatarDataCivil(dataIso).slice(0, 5);
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

