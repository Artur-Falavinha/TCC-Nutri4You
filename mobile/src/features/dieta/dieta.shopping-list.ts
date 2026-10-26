import { ShoppingListItem } from './dieta.models';

export interface ShoppingListCategory {
  categoria: string;
  itens: ShoppingListItem[];
}

export interface ShoppingListProgress {
  total: number;
  comprados: number;
  percentual: number;
}

function comparePortugueseText(first: string, second: string): number {
  return first.localeCompare(second, 'pt-BR', { sensitivity: 'base' });
}

export function groupShoppingItemsByCategory(items: ShoppingListItem[]): ShoppingListCategory[] {
  const categories = new Map<string, ShoppingListCategory>();

  items.forEach((item) => {
    const categoryKey = item.categoria.trim().toLocaleLowerCase('pt-BR');
    const category = categories.get(categoryKey);

    if (category) {
      category.itens.push(item);
      return;
    }

    categories.set(categoryKey, {
      categoria: item.categoria.trim(),
      itens: [item]
    });
  });

  return Array.from(categories.values())
    .map((category) => ({
      ...category,
      itens: [...category.itens].sort((first, second) => comparePortugueseText(first.nome, second.nome))
    }))
    .sort((first, second) => comparePortugueseText(first.categoria, second.categoria));
}

export function getShoppingListProgress(items: ShoppingListItem[]): ShoppingListProgress {
  const total = items.length;
  const comprados = items.filter((item) => item.comprado).length;

  return {
    total,
    comprados,
    percentual: total === 0 ? 0 : Math.round((comprados / total) * 100)
  };
}
