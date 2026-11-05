import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as RN from 'react-native';
import { ScrollView, Text } from 'react-native';

import {
  addWater,
  getActiveMealPlan,
  getHydrationProgress
} from '../../../features/dieta/dieta.service';
import { Food, MealPlan, MealPlanItem, Nutrients } from '../../../features/dieta/dieta.models';
import { MealPlanScreen } from '../MealPlanScreen';

jest.mock('../../../features/dieta/dieta.service', () => ({
  getActiveMealPlan: jest.fn(),
  getHydrationProgress: jest.fn(),
  addWater: jest.fn()
}));

jest.mock('../../../features/dieta/dieta-preferences', () => ({
  loadMealSwapPreferences: jest.fn().mockResolvedValue({}),
  saveMealSwapPreferences: jest.fn().mockResolvedValue(undefined)
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
  (getHydrationProgress as jest.Mock).mockResolvedValueOnce({
    data: '2026-11-04',
    consumidoMl: 0,
    metaMl: 2500
  });
  const navigation = { navigate: jest.fn(), dispatch: jest.fn() };
  let tree!: renderer.ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(
      <MealPlanScreen
        navigation={navigation as never}
        route={{ key: 'Dieta', name: 'Dieta', params: undefined } as never}
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
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
    (addWater as jest.Mock).mockResolvedValue({
      data: '2026-11-04',
      consumidoMl: 250,
      metaMl: 2500
    });
  });

  it('exibe fibras e substitutos informativos sem alterar o plano prescrito', async () => {
    const plan = mealPlan();
    const originalPlan = JSON.stringify(plan);
    const tree = await renderPlan(plan);
    const output = renderedText(tree);

    expect(output).toContain('Fibras');
    expect(output).toContain('30,00 g');
    expect(output).not.toContain('28,00 g');
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

  it('renderiza cards individuais por refeição, seletor de dias e barras de progresso das metas diárias', async () => {
    const plan = mealPlan();
    plan.totais = { kcal: 220, proteinas: 8, carboidratos: 25, gorduras: 4, fibras: 28 };
    const tree = await renderPlan(plan);
    const output = renderedText(tree);

    expect(tree.root.findByProps({ testID: 'meal-plan-day-selector' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'meal-card-6' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'nutrient-progress-bar-kcal' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'nutrient-progress-exceeded-kcal' })).toBeTruthy();
    expect(output).toContain('Acima da meta diária (referência)');
    expect(output).toContain('300 KCAL');
    expect(output).toContain('10G PROTEÍNA');

    const swapButton = tree.root.findByProps({ testID: 'meal-swap-button-6' });
    await act(async () => {
      swapButton.props.onPress();
    });

    expect(renderedText(tree)).toContain('Substitutos informativos');
    expect(renderedText(tree)).toContain('Fechar');

    const substituteOption = tree.root.findByProps({ testID: 'meal-swap-option-sub-6-1-2-0' });
    await act(async () => {
      substituteOption.props.onPress();
    });

    const confirmBtn = tree.root.findByProps({ testID: 'meal-swap-confirm-button' });
    await act(async () => {
      confirmBtn.props.onPress();
    });

    expect(tree.root.findByProps({ testID: 'meal-food-6-2' }).props.children).toBe('Granola');
    expect(tree.root.findAllByProps({ testID: 'meal-food-6-1' })).toHaveLength(0);

    await act(async () => {
      tree.root.findByProps({ testID: 'meal-swap-button-6' }).props.onPress();
    });
    await act(async () => {
      tree.root.findByProps({ testID: 'meal-swap-option-prescribed-6' }).props.onPress();
    });
    await act(async () => {
      tree.root.findByProps({ testID: 'meal-swap-confirm-button' }).props.onPress();
    });
    expect(tree.root.findByProps({ testID: 'meal-food-6-1' }).props.children).toBe('Aveia');

    act(() => tree.unmount());
  });

  it('filtra refeições pelo dia selecionado e persiste hidratação retornada pela API', async () => {
    const plan = mealPlan();
    plan.refeicoes = [
      { ...plan.refeicoes[0], id: 6, diaSemana: 1 },
      { ...plan.refeicoes[0], id: 7, nome: 'Jantar', diaSemana: 2 }
    ];
    const tree = await renderPlan(plan);

    await act(async () => {
      tree.root.findByProps({ testID: 'day-selector-pill-SEG' }).props.onPress();
    });
    expect(tree.root.findByProps({ testID: 'meal-card-6' })).toBeTruthy();
    expect(tree.root.findAllByProps({ testID: 'meal-card-7' })).toHaveLength(0);

    await act(async () => {
      tree.root.findByProps({ testID: 'day-selector-pill-TER' }).props.onPress();
    });
    expect(tree.root.findAllByProps({ testID: 'meal-card-6' })).toHaveLength(0);
    expect(tree.root.findByProps({ testID: 'meal-card-7' })).toBeTruthy();

    await act(async () => {
      await tree.root.findByProps({ testID: 'hydration-add-button' }).props.onPress();
    });
    expect(addWater).toHaveBeenCalledWith(250);
    expect(renderedText(tree)).toContain('0.3L de 2.5L atingidos');

    act(() => tree.unmount());
  });

  it('adapta o layout responsivamente entre telas compactas (390px) e largas (768px)', async () => {
    const spy = jest.spyOn(RN.Dimensions, 'get');

    spy.mockReturnValue({ width: 390, height: 844, scale: 2, fontScale: 1 });
    const compactTree = await renderPlan(mealPlan());
    const compactScroll = compactTree.root.findAllByType(ScrollView)[0];
    expect(JSON.stringify(compactScroll.props.contentContainerStyle)).toContain('"maxWidth":560');
    act(() => compactTree.unmount());

    spy.mockReturnValue({ width: 768, height: 1024, scale: 2, fontScale: 1 });
    const wideTree = await renderPlan(mealPlan());
    const wideScroll = wideTree.root.findAllByType(ScrollView)[0];
    expect(JSON.stringify(wideScroll.props.contentContainerStyle)).toContain('"maxWidth":760');
    act(() => wideTree.unmount());

    spy.mockRestore();
  });
});
