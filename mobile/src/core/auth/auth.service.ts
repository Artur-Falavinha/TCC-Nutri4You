import {
  LoginResponse,
  MensagemPayload,
  PacienteAutocadastroPayload
} from './auth.models';
import { clearToken, setToken } from './token-storage';
import { apiClient } from '../api/api-client';
import { ApiError } from '../api/api-response.types';

const MENSAGEM_RECUPERACAO_GENERICA =
  'Se o e-mail estiver cadastrado, voce recebera instrucoes para redefinir a senha.';

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const data = await apiClient.post<LoginResponse>('/auth/login', {
    email: email.trim().toLowerCase(),
    senha
  });

  if (!data?.token) {
    throw new ApiError({
      status: 500,
      error: 'ERRO_INTERNO',
      message: 'Resposta de login invalida.'
    });
  }

  if (data.tipoUsuario !== 'PACIENTE') {
    await clearToken();
    throw new ApiError({
      status: 403,
      error: 'ACESSO_NEGADO',
      message: 'Este aplicativo e exclusivo para pacientes. Use o portal web se for nutricionista.'
    });
  }

  await setToken(data.token);
  return data;
}

export async function autocadastrarPaciente(
  payload: PacienteAutocadastroPayload
): Promise<MensagemPayload> {
  return apiClient.post<MensagemPayload>('/pacientes/autocadastro', {
    nome: payload.nome.trim(),
    email: payload.email.trim().toLowerCase(),
    senha: payload.senha,
    cpf: payload.cpf?.trim() || undefined,
    telefone: payload.telefone?.trim() || undefined,
    sexo: payload.sexo?.trim() || undefined,
    dataNascimento: payload.dataNascimento || undefined
  });
}

export async function solicitarRecuperacaoSenha(email: string): Promise<string> {
  try {
    const data = await apiClient.post<MensagemPayload>('/auth/recuperar-senha', {
      email: email.trim().toLowerCase()
    });
    return data?.mensagem ?? MENSAGEM_RECUPERACAO_GENERICA;
  } catch {
    // RNF02: nunca revelar se o e-mail existe / falha de rede
    return MENSAGEM_RECUPERACAO_GENERICA;
  }
}

export async function redefinirSenha(token: string, senha: string): Promise<void> {
  await apiClient.post('/auth/redefinir-senha', {
    token: token.trim(),
    senha
  });
}

export async function logout(): Promise<void> {
  await clearToken();
}
