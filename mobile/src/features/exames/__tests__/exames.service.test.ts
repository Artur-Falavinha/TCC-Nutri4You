import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { convertFormDataAsync } from 'expo/src/winter/fetch/convertFormData';

import { apiClient } from '../../../core/api/api-client';
import { ApiError } from '../../../core/api/api-response.types';
import {
  enviarResultadoExame,
  ExameArquivoError,
  listarMeusExames,
  MAX_EXAM_FILE_SIZE_BYTES,
  removerResultadoExame,
  selecionarArquivoDispositivo,
  validarArquivoExame
} from '../exames.service';

const mockBytesPorUri = new Map<string, () => Promise<Uint8Array>>();
const mockBase64PorUri = new Map<string, () => Promise<string>>();
const mockSizePorUri = new Map<string, number>();

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn()
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(async (uri: string) => {
    const reader = mockBase64PorUri.get(uri);
    if (!reader) {
      throw new Error(`FileNotFoundException: ${uri}`);
    }
    return reader();
  })
}));

jest.mock('expo-file-system', () => {
  class MockExpoFile {
    readonly uri: string;
    constructor(uri: string) {
      if (!uri || uri.startsWith('invalid://')) {
        throw new Error('ENOENT: invalid file uri');
      }
      this.uri = uri;
    }
    get size(): number | undefined {
      return mockSizePorUri.get(this.uri);
    }
    async bytes(): Promise<Uint8Array> {
      const reader = mockBytesPorUri.get(this.uri);
      if (!reader) {
        throw new Error(`java.io.FileNotFoundException: ${this.uri}`);
      }
      return reader();
    }
  }
  return { File: MockExpoFile };
});

jest.mock('../../../core/api/api-client', () => ({
  apiClient: { get: jest.fn(), postForm: jest.fn(), delete: jest.fn() }
}));

describe('API de exames', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBytesPorUri.clear();
    mockBase64PorUri.clear();
    mockSizePorUri.clear();
    Platform.OS = 'android';
  });

  afterAll(() => {
    Platform.OS = originalOS;
  });

  it('carrega as páginas reais sem fabricar pedidos', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ itens: [{ id: 10 }], totalPaginas: 2 })
      .mockResolvedValueOnce({ itens: [{ id: 11 }], totalPaginas: 2 });
    expect(await listarMeusExames()).toEqual([{ id: 10 }, { id: 11 }]);
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/usuarios/me/exames?pagina=0');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/usuarios/me/exames?pagina=1');
  });

  it('propaga 404 na listagem e remoção sem simular sucesso', async () => {
    const error = new Error('API não encontrada');
    (apiClient.get as jest.Mock).mockRejectedValueOnce(error);
    (apiClient.delete as jest.Mock).mockRejectedValueOnce(error);
    await expect(listarMeusExames()).rejects.toBe(error);
    await expect(removerResultadoExame(5, 7)).rejects.toBe(error);
    expect(apiClient.delete).toHaveBeenCalledWith('/usuarios/me/exames/5/arquivo?versao=7');
  });

  it('aceita o limite exato e rejeita excesso, arquivos vazios e WebP', () => {
    expect(validarArquivoExame({ nome: 'exame.pdf', tipo: 'application/pdf', tamanhoBytes: MAX_EXAM_FILE_SIZE_BYTES })).toBeNull();
    for (const size of [0, MAX_EXAM_FILE_SIZE_BYTES + 1])
      expect(validarArquivoExame({ nome: 'exame.pdf', tamanhoBytes: size })).not.toBeNull();
    expect(validarArquivoExame({ nome: 'exame.webp', tipo: 'image/webp', tamanhoBytes: 200 })).not.toBeNull();
    expect(validarArquivoExame({ nome: 'exame.png', tipo: 'application/pdf', tamanhoBytes: 200 })).not.toBeNull();
  });

  it('envia PDF, PNG e JPEG válidos no fluxo nativo em FormData compatível com convertFormDataAsync do Expo', async () => {
    const arquivos = [
      {
        nome: 'hemograma.pdf',
        tipo: 'application/pdf',
        uri: 'file:///cache/DocumentPicker/uuid-1.pdf',
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
      },
      {
        nome: 'exame-imagem.png',
        tipo: 'image/png',
        uri: 'file:///cache/DocumentPicker/uuid-2.png',
        bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      },
      {
        nome: 'laudo-foto.jpeg',
        tipo: 'image/jpeg',
        uri: 'file:///cache/DocumentPicker/uuid-3.jpg',
        bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
      }
    ];

    for (const arq of arquivos) {
      mockBytesPorUri.set(arq.uri, async () => arq.bytes);
      (apiClient.postForm as jest.Mock).mockResolvedValueOnce({
        id: 12,
        nome: 'Hemograma',
        versao: 2,
        status: 'ENVIADO',
        possuiArquivo: true,
        arquivoNome: arq.nome
      });

      const resposta = await enviarResultadoExame(12, {
        versao: 1,
        arquivo: {
          nome: arq.nome,
          tipo: arq.tipo,
          tamanhoBytes: arq.bytes.byteLength,
          uri: arq.uri
        }
      });

      expect(resposta.arquivoNome).toBe(arq.nome);
      const [rota, formEnviado] = (apiClient.postForm as jest.Mock).mock.lastCall as [string, FormData];
      expect(rota).toBe('/usuarios/me/exames/12/arquivo?versao=1');

      const { body, boundary } = await convertFormDataAsync(formEnviado);
      const textoMultipart = new TextDecoder().decode(body);
      expect(textoMultipart).toContain(`--${boundary}`);
      expect(textoMultipart).toContain(`content-disposition: form-data; name="arquivo"; filename="${arq.nome}"`);
      expect(textoMultipart).toContain(`content-type: ${arq.tipo}`);
      expect(body.byteLength).toBeGreaterThan(arq.bytes.byteLength);
    }
  });

  it('usa fallback base64 via expo-file-system/legacy quando ExpoFile.bytes falha no Expo Go', async () => {
    const uriExpoGo = 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%252540anonymous/DocumentPicker/laudo.pdf';
    const uriDecodificada = decodeURIComponent(uriExpoGo);
    // "%PDF" em base64 é "JVBERg=="
    mockBase64PorUri.set(uriDecodificada, async () => 'JVBERg==');
    (apiClient.postForm as jest.Mock).mockResolvedValueOnce({
      id: 15,
      nome: 'Vitamina D',
      versao: 1,
      status: 'ENVIADO',
      possuiArquivo: true,
      arquivoNome: 'laudo.pdf'
    });

    const resposta = await enviarResultadoExame(15, {
      versao: 0,
      arquivo: {
        nome: 'laudo.pdf',
        tipo: 'application/pdf',
        tamanhoBytes: 4,
        uri: uriExpoGo
      }
    });

    expect(resposta.status).toBe('ENVIADO');
    const [, formEnviado] = (apiClient.postForm as jest.Mock).mock.lastCall as [string, FormData];
    const { body } = await convertFormDataAsync(formEnviado);
    const textoMultipart = new TextDecoder().decode(body);
    expect(textoMultipart).toContain('filename="laudo.pdf"');
    expect(textoMultipart).toContain('content-type: application/pdf');
    expect(textoMultipart).toContain('%PDF');
  });

  it('trata cancelamento da seleção nativa retornando null e oculta erro técnico do seletor', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
      canceled: true,
      assets: null
    });
    expect(await selecionarArquivoDispositivo()).toBeNull();

    (DocumentPicker.getDocumentAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Native picker crashed: ContentResolver exception')
    );
    await expect(selecionarArquivoDispositivo()).rejects.toThrow(
      new ExameArquivoError('Não foi possível abrir o seletor de arquivos do dispositivo.')
    );
  });

  it('rejeita falha local de leitura sem chamar a API nem expor erro técnico ou erro de conexão', async () => {
    await expect(
      enviarResultadoExame(10, {
        versao: 0,
        arquivo: {
          nome: 'laudo.pdf',
          tipo: 'application/pdf',
          tamanhoBytes: 1024,
          uri: 'file:///cache/inexistente.pdf'
        }
      })
    ).rejects.toThrow(
      new ExameArquivoError('Não foi possível ler o arquivo selecionado. Selecione novamente e tente enviar.')
    );
    expect(apiClient.postForm).not.toHaveBeenCalled();
  });

  it('rejeita arquivo nativo vazio ou acima de 5 MiB ao ler o conteúdo real', async () => {
    const uriVazio = 'file:///cache/vazio.pdf';
    mockBytesPorUri.set(uriVazio, async () => new Uint8Array(0));
    await expect(
      enviarResultadoExame(10, {
        versao: 0,
        arquivo: { nome: 'vazio.pdf', tipo: 'application/pdf', uri: uriVazio }
      })
    ).rejects.toThrow('Envie um arquivo não vazio de até 5 MiB.');

    const uriAcima = 'file:///cache/grande.pdf';
    mockSizePorUri.set(uriAcima, MAX_EXAM_FILE_SIZE_BYTES + 10);
    await expect(
      enviarResultadoExame(10, {
        versao: 0,
        arquivo: { nome: 'grande.pdf', tipo: 'application/pdf', uri: uriAcima }
      })
    ).rejects.toThrow('Envie um arquivo não vazio de até 5 MiB.');
    expect(apiClient.postForm).not.toHaveBeenCalled();
  });

  it('preserva o envio pela versão web com File e propaga erros da API e de rede', async () => {
    Platform.OS = 'web';
    const webBlob = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], {
      type: 'application/pdf'
    });
    const webFile = Object.defineProperty(webBlob, 'name', {
      value: 'exame-web.pdf',
      enumerable: true,
      configurable: true,
      writable: true
    }) as File;

    (apiClient.postForm as jest.Mock).mockResolvedValueOnce({
      id: 7,
      nome: 'Glicemia',
      versao: 1,
      status: 'ENVIADO',
      possuiArquivo: true,
      arquivoNome: 'exame-web.pdf'
    });

    const enviado = await enviarResultadoExame(7, {
      versao: 0,
      arquivo: {
        nome: 'exame-web.pdf',
        tipo: 'application/pdf',
        tamanhoBytes: 128,
        file: webFile
      }
    });
    expect(enviado.status).toBe('ENVIADO');
    expect(apiClient.postForm).toHaveBeenCalledWith(
      '/usuarios/me/exames/7/arquivo?versao=0',
      expect.any(FormData)
    );

    const erroRede = new ApiError({
      status: 0,
      error: 'ERRO_DE_REDE',
      message: 'Não foi possível conectar ao sistema. Verifique sua conexão e tente novamente.',
      path: '/usuarios/me/exames/7/arquivo',
      timestamp: new Date().toISOString()
    });
    (apiClient.postForm as jest.Mock).mockRejectedValueOnce(erroRede);
    await expect(
      enviarResultadoExame(7, {
        versao: 0,
        arquivo: {
          nome: 'exame-web.pdf',
          tipo: 'application/pdf',
          tamanhoBytes: 128,
          file: webFile
        }
      })
    ).rejects.toBe(erroRede);
  });
});
