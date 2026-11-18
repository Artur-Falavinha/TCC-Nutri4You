import { apiClient } from '../api/api-client';
import { env } from '../config/env';

export const VERSAO_TERMOS = '2026-11-16.2';
export const URL_TERMOS = `${env.apiBaseUrl.replace(/\/$/, '')}/privacidade/termos`;
export function formatarVersaoTermos(versao: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:\.(\d+))?$/.exec(versao);
  if (!partes) return versao;
  const [, ano, mes, dia, revisao] = partes;
  return `${dia}/${mes}/${ano}${revisao ? ` (revisão ${revisao})` : ''}`;
}

export interface Aceite { versao: string; aceito: boolean; aceitoEm: string | null }
export const lerAceite = () => apiClient.get<Aceite>('/privacidade/me/termos');
export const aceitarTermos = (versao: string) => apiClient.post<Aceite>('/privacidade/me/termos', { versao, aceito: true });

export function formatarDataAceite(data: string): string {
  const instante = new Date(data);
  if (Number.isNaN(instante.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(instante);
}
