import { apiClient } from '../../../core/api/api-client';
import {
  getActiveMealPlan,
  getShoppingList,
  updateShoppingItem
} from '../dieta.service';
import { MealPlan, ShoppingList } from '../dieta.models';

jest.mock('../../../core/api/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn()
  }
}));

describe('dieta.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('carrega somente o plano ativo do paciente autenticado', async () => {
    const plan = { id: 12, titulo: 'Plano semanal' } as MealPlan;
    (apiClient.get as jest.Mock).mockResolvedValueOnce(plan);

    await expect(getActiveMealPlan()).resolves.toBe(plan);
    expect(apiClient.get).toHaveBeenCalledWith('/me/plano-alimentar');
  });

  it('preserva a resposta vazia quando nao ha plano ativo', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce(null);

    await expect(getActiveMealPlan()).resolves.toBeNull();
  });

  it('carrega lista de compras por periodo com sete dias como padrao', async () => {
    const list = { planoId: 12, dias: 7, itens: [] } as ShoppingList;
    (apiClient.get as jest.Mock).mockResolvedValueOnce(list);

    await expect(getShoppingList()).resolves.toBe(list);
    expect(apiClient.get).toHaveBeenCalledWith('/me/lista-compras?dias=7');
  });

  it('aceita periodos entre um e trinta dias', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce(null);

    await getShoppingList(30);

    expect(apiClient.get).toHaveBeenCalledWith('/me/lista-compras?dias=30');
  });

  it('aceita o menor periodo de um dia', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce(null);

    await getShoppingList(1);

    expect(apiClient.get).toHaveBeenCalledWith('/me/lista-compras?dias=1');
  });

  it.each([0, 31, 1.5, Number.NaN])('rejeita periodo invalido %s antes da requisicao', async (days) => {
    await expect(getShoppingList(days)).rejects.toThrow('O período deve estar entre 1 e 30 dias.');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('envia a marcacao e retorna a lista autoritativa da API', async () => {
    const response = {
      planoId: 12,
      dias: 7,
      totalItens: 2,
      itensComprados: 1,
      itensPendentes: 1,
      itens: [{ alimentoId: 44, nome: 'Arroz', quantidadeGramas: 700, comprado: true }]
    } as ShoppingList;
    (apiClient.put as jest.Mock).mockResolvedValueOnce(response);

    await expect(
      updateShoppingItem(44, { planoId: 12, dias: 7, comprado: true })
    ).resolves.toBe(response);
    expect(apiClient.put).toHaveBeenCalledWith('/me/lista-compras/itens/44', {
      planoId: 12,
      dias: 7,
      comprado: true
    });
  });

  it('rejeita identificador de alimento invalido antes da requisicao', async () => {
    await expect(
      updateShoppingItem(0, { planoId: 12, dias: 7, comprado: true })
    ).rejects.toThrow('O alimento informado é inválido.');
    expect(apiClient.put).not.toHaveBeenCalled();
  });
});
