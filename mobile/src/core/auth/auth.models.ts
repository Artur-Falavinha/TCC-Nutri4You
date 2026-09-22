export type UserProfile = 'PACIENTE' | 'NUTRICIONISTA';

export interface LoginResponse {
  token: string;
  tipoUsuario: UserProfile | string;
}

export interface PacienteAutocadastroPayload {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  sexo?: string;
  dataNascimento?: string;
}

export interface MensagemPayload {
  mensagem?: string;
}
