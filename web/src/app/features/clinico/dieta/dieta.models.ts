export const DIAS_SEMANA = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export interface AlimentoTaco {
  id: number;
  numeroTaco: number | null;
  nome: string;
  categoria: string | null;
  kcal100g: number;
  proteina100g: number;
  carboidratos100g: number;
  gordura100g: number;
  fibra100g: number;
}

export interface AlimentosPaginados {
  itens: AlimentoTaco[];
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
}

export interface ItemSubstitutoResponse {
  id: number;
  alimentoId: number;
  numeroTaco: number | null;
  alimentoNome: string;
  categoria: string | null;
  quantidadeGramas: number;
  kcal100g: number;
  proteina100g: number;
  carboidratos100g: number;
  gordura100g: number;
  kcalCalculado: number;
  proteinaCalculada: number;
  carboidratosCalculados: number;
  gorduraCalculada: number;
  ordem: number;
}

export interface ItemRefeicaoResponse {
  id: number;
  alimentoId: number;
  numeroTaco: number | null;
  alimentoNome: string;
  categoria: string | null;
  quantidadeGramas: number;
  kcal100g: number;
  proteina100g: number;
  carboidratos100g: number;
  gordura100g: number;
  fibra100g: number;
  kcalCalculado: number;
  proteinaCalculada: number;
  carboidratosCalculados: number;
  gorduraCalculada: number;
  ordem: number;
  substitutos: ItemSubstitutoResponse[];
}

export interface RefeicaoResponse {
  id: number;
  nome: string;
  horario: string;
  diaSemana: string;
  descricao: string | null;
  ordem: number;
  totalKcal: number;
  totalProteina: number;
  totalCarboidratos: number;
  totalGordura: number;
  itens: ItemRefeicaoResponse[];
}

export interface PlanoAlimentarResponse {
  id: number;
  consultaId: number | null;
  pacienteId: number;
  nutricionistaId: number;
  nutricionistaNome: string;
  titulo: string;
  observacoes: string | null;
  status: 'RASCUNHO' | 'PUBLICADO' | 'SUBSTITUIDO' | string;
  vigente: boolean;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  metaCalorias: number;
  metaCarboidratos: number;
  metaGordura: number;
  metaProteina: number;
  criadoEm: string;
  publicadoEm: string | null;
  versao: number;
  refeicoes: RefeicaoResponse[];
}

export interface SubstitutoPrescricaoPayload {
  id?: number | null;
  alimentoId: number | null;
  nomeAlimento?: string;
  quantidadeGramas: number | null;
  ordem: number;
}

export interface ItemPrescricaoPayload {
  id?: number | null;
  alimentoId: number | null;
  nomeAlimento?: string;
  quantidadeGramas: number | null;
  ordem: number;
  substitutos: SubstitutoPrescricaoPayload[];
}

export interface RefeicaoPrescricaoPayload {
  id?: number | null;
  nome: string;
  horario: string;
  diaSemana: string;
  descricao: string | null;
  ordem: number;
  itens: ItemPrescricaoPayload[];
}

export interface PlanoAlimentarPayload {
  pacienteId?: number;
  consultaId?: number | null;
  titulo: string;
  observacoes: string | null;
  status?: 'RASCUNHO' | 'PUBLICADO';
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  versao?: number | null;
  refeicoes: RefeicaoPrescricaoPayload[];
}

export interface ItemListaCompras {
  id: number;
  alimentoId: number | null;
  nomeItem: string;
  categoria: string | null;
  quantidade: string;
  quantidadeGramas: number;
  comprado: boolean;
}

export interface ListaComprasResponse {
  id: number;
  planoId: number;
  dataGeracao: string;
  itens: ItemListaCompras[];
}

export interface NutrientesCalculados {
  kcal: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
  fibra: number;
}

export interface SubstitutoEditorItem {
  uid: string;
  id: number | null;
  alimentoId: number | null;
  alimentoNome: string;
  termoBusca: string;
  categoria: string | null;
  quantidadeGramas: string;
  kcal100g: number;
  proteina100g: number;
  carboidratos100g: number;
  gordura100g: number;
  fibra100g: number;
  abertoDropdown: boolean;
}

export interface AlimentoEditorItem {
  uid: string;
  id: number | null;
  alimentoId: number | null;
  alimentoNome: string;
  termoBusca: string;
  categoria: string | null;
  quantidadeGramas: string;
  kcal100g: number;
  proteina100g: number;
  carboidratos100g: number;
  gordura100g: number;
  fibra100g: number;
  abertoDropdown: boolean;
  substitutos: SubstitutoEditorItem[];
}

export interface RefeicaoEditorItem {
  uid: string;
  id: number | null;
  diaSemana: DiaSemana;
  nome: string;
  horario: string;
  descricao: string;
  itens: AlimentoEditorItem[];
}

export function arredondar2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function parseGramas(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  const texto = String(valor).trim().replace(',', '.');
  if (!texto) return 0;
  const n = Number(texto);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function calcularNutrientesItem(item: {
  quantidadeGramas: string | number;
  kcal100g: number;
  proteina100g: number;
  carboidratos100g: number;
  gordura100g: number;
  fibra100g?: number;
}): NutrientesCalculados {
  const g = parseGramas(item.quantidadeGramas);
  if (g <= 0) {
    return { kcal: 0, proteina: 0, carboidratos: 0, gordura: 0, fibra: 0 };
  }
  return {
    kcal: arredondar2(((item.kcal100g || 0) * g) / 100),
    proteina: arredondar2(((item.proteina100g || 0) * g) / 100),
    carboidratos: arredondar2(((item.carboidratos100g || 0) * g) / 100),
    gordura: arredondar2(((item.gordura100g || 0) * g) / 100),
    fibra: arredondar2(((item.fibra100g || 0) * g) / 100)
  };
}

