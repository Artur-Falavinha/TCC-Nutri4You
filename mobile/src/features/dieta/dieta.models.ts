export interface Nutrients {
  kcal: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
}

export interface Food {
  id: number;
  codigoTaco: number | null;
  nome: string;
  categoria: string;
  kcal100g: number | null;
  proteina100g: number | null;
  carboidratos100g: number | null;
  gordura100g: number | null;
  fonte: string;
  versaoFonte: string;
  observacaoFonte: string | null;
  disponivelParaPrescricao: boolean;
}

export interface MealPlanItem {
  alimento: Food;
  quantidadeGramas: number;
  nutrientes: Nutrients;
}

export interface Meal {
  id: number;
  nome: string;
  horario: string;
  itens: MealPlanItem[];
  totais: Nutrients;
}

export interface MealPlan {
  id: number;
  pacienteId: number;
  nutricionistaId: number;
  nutricionistaNome: string;
  titulo: string;
  orientacoes: string | null;
  status: 'RASCUNHO' | 'PUBLICADO' | 'SUBSTITUIDO';
  versao: number;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  publicadoEm: string | null;
  metas: Nutrients | null;
  totais: Nutrients;
  refeicoes: Meal[];
}

export interface ShoppingListItem {
  alimentoId: number;
  nome: string;
  categoria: string;
  quantidadeGramas: number;
  comprado: boolean;
}

export interface ShoppingList {
  planoId: number;
  planoTitulo: string;
  dias: number;
  totalItens: number;
  itensComprados: number;
  itensPendentes: number;
  itens: ShoppingListItem[];
}

export interface ShoppingItemUpdate {
  planoId: number;
  dias: number;
  comprado: boolean;
}
