import { apiClient } from '../api/api-client';

export interface PacientePerfil {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  sexo: string | null;
  dataNascimento: string | null;
}

export interface NutricionistaVinculo {
  id: number;
  nome: string;
  email: string;
}

export interface AtualizarPerfilPayload {
  nome: string;
  telefone?: string;
  sexo?: string;
  dataNascimento?: string;
}

export function carregarPerfil(): Promise<PacientePerfil> {
  return apiClient.get<PacientePerfil>('/usuarios/me/perfil');
}

export function atualizarPerfil(payload: AtualizarPerfilPayload): Promise<PacientePerfil> {
  return apiClient.put<PacientePerfil>('/usuarios/me', payload);
}

export function listarNutricionistas(): Promise<NutricionistaVinculo[]> {
  return apiClient.get<NutricionistaVinculo[]>('/usuarios/me/nutricionistas');
}

export function desvincularNutricionista(idNutricionista: number): Promise<void> {
  return apiClient.delete<void>(`/usuarios/me/nutricionistas/${idNutricionista}/relacao`);
}
