import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { apiClient } from '../../core/api/api-client';
import {
  ArquivoExameSelecionado,
  EnviarResultadoExamePayload,
  ExamePedido
} from './exames.models';

export const MAX_EXAM_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export class ExameArquivoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExameArquivoError';
  }
}

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

  let result: DocumentPicker.DocumentPickerResult;
  try {
    result = await DocumentPicker.getDocumentAsync({
      type: Object.values(MIME_BY_EXTENSION),
      copyToCacheDirectory: true,
      multiple: false
    });
  } catch {
    throw new ExameArquivoError('Não foi possível abrir o seletor de arquivos do dispositivo.');
  }
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

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodificarBase64(entrada: string): Uint8Array {
  const limpo = entrada
    .replace(/^data:[^;]+;base64,/i, '')
    .replace(/[^A-Za-z0-9+/=]/g, '');
  if (!limpo) {
    return new Uint8Array(0);
  }
  const padding = limpo.endsWith('==') ? 2 : limpo.endsWith('=') ? 1 : 0;
  const tamanho = Math.max(0, Math.floor((limpo.length * 3) / 4) - padding);
  const saida = new Uint8Array(tamanho);
  let indiceSaida = 0;

  for (let i = 0; i < limpo.length; i += 4) {
    const c0 = BASE64_ALPHABET.indexOf(limpo[i]);
    const c1 = BASE64_ALPHABET.indexOf(limpo[i + 1]);
    const c2 = limpo[i + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(limpo[i + 2]);
    const c3 = limpo[i + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(limpo[i + 3]);
    if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) {
      throw new Error('Base64 inválido.');
    }
    const triplo = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    if (indiceSaida < tamanho) saida[indiceSaida++] = (triplo >> 16) & 0xff;
    if (indiceSaida < tamanho) saida[indiceSaida++] = (triplo >> 8) & 0xff;
    if (indiceSaida < tamanho) saida[indiceSaida++] = triplo & 0xff;
  }

  return saida;
}

function normalizarBytes(valor: unknown): Uint8Array | null {
  if (valor instanceof Uint8Array) {
    const copia = new Uint8Array(valor.byteLength);
    copia.set(valor);
    return copia;
  }
  if (valor instanceof ArrayBuffer) {
    const copia = new Uint8Array(valor.byteLength);
    copia.set(new Uint8Array(valor));
    return copia;
  }
  if (ArrayBuffer.isView(valor)) {
    const visao = new Uint8Array(valor.buffer, valor.byteOffset, valor.byteLength);
    const copia = new Uint8Array(visao.byteLength);
    copia.set(visao);
    return copia;
  }
  if (
    typeof valor === 'object' &&
    valor !== null &&
    'byteLength' in valor &&
    typeof (valor as { byteLength: unknown }).byteLength === 'number' &&
    'buffer' in valor &&
    (valor as { buffer: unknown }).buffer instanceof ArrayBuffer
  ) {
    const obj = valor as { buffer: ArrayBuffer; byteOffset?: number; byteLength: number };
    const visao = new Uint8Array(obj.buffer, obj.byteOffset ?? 0, obj.byteLength);
    const copia = new Uint8Array(visao.byteLength);
    copia.set(visao);
    return copia;
  }
  return null;
}

async function lerBytesArquivoNativo(
  uri: string
): Promise<{ bytes: Uint8Array; origem: ExpoFile | null }> {
  const urisCandidatas = [uri];
  if (uri.includes('%25')) {
    try {
      const decodificada = decodeURIComponent(uri);
      if (decodificada && decodificada !== uri) {
        urisCandidatas.push(decodificada);
      }
    } catch {
      // ignora URI malformada
    }
  }

  let origemInstancia: ExpoFile | null = null;
  let ultimoErro: unknown = null;

  for (const uriCandidata of urisCandidatas) {
    try {
      const candidato = new ExpoFile(uriCandidata);
      origemInstancia ??= candidato;
      if (typeof candidato.size === 'number' && candidato.size > MAX_EXAM_FILE_SIZE_BYTES) {
        throw new ExameArquivoError('Envie um arquivo não vazio de até 5 MiB.');
      }

      if (typeof candidato.bytes === 'function') {
        try {
          const lido = normalizarBytes(await candidato.bytes());
          if (lido) {
            return { bytes: lido, origem: candidato };
          }
        } catch (erroBytes) {
          ultimoErro = erroBytes;
        }
      }

      if (typeof candidato.base64 === 'function') {
        try {
          const b64 = await candidato.base64();
          if (typeof b64 === 'string') {
            return { bytes: decodificarBase64(b64), origem: candidato };
          }
        } catch (erroBase64) {
          ultimoErro = erroBase64;
        }
      }

      if (typeof candidato.arrayBuffer === 'function') {
        try {
          const lido = normalizarBytes(await candidato.arrayBuffer());
          if (lido) {
            return { bytes: lido, origem: candidato };
          }
        } catch (erroBuffer) {
          ultimoErro = erroBuffer;
        }
      }
    } catch (erroArquivo) {
      if (erroArquivo instanceof ExameArquivoError) {
        throw erroArquivo;
      }
      ultimoErro = erroArquivo;
    }

    if (typeof readAsStringAsync === 'function') {
      try {
        const b64 = await readAsStringAsync(uriCandidata, { encoding: 'base64' });
        if (typeof b64 === 'string') {
          return { bytes: decodificarBase64(b64), origem: origemInstancia };
        }
      } catch (erroLegacy) {
        ultimoErro = erroLegacy;
      }
    }
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__ && ultimoErro) {
    console.warn('[Exames] Falha ao ler arquivo local:', ultimoErro);
  }
  throw new ExameArquivoError(
    'Não foi possível ler o arquivo selecionado. Selecione novamente e tente enviar.'
  );
}

async function prepararArquivoNativoMultipart(arquivo: {
  uri: string;
  nome: string;
  tipo: string;
}): Promise<Blob> {
  const { bytes, origem } = await lerBytesArquivoNativo(arquivo.uri);

  const erroConteudo = validarArquivoExame({
    nome: arquivo.nome,
    tipo: arquivo.tipo,
    tamanhoBytes: bytes.byteLength
  });
  if (erroConteudo) {
    throw new ExameArquivoError(erroConteudo);
  }

  const copiarBuffer = (): ArrayBuffer => {
    const copia = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(copia).set(bytes);
    return copia;
  };

  let baseBlob: Blob;
  try {
    baseBlob = new Blob([copiarBuffer()], { type: arquivo.tipo });
  } catch {
    baseBlob = Object.create(
      typeof Blob !== 'undefined' && Blob.prototype ? Blob.prototype : (origem ?? Object.prototype)
    ) as Blob;
  }

  return Object.defineProperties(baseBlob, {
    uri: { value: arquivo.uri, enumerable: true, configurable: true, writable: true },
    name: { value: arquivo.nome, enumerable: true, configurable: true, writable: true },
    type: { value: arquivo.tipo, enumerable: true, configurable: true, writable: true },
    size: { value: bytes.byteLength, enumerable: true, configurable: true, writable: true },
    bytes: {
      value: async () => new Uint8Array(copiarBuffer()),
      enumerable: true,
      configurable: true,
      writable: true
    },
    arrayBuffer: {
      value: async () => copiarBuffer(),
      enumerable: true,
      configurable: true,
      writable: true
    }
  });
}

export async function enviarResultadoExame(
  exameId: number,
  payload: EnviarResultadoExamePayload
): Promise<ExamePedido> {
  if (!Number.isInteger(exameId) || exameId <= 0) {
    throw new ExameArquivoError('O pedido de exame informado é inválido.');
  }
  const nome = payload.arquivo.nome?.trim() ?? '';
  const tipo = (payload.arquivo.tipo || inferMimeTypeFromFileName(nome)).toLowerCase();
  const erro = validarArquivoExame({
    ...payload.arquivo,
    nome,
    tipo
  });
  if (erro) throw new ExameArquivoError(erro);

  const form = new FormData();
  if (Platform.OS === 'web') {
    if (!payload.arquivo.file) {
      throw new ExameArquivoError('Selecione novamente o arquivo para envio.');
    }
    const erroWeb = validarArquivoExame({
      nome,
      tipo,
      tamanhoBytes: payload.arquivo.file.size
    });
    if (erroWeb) throw new ExameArquivoError(erroWeb);
    form.append('arquivo', payload.arquivo.file, nome);
  } else {
    if (!payload.arquivo.uri) {
      throw new ExameArquivoError('Selecione novamente o arquivo para envio.');
    }
    const arquivoNativo = await prepararArquivoNativoMultipart({
      uri: payload.arquivo.uri,
      nome,
      tipo
    });
    form.append('arquivo', arquivoNativo, nome);
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
