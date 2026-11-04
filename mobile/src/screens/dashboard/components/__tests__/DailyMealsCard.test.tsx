import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { getConsumption, markMeal } from '../../../../features/dieta/consumo.service';
import { DailyMealsCard } from '../DailyMealsCard';

jest.mock('@react-navigation/native', () => ({ useFocusEffect: (callback: () => void) => jest.requireActual('react').useEffect(callback, [callback]) }));
jest.mock('../../../../features/dieta/consumo.service', () => ({ getConsumption: jest.fn(), markMeal: jest.fn() }));
const daily = { data: '2026-11-04', editavel: true, refeicoes: [{ id: 1, nome: 'Almoço', horario: '12:00', consumida: false, totais: { kcal: 200 } }], totais: { kcal: 0 } };
describe('Consumo na home', () => {
  beforeEach(() => jest.clearAllMocks());
  it('persiste a marcação e atualiza o progresso após confirmação do servidor', async () => {
    (getConsumption as jest.Mock).mockResolvedValue(daily);
    (markMeal as jest.Mock).mockResolvedValue({ ...daily, refeicoes: [{ ...daily.refeicoes[0], consumida: true }] });
    const onChanged = jest.fn().mockResolvedValue(undefined);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => { tree = renderer.create(<DailyMealsCard onChanged={onChanged} />); });
    await act(async () => { await tree.root.findByProps({ accessibilityRole: 'checkbox' }).props.onPress(); });
    expect(markMeal).toHaveBeenCalledWith(1, '2026-11-04', true);
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(tree.root.findByProps({ accessibilityRole: 'checkbox' }).props.accessibilityState.checked).toBe(true);
    act(() => tree.unmount());
  });
  it('mantém a marcação anterior quando a API falha e bloqueia edição do histórico', async () => {
    (getConsumption as jest.Mock).mockResolvedValue(daily);
    (markMeal as jest.Mock).mockRejectedValue(new Error('Falha ao salvar'));
    let tree!: renderer.ReactTestRenderer;
    await act(async () => { tree = renderer.create(<DailyMealsCard onChanged={jest.fn()} />); });
    await act(async () => { await tree.root.findByProps({ accessibilityRole: 'checkbox' }).props.onPress(); });
    expect(tree.root.findByProps({ accessibilityRole: 'checkbox' }).props.accessibilityState.checked).toBe(false);
    (getConsumption as jest.Mock).mockResolvedValue({ ...daily, data: '2026-11-03', editavel: false });
    await act(async () => { tree.root.findByProps({ accessibilityLabel: 'Consumo do dia anterior' }).props.onPress(); });
    expect(getConsumption).toHaveBeenLastCalledWith('2026-11-03');
    expect(tree.root.findByProps({ accessibilityRole: 'checkbox' }).props.disabled).toBe(true);
    act(() => tree.unmount());
  });
});
