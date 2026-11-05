export type ExameStatus = 'PENDENTE' | 'ENVIADO' | 'EM_ANALISE' | 'ANALISADO' | 'CONCLUIDO';

export interface ExamePedido {
  id: number;
  nome: string;
  status: ExameStatus;
  versao: number;
  parecer?: string | null;
  descricao?: string | null;
  observacoes?: string | null;
  dataSolicitacao?: string | null;
  dataEnvio?: string | null;
  possuiArquivo: boolean;
  arquivoNome?: string | null;
  arquivoUrl?: string | null;
  nutricionistaNome?: string | null;
}

export interface ArquivoExameSelecionado {
  nome: string;
  tipo: string;
  tamanhoBytes?: number;
  file?: File;
  uri?: string;
}

export interface EnviarResultadoExamePayload {
  versao: number;
  arquivo: ArquivoExameSelecionado;
}
