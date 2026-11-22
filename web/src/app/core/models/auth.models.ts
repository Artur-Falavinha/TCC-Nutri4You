export type UserProfile = 'NUTRICIONISTA' | 'PACIENTE';

export interface LoginResponse {
  token: string;
  tipoUsuario: UserProfile;
}

export interface ConfirmacaoEmailResponse {
  tipoUsuario: UserProfile;
}

export interface CadastroEmailConfirmado extends ConfirmacaoEmailResponse {
  email: string;
  expiraEm: string;
}

export interface ComprovanteCadastro extends CadastroEmailConfirmado {
  token: string;
}

export interface UsuarioInfo {
  id: number;
  nome: string;
  email: string;
  perfil: UserProfile;
}

export interface MensagemResponse {
  mensagem?: string;
}

export interface NutricionistaCadastroPayload {
  tokenCadastro: string;
  crnDeclarado: boolean;
  versaoTermos: string;
  nome: string;
  email: string;
  senha: string;
  crn: string;
}

export interface RegisterDraft {
  versaoTermos?: string;
  nome: string;
  crn: string;
  email: string;
  termsAccepted: boolean;
}
