import { apiClient } from '../api/api-client';
import { setToken } from '../auth/token-storage';

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

interface PreferenciaLembretesConsulta {
  ativa: boolean;
}

const rotaLembretes = '/usuarios/me/lembretes-consulta';

export function carregarLembretesConsulta(): Promise<PreferenciaLembretesConsulta> {
  return apiClient.get<PreferenciaLembretesConsulta>(rotaLembretes);
}

export function salvarLembretesConsulta(ativa: boolean): Promise<PreferenciaLembretesConsulta> {
  return apiClient.put<PreferenciaLembretesConsulta>(rotaLembretes, { ativa });
}

export function carregarPerfil(): Promise<PacientePerfil> {
  return apiClient.get<PacientePerfil>('/usuarios/me/perfil');
}

export function atualizarPerfil(payload: AtualizarPerfilPayload): Promise<PacientePerfil> {
  return apiClient.put<PacientePerfil>('/usuarios/me', payload);
}

export function iniciarAlteracaoEmail(novoEmail: string, senhaAtual: string): Promise<{ email: string }> {
  return apiClient.post('/usuarios/me/email/iniciar', { novoEmail, senhaAtual });
}

export async function confirmarAlteracaoEmail(codigo: string): Promise<string> {
  const { token, email } = await apiClient.post<{ token: string; email: string }>(
    '/usuarios/me/email/confirmar', { codigo }
  );
  await setToken(token);
  return email;
}

export function listarNutricionistas(): Promise<NutricionistaVinculo[]> {
  return apiClient.get<NutricionistaVinculo[]>('/usuarios/me/nutricionistas');
}

export function desvincularNutricionista(idNutricionista: number): Promise<void> {
  return apiClient.delete<void>(`/usuarios/me/nutricionistas/${idNutricionista}/relacao`);
}

export interface SolicitacaoVinculo {
  id: number;
  nutricionistaNome: string;
  versao: number;
}

export function listarSolicitacoesVinculo(): Promise<SolicitacaoVinculo[]> {
  return apiClient.get<SolicitacaoVinculo[]>('/usuarios/me/solicitacoes-vinculo');
}

export function decidirSolicitacaoVinculo(
  solicitacao: SolicitacaoVinculo,
  aceitar: boolean
): Promise<NutricionistaVinculo | null> {
  return apiClient.post<NutricionistaVinculo | null>(
    '/usuarios/me/solicitacoes-vinculo/' + solicitacao.id + '/decisao',
    { versao: solicitacao.versao, aceitar }
  );
}
