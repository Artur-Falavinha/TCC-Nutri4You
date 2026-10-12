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
  metaCalorias?: number;
  proteinas: number;
  metaProteinas?: number;
  carboidratos: number;
  metaCarboidratos?: number;
  gorduras: number;
  metaGorduras?: number;
}

export interface VariacaoCalculada {
  valor: number;
  percentual: number;
  texto: string;
  direcao: 'queda' | 'alta' | 'estavel';
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function formatarDataMes(dataIso: string): string {
  if (!dataIso) return '';
  const d = new Date(dataIso);
  if (isNaN(d.getTime())) return '';
  return MESES[d.getMonth()] || '';
}

export function formatarDataDiaMes(dataIso: string): string {
  if (!dataIso) return '';
  const d = new Date(dataIso);
  if (isNaN(d.getTime())) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
}

export function calcularVariacao(atual?: number | null, anterior?: number | null, unidade = ''): VariacaoCalculada | null {
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
  const texto = `${sinal}${absDiff.toFixed(1)} ${unidade}`.trim();
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
  try {
    return await apiClient.get<ConsumoProgresso>('/usuarios/me/consumo-diario/progresso');
  } catch {
    return null;
  }
}

