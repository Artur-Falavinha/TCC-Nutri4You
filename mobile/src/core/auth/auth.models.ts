export type UserProfile = 'PACIENTE' | 'NUTRICIONISTA';

export interface LoginResponse {
  token: string;
  tipoUsuario: UserProfile | string;
}

export interface ConfirmacaoCadastroPaciente {
  email: string;
  expiraEm: string;
}

export interface ComprovanteCadastro extends ConfirmacaoCadastroPaciente {
  token: string;
}

export interface PacienteAutocadastroPayload {
  tokenCadastro: string;
  versaoTermos: string;
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone?: string;
  sexo?: string;
  dataNascimento?: string;
}

export interface MensagemPayload {
  mensagem?: string;
}
