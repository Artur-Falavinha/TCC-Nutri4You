import { getShoppingListProgress, groupShoppingItemsByCategory } from '../dieta.shopping-list';
import { ShoppingListItem } from '../dieta.models';

const items: ShoppingListItem[] = [
  { alimentoId: 1, nome: 'Tomate', categoria: 'Hortaliças', quantidadeGramas: 100, comprado: false },
  { alimentoId: 2, nome: 'Arroz', categoria: 'Cereais', quantidadeGramas: 200, comprado: true },
  { alimentoId: 3, nome: 'abóbora', categoria: 'Hortaliças', quantidadeGramas: 300, comprado: true },
  { alimentoId: 4, nome: 'Aveia', categoria: 'cereais', quantidadeGramas: 150, comprado: false }
];

describe('dieta.shopping-list', () => {
  it('agrupa por categoria e ordena categorias e alimentos em português sem diferenciar maiúsculas', () => {
    const groups = groupShoppingItemsByCategory(items);

    expect(groups.map(({ categoria }) => categoria)).toEqual(['Cereais', 'Hortaliças']);
    expect(groups.map(({ itens: groupedItems }) => groupedItems.map(({ nome }) => nome))).toEqual([
      ['Arroz', 'Aveia'],
      ['abóbora', 'Tomate']
    ]);
  });

  it('não altera a lista recebida ao agrupar os itens', () => {
    const originalItems = [...items];

    groupShoppingItemsByCategory(items);

    expect(items).toEqual(originalItems);
  });

  it('calcula contagem e percentual a partir dos alimentos marcados', () => {
    expect(getShoppingListProgress(items)).toEqual({ total: 4, comprados: 2, percentual: 50 });
    expect(getShoppingListProgress(items.map((item) => ({ ...item, comprado: true })).slice(0, 1))).toEqual({
      total: 1,
      comprados: 1,
      percentual: 100
    });
  });

  it('retorna progresso zerado quando não há itens', () => {
    expect(getShoppingListProgress([])).toEqual({ total: 0, comprados: 0, percentual: 0 });
  });
});
