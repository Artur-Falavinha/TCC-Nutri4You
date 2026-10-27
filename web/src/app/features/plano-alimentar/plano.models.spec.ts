import { Refeicao, percentual, totaisDoDia } from './plano.models';

describe('Planejamento diário', () => {
  const refeicao = (diaSemana: number, kcal: number | null): Refeicao => ({
    id: diaSemana, diaSemana, kcal, proteina: 10, carboidratos: 20, gordura: null,
    nome: 'Almoço', horario: '12:00', itens: []
  });
  it('isola os totais por dia e não inventa nutrientes ausentes', () => {
    expect(totaisDoDia([refeicao(1, 200), refeicao(2, 900)], 1)).toEqual({ kcal: 200, proteina: 10, carboidratos: 20, gordura: null });
    expect(totaisDoDia([], 3).kcal).toBe(0);
  });
  it('mantém o percentual acima da meta e evita divisão por zero', () => {
    expect(percentual(2500, 2000)).toBe(125);
    expect(percentual(100, 0)).toBeNull();
    expect(percentual(null, 100)).toBeNull();
    expect(percentual(0, 100)).toBe(0);
  });
});
