export interface Paciente {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  dataNascimento?: string;
  sexo?: string;
  telefone?: string;
  ativo?: boolean;
}

export interface PacientesPage {
  content: Paciente[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

