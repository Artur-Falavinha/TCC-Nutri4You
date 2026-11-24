import { apiClient } from '../../core/api/api-client';

export interface AvisoConsulta {
  id: number;
  consultaId: number;
  tipo: 'CONFIRMADA' | 'REAGENDADA' | 'RECUSADA' | 'CANCELADA';
  dataHora: string;
  criadaEm: string;
}

export function listarAvisosConsulta(): Promise<AvisoConsulta[]> {
  return apiClient.get<AvisoConsulta[]>('/agenda/notificacoes');
}
