export type Answer = string | number | string[] | null;
export type Answers = Record<string, Answer>;
export interface AnamneseField {
  key: string;
  section: string;
  label: string;
  type: 'text' | 'textarea' | 'tel' | 'select' | 'number' | 'range' | 'checkbox';
  required: boolean;
  maxLength: number | null;
  min: number | null;
  max: number | null;
  step: number | null;
  pattern: string | null;
  options: string[] | null;
  exclusive: string | null;
  when: { key: string; values: string[] } | null;
  image: string | null;
  imageAlt: string | null;
}
export interface Patient {
  id: number;
  nome: string;
  email: string;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
}
export interface Anamnese {
  paciente: Patient;
  versao: number | null;
  status: 'NAO_INICIADA' | 'RASCUNHO' | 'FINALIZADA';
  respostas: Answers;
  rascunho: Answers | null;
  finalizadaEm: string | null;
  atualizadaEm: string | null;
}
