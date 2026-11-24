import { apiClient } from '../../core/api/api-client';

export interface AvisoConsulta {
  id: number;
  consultaId: number;
  tipo: 'CONFIRMADA' | 'REAGENDADA' | 'RECUSADA' | 'CANCELADA' | 'LEMBRETE_24H';
  dataHora: string;
  criadaEm: string;
}

export interface AvisoPlanoAlimentar {
  id: number;
  titulo: string;
  atualizacao: boolean;
  vigenciaInicio: string;
  vigenciaFim: string;
  criadaEm: string;
}

export interface AvisoExame {
  id: number;
  tipo: 'SOLICITADO' | 'PARECER_REGISTRADO';
  exameNome: string;
  criadaEm: string;
}

export type AvisoPaciente = AvisoConsulta | AvisoPlanoAlimentar | AvisoExame;

export function chaveAviso(aviso: AvisoPaciente): string {
  if ('exameNome' in aviso) return 'exame:' + aviso.id;
  return 'atualizacao' in aviso ? 'plano:' + aviso.id : 'aviso:' + aviso.id;
}

export function listarAvisosConsulta(): Promise<AvisoConsulta[]> {
  return apiClient.get<AvisoConsulta[]>('/agenda/notificacoes');
}

export function listarAvisosPlanos(): Promise<AvisoPlanoAlimentar[]> {
  return apiClient.get<AvisoPlanoAlimentar[]>('/usuarios/me/notificacoes-planos');
}

export function listarAvisosExames(): Promise<AvisoExame[]> {
  return apiClient.get<AvisoExame[]>('/usuarios/me/notificacoes-exames');
}
