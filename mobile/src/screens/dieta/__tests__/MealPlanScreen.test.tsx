import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { getActiveMealPlan } from '../../../features/dieta/dieta.service';
import { Food, MealPlan, MealPlanItem, Nutrients } from '../../../features/dieta/dieta.models';
import { MealPlanScreen } from '../MealPlanScreen';

jest.mock('../../../features/dieta/dieta.service', () => ({
  getActiveMealPlan: jest.fn()
}));

jest.mock('../../../core/auth/auth.service', () => ({ logout: jest.fn() }));
jest.mock('../../../components/layout/AppHeader', () => ({ AppHeader: () => null }));
jest.mock('../../../components/navigation/SideMenu', () => ({ SideMenu: () => null }));

function nutrients(fibras: number | null): Nutrients {
  return { kcal: 180, proteinas: 8, carboidratos: 25, gorduras: 4, fibras };
}

function food(id: number, nome: string): Food {
  return {
    id,
    codigoTaco: null,
    nome,
    categoria: 'Cereais',
    kcal100g: 360,
    proteina100g: 13,
    carboidratos100g: 60,
    gordura100g: 7,
    fibra100g: 10,
    fonte: 'TACO',
    versaoFonte: '4ª edição',
    observacaoFonte: null,
    disponivelParaPrescricao: true
  };
}

function mealPlan(): MealPlan {
  const item: MealPlanItem = {
    alimento: food(1, 'Aveia'),
    quantidadeGramas: 40,
    nutrientes: { kcal: 150, proteinas: 5, carboidratos: 24, gorduras: 3, fibras: 4.2 },
    substitutos: [
      {
        alimento: food(2, 'Granola'),
        quantidadeGramas: 75,
        nutrientes: { kcal: 85, proteinas: 3, carboidratos: 14, gorduras: 2, fibras: 1.1 }
      }
    ]
  };

  return {
    id: 12,
    pacienteId: 3,
    nutricionistaId: 4,
    nutricionistaNome: 'Nutricionista',
    titulo: 'Plano diário',
    orientacoes: null,
    status: 'PUBLICADO',
    versao: 1,
    vigenciaInicio: null,
    vigenciaFim: null,
    publicadoEm: null,
    metas: nutrients(30),
    totais: nutrients(28),
    refeicoes: [
      {
        id: 6,
        nome: 'Café da manhã',
        horario: '08:00',
        itens: [item],
        totais: { kcal: 300, proteinas: 10, carboidratos: 40, gorduras: 5, fibras: 7.5 }
      }
    ]
  };
}

async function renderPlan(plan: MealPlan): Promise<renderer.ReactTestRenderer> {
  (getActiveMealPlan as jest.Mock).mockResolvedValueOnce(plan);
  const navigation = { navigate: jest.fn(), dispatch: jest.fn() };
  let tree!: renderer.ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(
      <MealPlanScreen
        navigation={navigation as never}
        route={{ key: 'Dieta', name: 'Dieta', params: undefined } as never}
      />
    );
    await Promise.resolve();
  });

  return tree;
}

function renderedText(tree: renderer.ReactTestRenderer): string {
  return tree.root
    .findAllByType(Text)
    .map((node) => {
      const children = node.props.children;
      return Array.isArray(children) ? children.join('') : String(children ?? '');
    })
    .join('\n');
}

describe('MealPlanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe fibras e substitutos informativos sem alterar o plano prescrito', async () => {
    const plan = mealPlan();
    const originalPlan = JSON.stringify(plan);
    const tree = await renderPlan(plan);
    const output = renderedText(tree);

    expect(output).toContain('Fibras');
    expect(output).toContain('30,00 g');
    expect(output).toContain('28,00 g');
    expect(output).toContain('7,50 g');
    expect(output).toContain('Aveia');
    expect(output).toContain('4,20 g');
    expect(output).toContain('Substituto informativo');
    expect(output).toContain('Granola');
    expect(output).toContain('75 g');
    expect(output).toContain('Energia: 85,00 kcal');
    expect(output).toContain('Fibras: 1,10 g');
    expect(JSON.stringify(plan)).toBe(originalPlan);

    act(() => tree.unmount());
  });

  it('aceita planos antigos sem a lista de substitutos', async () => {
    const plan = mealPlan();
    const meal = plan.refeicoes[0];
    const item = meal.itens[0];
    const itemWithoutSubstitutes = {
      alimento: item.alimento,
      quantidadeGramas: item.quantidadeGramas,
      nutrientes: item.nutrientes
    } as unknown as MealPlanItem;
    const legacyPlan = {
      ...plan,
      refeicoes: [{ ...meal, itens: [itemWithoutSubstitutes] }]
    };
    const tree = await renderPlan(legacyPlan);
    const output = renderedText(tree);

    expect(output).toContain('Aveia');
    expect(output).not.toContain('Substituto informativo');

    act(() => tree.unmount());
  });
});
