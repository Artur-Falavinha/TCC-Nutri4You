export interface Nutrientes {
  kcal: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number | null;
}

export interface MetasNutricionais {
  kcal: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
}

export interface Alimento {
  id: number;
  codigoTaco: number | null;
  nome: string;
  categoria: string;
  kcal100g: number | null;
  proteina100g: number | null;
  carboidratos100g: number | null;
  gordura100g: number | null;
  fibra100g: number | null;
  fonte: string;
  versaoFonte: string;
  observacaoFonte: string | null;
  disponivelParaPrescricao: boolean;
}

export interface PaginaAlimentos {
  alimentos: Alimento[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface ItemRefeicao {
  alimento: Alimento;
  quantidadeGramas: number;
  nutrientes: Nutrientes;
  substitutos: SubstitutoRefeicao[];
}

export interface SubstitutoRefeicao {
  alimento: Alimento;
  quantidadeGramas: number;
  nutrientes: Nutrientes;
}

export interface Refeicao {
  id: number;
  nome: string;
  horario: string;
  itens: ItemRefeicao[];
  totais: Nutrientes;
}

export type PlanoStatus = 'RASCUNHO' | 'PUBLICADO' | 'SUBSTITUIDO';

export interface Plano {
  id: number;
  pacienteId: number;
  nutricionistaId: number;
  nutricionistaNome: string;
  titulo: string;
  orientacoes: string | null;
  status: PlanoStatus;
  versao: number;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  publicadoEm: string | null;
  metas: MetasNutricionais | null;
  totais: Nutrientes;
  refeicoes: Refeicao[];
}

export interface PlanoRequest {
  titulo: string;
  orientacoes: string | null;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  metas: MetasNutricionais | null;
  versao?: number;
  refeicoes: {
    nome: string;
    horario: string;
    itens: {
      alimentoId: number;
      quantidadeGramas: number;
      substitutos?: { alimentoId: number; quantidadeGramas: number }[];
    }[];
  }[];
}

export interface RefeicaoEdicao {
  chave: number;
  nome: string;
  horario: string;
  itens: ItemEdicao[];
}

export type CampoNumericoEdicao = string | number | null;

export interface ItemEdicao {
  chave: number;
  alimento: Alimento | null;
  quantidadeGramas: CampoNumericoEdicao;
  substitutos: SubstitutoEdicao[];
}

export interface SubstitutoEdicao {
  chave: number;
  alimento: Alimento | null;
  quantidadeGramas: CampoNumericoEdicao;
}

export interface MetasEdicao {
  kcal: CampoNumericoEdicao;
  proteinas: CampoNumericoEdicao;
  carboidratos: CampoNumericoEdicao;
  gorduras: CampoNumericoEdicao;
}

export interface ItemListaCompras {
  alimentoId: number;
  nome: string;
  categoria: string | null;
  quantidadeGramas: number;
  comprado: boolean;
}

export interface ListaCompras {
  planoId: number;
  planoTitulo: string;
  dias: number;
  totalItens: number;
  itensComprados: number;
  itensPendentes: number;
  itens: ItemListaCompras[];
}

export interface PlanoEdicao {
  titulo: string;
  orientacoes: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  metas: MetasEdicao;
  refeicoes: RefeicaoEdicao[];
}
