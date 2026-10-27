export interface Nutrientes { kcal: number | null; proteina: number | null; carboidratos: number | null; gordura: number | null }
export interface Alimento extends Nutrientes { id: number; nome: string; categoria: string | null }
export interface ItemRefeicao extends Nutrientes { alimentoId: number; nome: string; quantidadeGramas: number }
export interface Refeicao extends Nutrientes { id: number; nome: string; horario: string; diaSemana: number; itens: ItemRefeicao[] }
export interface Plano {
  id: number; status: string; versao: number; idConsulta: number | null;
  vigenciaInicio: string | null; vigenciaFim: string | null;
  metaKcal: number | null; metaProteina: number | null; metaCarboidratos: number | null; metaGordura: number | null;
  refeicoes: Refeicao[];
}
export function totaisDoDia(refeicoes: Refeicao[], dia: number): Nutrientes {
  const doDia = refeicoes.filter(r => r.diaSemana === dia);
  const soma = (key: keyof Nutrientes) => doDia.some(r => r[key] === null)
    ? null : Math.round(doDia.reduce((total, r) => total + (r[key] ?? 0), 0) * 100) / 100;
  return { kcal: soma('kcal'), proteina: soma('proteina'), carboidratos: soma('carboidratos'), gordura: soma('gordura') };
}
export function percentual(valor: number | null, meta: number | null): number | null {
  return valor === null || meta === null || meta <= 0 ? null : Math.round(valor / meta * 100);
}
