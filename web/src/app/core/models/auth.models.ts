export type UserProfile = 'NUTRICIONISTA' | 'PACIENTE';

export interface LoginResponse {
  token: string;
  tipoUsuario: UserProfile;
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
  nome: string;
  email: string;
  senha: string;
  crn: string;
}

export interface RegisterDraft {
  nome: string;
  crn: string;
  email: string;
  termsAccepted: boolean;
}
