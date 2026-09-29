export interface Paciente {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  dataNascimento?: string;
  sexo?: string;
  telefone?: string;
  relacaoAtiva?: boolean;
}

export interface PacienteResumo {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
}
