import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

import { apiClient } from '../../core/api/api-client';
import {
  ArquivoExameSelecionado,
  EnviarResultadoExamePayload,
  ExamePedido
} from './exames.models';

export const MAX_EXAM_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg'
};

export function inferMimeTypeFromFileName(nome: string): string {
  return MIME_BY_EXTENSION[nome.trim().toLowerCase().split('.').pop() ?? ''] ?? '';
}

export function validarArquivoExame(arquivo: {
  nome: string;
  tipo?: string | null;
  tamanhoBytes?: number | null;
}): string | null {
  const tipoEsperado = inferMimeTypeFromFileName(arquivo.nome);
  if (!tipoEsperado || (arquivo.tipo && arquivo.tipo.toLowerCase() !== tipoEsperado)) {
    return 'Formato inválido. Selecione PDF, PNG ou JPEG.';
  }
  if (
    arquivo.tamanhoBytes != null &&
    (arquivo.tamanhoBytes <= 0 || arquivo.tamanhoBytes > MAX_EXAM_FILE_SIZE_BYTES)
  ) {
    return 'Envie um arquivo não vazio de até 5 MiB.';
  }
  return null;
}

export function prepararArquivoWeb(file: File): ArquivoExameSelecionado {
  return {
    nome: file.name,
    tipo: file.type || inferMimeTypeFromFileName(file.name),
    tamanhoBytes: file.size,
    file
  };
}

export async function selecionarArquivoDispositivo(): Promise<ArquivoExameSelecionado | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.png,.jpg,.jpeg';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = () => {
        const file = input.files?.[0];
        input.remove();
        resolve(file ? prepararArquivoWeb(file) : null);
      };
      input.oncancel = () => {
        input.remove();
        resolve(null);
      };
      input.click();
    });
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: Object.values(MIME_BY_EXTENSION),
    copyToCacheDirectory: true,
    multiple: false
  });
  const asset = result.assets?.[0];
  return result.canceled || !asset
    ? null
    : {
        nome: asset.name,
        tipo: asset.mimeType || inferMimeTypeFromFileName(asset.name),
        tamanhoBytes: asset.size,
        uri: asset.uri
      };
}

interface PaginaExames {
  itens: ExamePedido[];
  totalPaginas: number;
}

export async function listarMeusExames(): Promise<ExamePedido[]> {
  const itens: ExamePedido[] = [];
  let pagina = 0;
  let totalPaginas = 1;
  while (pagina < totalPaginas) {
    const resposta = await apiClient.get<PaginaExames>(
      `/usuarios/me/exames?pagina=${pagina}`
    );
    itens.push(...resposta.itens);
    totalPaginas = resposta.totalPaginas;
    pagina += 1;
  }
  return itens;
}

export async function enviarResultadoExame(
  exameId: number,
  payload: EnviarResultadoExamePayload
): Promise<ExamePedido> {
  if (!Number.isInteger(exameId) || exameId <= 0) {
    throw new Error('O pedido de exame informado é inválido.');
  }
  const erro = validarArquivoExame(payload.arquivo);
  if (erro) throw new Error(erro);

  const form = new FormData();
  if (Platform.OS === 'web') {
    if (!payload.arquivo.file) throw new Error('Selecione novamente o arquivo para envio.');
    form.append('arquivo', payload.arquivo.file, payload.arquivo.nome);
  } else {
    if (!payload.arquivo.uri) throw new Error('Selecione novamente o arquivo para envio.');
    form.append('arquivo', {
      uri: payload.arquivo.uri,
      name: payload.arquivo.nome,
      type: payload.arquivo.tipo
    } as unknown as Blob);
  }
  return apiClient.postForm<ExamePedido>(
    `/usuarios/me/exames/${exameId}/arquivo?versao=${payload.versao}`,
    form
  );
}

export function removerResultadoExame(exameId: number, versao: number): Promise<ExamePedido> {
  return apiClient.delete<ExamePedido>(
    `/usuarios/me/exames/${exameId}/arquivo?versao=${versao}`
  );
}

export function baixarResultadoExame(exameId: number): Promise<Blob> {
  return apiClient.getBlob(`/usuarios/me/exames/${exameId}/arquivo`);
}
