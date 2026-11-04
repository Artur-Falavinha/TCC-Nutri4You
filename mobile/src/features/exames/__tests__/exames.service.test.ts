import { apiClient } from '../../../core/api/api-client';
import { listarMeusExames, removerResultadoExame, validarArquivoExame, MAX_EXAM_FILE_SIZE_BYTES } from '../exames.service';
jest.mock('../../../core/api/api-client', () => ({ apiClient: { get: jest.fn(), postForm: jest.fn(), delete: jest.fn() } }));

describe('API de exames', () => {
  beforeEach(() => jest.clearAllMocks());
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
});
