import { apiClient } from '../../core/api/api-client';
import { Nutrients } from './dieta.models';

export interface MealConsumption { id: number; nome: string; horario: string; consumida: boolean; totais: Nutrients }
export interface DailyConsumption { data: string; editavel: boolean; refeicoes: MealConsumption[]; totais: Nutrients }
export function getConsumption(data?: string): Promise<DailyConsumption> {
  return apiClient.get<DailyConsumption>(`/me/consumo${data ? `?data=${data}` : ''}`);
}
export function markMeal(id: number, data: string, consumida: boolean): Promise<DailyConsumption> {
  return apiClient.put<DailyConsumption>(`/me/consumo/refeicoes/${id}`, { data, consumida });
}
