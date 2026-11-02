export type ExameStatus = 'PENDENTE' | 'ENVIADO' | 'EM_ANALISE' | 'ANALISADO' | 'CONCLUIDO';

export interface ExamePedido {
  id: number;
  nome: string;
  status: ExameStatus;
  descricao?: string | null;
  observacoes?: string | null;
  dataSolicitacao?: string | null;
  dataEnvio?: string | null;
  arquivoNome?: string | null;
  arquivoUrl?: string | null;
  nutricionistaNome?: string | null;
}

export interface ArquivoExameSelecionado {
  nome: string;
  tipo: string;
  tamanhoBytes?: number;
  conteudoBase64?: string;
  uri?: string;
}

export interface EnviarResultadoExamePayload {
  arquivoNome: string;
  arquivoTipo?: string;
  arquivoConteudoBase64?: string;
  observacoes?: string;
}
