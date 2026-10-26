import { apiClient } from '../../core/api/api-client';
import { MealPlan, ShoppingItemUpdate, ShoppingList } from './dieta.models';

export const DEFAULT_SHOPPING_DAYS = 7;
export const MIN_SHOPPING_DAYS = 1;
export const MAX_SHOPPING_DAYS = 30;

export function getActiveMealPlan(): Promise<MealPlan | null> {
  return apiClient.get<MealPlan | null>('/me/plano-alimentar');
}

export async function getShoppingList(days = DEFAULT_SHOPPING_DAYS): Promise<ShoppingList | null> {
  validateShoppingDays(days);
  return apiClient.get<ShoppingList | null>(`/me/lista-compras?dias=${days}`);
}

export async function updateShoppingItem(
  foodId: number,
  update: ShoppingItemUpdate
): Promise<ShoppingList> {
  if (!Number.isInteger(foodId) || foodId <= 0) {
    throw new Error('O alimento informado é inválido.');
  }
  validateShoppingDays(update.dias);
  if (!Number.isInteger(update.planoId) || update.planoId <= 0) {
    throw new Error('O plano informado é inválido.');
  }

  return apiClient.put<ShoppingList>(`/me/lista-compras/itens/${foodId}`, update);
}

function validateShoppingDays(days: number): void {
  if (!Number.isInteger(days) || days < MIN_SHOPPING_DAYS || days > MAX_SHOPPING_DAYS) {
    throw new Error(`O período deve estar entre ${MIN_SHOPPING_DAYS} e ${MAX_SHOPPING_DAYS} dias.`);
  }
}
