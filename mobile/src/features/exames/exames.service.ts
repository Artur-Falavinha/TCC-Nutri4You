import { requireOptionalNativeModule } from 'expo-modules-core';

import { apiClient } from '../../core/api/api-client';
import { ApiError } from '../../core/api/api-response.types';
import {
  ArquivoExameSelecionado,
  EnviarResultadoExamePayload,
  ExamePedido,
  ExameStatus
} from './exames.models';

export const MAX_EXAM_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

const FALLBACK_EXAMES_INICIAIS: ExamePedido[] = [
  {
    id: 1,
    nome: 'Hemograma Completo',
    status: 'PENDENTE'
  },
  {
    id: 2,
    nome: 'Perfil Lipídico',
    status: 'ENVIADO',
    arquivoNome: 'resultado-perfil-lipidico.pdf'
  },
  {
    id: 3,
    nome: 'Glicemia de Jejum',
    status: 'PENDENTE'
  },
  {
    id: 4,
    nome: 'Vitamina D & B12',
    status: 'ENVIADO',
    arquivoNome: 'resultado-vitamina-d-b12.pdf'
  }
];

let fallbackExamesStore: ExamePedido[] = FALLBACK_EXAMES_INICIAIS.map((item) => ({ ...item }));

function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function inferMimeTypeFromFileName(fileName: string): string {
  const lower = fileName.trim().toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return '';
}

export function validarArquivoExame(arquivo: {
  nome: string;
  tipo?: string | null;
  tamanhoBytes?: number | null;
}): string | null {
  const nomeLimpo = arquivo.nome.trim();
  if (!nomeLimpo) {
    return 'Selecione um arquivo válido antes de continuar.';
  }

  const lowerName = nomeLimpo.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const mime = (arquivo.tipo ?? '').trim().toLowerCase();
  const hasValidMime = !mime || ALLOWED_MIME_TYPES.includes(mime);

  if (!hasValidExtension || !hasValidMime) {
    return 'Formato inválido. Selecione apenas arquivos PDF ou imagem (PNG, JPG, JPEG, WEBP).';
  }

  if (
    typeof arquivo.tamanhoBytes === 'number' &&
    arquivo.tamanhoBytes > MAX_EXAM_FILE_SIZE_BYTES
  ) {
    return 'O arquivo selecionado excede o limite máximo de 10 MB.';
  }

  return null;
}

interface NativeDocumentPickerAsset {
  name?: string;
  mimeType?: string;
  size?: number;
  uri?: string;
}

interface NativeDocumentPickerResult {
  canceled?: boolean;
  assets?: NativeDocumentPickerAsset[];
}

interface NativeDocumentPickerModule {
  getDocumentAsync: (options: {
    type: string[];
    copyToCacheDirectory: boolean;
    multiple: boolean;
  }) => Promise<NativeDocumentPickerResult>;
}

function readWebFileAsBase64(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof FileReader === 'undefined') {
      resolve(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const commaIndex = reader.result.indexOf(',');
        resolve(commaIndex >= 0 ? reader.result.slice(commaIndex + 1) : reader.result);
      } else {
        resolve(undefined);
      }
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

export async function selecionarArquivoDispositivo(): Promise<ArquivoExameSelecionado | null> {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp';
      input.style.display = 'none';
      document.body.appendChild(input);

      let settled = false;
      const cleanup = () => {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      };

      input.onchange = async () => {
        if (settled) return;
        settled = true;
        const file = input.files?.[0];
        cleanup();
        if (!file) {
          resolve(null);
          return;
        }
        const conteudoBase64 = await readWebFileAsBase64(file);
        resolve({
          nome: file.name,
          tipo: file.type || inferMimeTypeFromFileName(file.name),
          tamanhoBytes: file.size,
          conteudoBase64
        });
      };

      input.oncancel = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(null);
      };

      input.click();
    });
  }

  const nativePicker =
    requireOptionalNativeModule<NativeDocumentPickerModule>('ExpoDocumentPicker');
  if (nativePicker && typeof nativePicker.getDocumentAsync === 'function') {
    const result = await nativePicker.getDocumentAsync({
      type: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
      copyToCacheDirectory: true,
      multiple: false
    });
    if (result?.canceled || !result?.assets?.length) {
      return null;
    }
    const asset = result.assets[0];
    const nome = asset.name ?? 'resultado-exame.pdf';
    return {
      nome,
      tipo: asset.mimeType || inferMimeTypeFromFileName(nome),
      tamanhoBytes: asset.size,
      uri: asset.uri
    };
  }

  return null;
}

function normalizeStatus(rawStatus: unknown, hasFile: boolean): ExameStatus {
  if (typeof rawStatus === 'string') {
    const upper = rawStatus.trim().toUpperCase();
    if (
      upper === 'PENDENTE' ||
      upper === 'ENVIADO' ||
      upper === 'EM_ANALISE' ||
      upper === 'ANALISADO' ||
      upper === 'CONCLUIDO'
    ) {
      return upper;
    }
    if (upper === 'RECEBIDO' || upper === 'ENTREGUE') {
      return 'ENVIADO';
    }
  }
  return hasFile ? 'ENVIADO' : 'PENDENTE';
}

export function normalizeExamePedido(raw: Record<string, unknown>, fallbackId = 1): ExamePedido {
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id ?? fallbackId);
  const nome =
    (typeof raw.nome === 'string' && raw.nome.trim()) ||
    (typeof raw.nomeExame === 'string' && raw.nomeExame.trim()) ||
    (typeof raw.titulo === 'string' && raw.titulo.trim()) ||
    (typeof raw.tipoExame === 'string' && raw.tipoExame.trim()) ||
    `Exame #${id}`;
  const arquivoNome =
    (typeof raw.arquivoNome === 'string' && raw.arquivoNome) ||
    (typeof raw.nomeArquivo === 'string' && raw.nomeArquivo) ||
    null;
  const arquivoUrl =
    (typeof raw.arquivoUrl === 'string' && raw.arquivoUrl) ||
    (typeof raw.urlArquivo === 'string' && raw.urlArquivo) ||
    null;
  const status = normalizeStatus(raw.status ?? raw.situacao, Boolean(arquivoNome || arquivoUrl));

  return {
    id,
    nome,
    status,
    descricao: typeof raw.descricao === 'string' ? raw.descricao : null,
    observacoes: typeof raw.observacoes === 'string' ? raw.observacoes : null,
    dataSolicitacao:
      typeof raw.dataSolicitacao === 'string'
        ? raw.dataSolicitacao
        : typeof raw.criadoEm === 'string'
          ? raw.criadoEm
          : null,
    dataEnvio:
      typeof raw.dataEnvio === 'string'
        ? raw.dataEnvio
        : typeof raw.enviadoEm === 'string'
          ? raw.enviadoEm
          : null,
    arquivoNome,
    arquivoUrl,
    nutricionistaNome:
      typeof raw.nutricionistaNome === 'string' ? raw.nutricionistaNome : null
  };
}

export async function listarMeusExames(): Promise<ExamePedido[]> {
  let response: unknown;
  try {
    response = await apiClient.get<unknown>('/me/exames');
  } catch (error) {
    if (isNotFoundError(error)) {
      return fallbackExamesStore.map((item) => ({ ...item }));
    }
    throw error;
  }

  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return response.map((item, idx) =>
      normalizeExamePedido((item ?? {}) as Record<string, unknown>, idx + 1)
    );
  }
  const obj = response as Record<string, unknown>;
  const list = Array.isArray(obj.content)
    ? obj.content
    : Array.isArray(obj.itens)
      ? obj.itens
      : Array.isArray(obj.exames)
        ? obj.exames
        : [];
  return list.map((item, idx) =>
    normalizeExamePedido((item ?? {}) as Record<string, unknown>, idx + 1)
  );
}

export async function enviarResultadoExame(
  exameId: number,
  payload: EnviarResultadoExamePayload
): Promise<ExamePedido> {
  if (!Number.isInteger(exameId) || exameId <= 0) {
    throw new Error('O pedido de exame informado é inválido.');
  }
  const trimmedName = payload.arquivoNome.trim();
  if (!trimmedName) {
    throw new Error('Selecione um arquivo antes de confirmar o envio.');
  }

  const validationError = validarArquivoExame({
    nome: trimmedName,
    tipo: payload.arquivoTipo
  });
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const response = await apiClient.post<unknown>(`/me/exames/${exameId}/resultado`, {
      ...payload,
      arquivoNome: trimmedName
    });

    if (response && typeof response === 'object') {
      return normalizeExamePedido(response as Record<string, unknown>, exameId);
    }
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const enviado: ExamePedido = {
    id: exameId,
    nome:
      fallbackExamesStore.find((item) => item.id === exameId)?.nome ??
      `Exame #${exameId}`,
    status: 'ENVIADO',
    arquivoNome: trimmedName,
    dataEnvio: new Date().toISOString()
  };

  fallbackExamesStore = fallbackExamesStore.map((item) =>
    item.id === exameId ? { ...item, ...enviado } : item
  );

  return enviado;
}

export async function removerResultadoExame(exameId: number): Promise<ExamePedido> {
  if (!Number.isInteger(exameId) || exameId <= 0) {
    throw new Error('O pedido de exame informado é inválido.');
  }

  try {
    const response = await apiClient.delete<unknown>(`/me/exames/${exameId}/resultado`);
    if (response && typeof response === 'object') {
      return normalizeExamePedido(response as Record<string, unknown>, exameId);
    }
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  const removido: ExamePedido = {
    id: exameId,
    nome:
      fallbackExamesStore.find((item) => item.id === exameId)?.nome ??
      `Exame #${exameId}`,
    status: 'PENDENTE',
    arquivoNome: null,
    arquivoUrl: null,
    dataEnvio: null
  };

  fallbackExamesStore = fallbackExamesStore.map((item) =>
    item.id === exameId ? { ...item, ...removido } : item
  );

  return removido;
}
