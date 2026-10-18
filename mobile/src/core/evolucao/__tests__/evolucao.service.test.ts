import {
  calcularPercentualMeta,
  calcularVariacao,
  carregarConsumoProgresso,
  carregarDashboardPaciente,
  carregarEvolucao,
  carregarMedidas,
  extrairPrimeiroNome,
  formatarDataDiaMes,
  formatarDataHoraConsulta,
  formatarDataMes,
  formatarNumeroMilhar
} from '../evolucao.service';
import { apiClient } from '../../api/api-client';

jest.mock('../../api/api-client', () => ({
  apiClient: {
    get: jest.fn()
  }
}));

describe('evolucao.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calcularVariacao', () => {
    it('calcula queda de peso com valor negativo e direcao queda', () => {
      const resultado = calcularVariacao(72.5, 76.7, 'kg');
      expect(resultado).not.toBeNull();
      expect(resultado?.valor).toBe(-4.2);
      expect(resultado?.percentual).toBe(-5.5);
      expect(resultado?.texto).toBe('-4.2 kg');
      expect(resultado?.direcao).toBe('queda');
    });

    it('calcula ganho com valor positivo e direcao alta', () => {
      const resultado = calcularVariacao(75.0, 73.0, 'kg');
      expect(resultado).not.toBeNull();
      expect(resultado?.valor).toBe(2);
      expect(resultado?.percentual).toBe(2.7);
      expect(resultado?.texto).toBe('+2.0 kg');
      expect(resultado?.direcao).toBe('alta');
    });

    it('retorna estavel quando a diferenca for menor que 0.01', () => {
      const resultado = calcularVariacao(70.0, 70.005, 'kg');
      expect(resultado).not.toBeNull();
      expect(resultado?.valor).toBe(0);
      expect(resultado?.percentual).toBe(0);
      expect(resultado?.texto).toBe('0 kg');
      expect(resultado?.direcao).toBe('estavel');
    });

    it('retorna null quando um dos valores for nulo ou invalido', () => {
      expect(calcularVariacao(null, 70)).toBeNull();
      expect(calcularVariacao(70, null)).toBeNull();
      expect(calcularVariacao(undefined, undefined)).toBeNull();
      expect(calcularVariacao(NaN, 70)).toBeNull();
    });
  });

  describe('formatarDataMes e formatarDataDiaMes', () => {
    it('formata o mes corretamente em abreviacao', () => {
      expect(formatarDataMes('2026-01-15T10:00:00')).toBe('Jan');
      expect(formatarDataMes('2026-03-20T10:00:00')).toBe('Mar');
      expect(formatarDataMes('2026-10-05T10:00:00')).toBe('Out');
    });

    it('retorna string vazia para datas invalidas', () => {
      expect(formatarDataMes('')).toBe('');
      expect(formatarDataMes('data-invalida')).toBe('');
    });

    it('formata dia e mes no formato DD/MM', () => {
      expect(formatarDataDiaMes('2026-05-09T10:00:00')).toBe('09/05');
      expect(formatarDataDiaMes('2026-12-25T10:00:00')).toBe('25/12');
    });
  });

  describe('helpers do dashboard do paciente', () => {
    it('extrai o primeiro nome corretamente', () => {
      expect(extrairPrimeiroNome('Arthur Falavinha')).toBe('Arthur');
      expect(extrairPrimeiroNome('  Mariana   Silva ')).toBe('Mariana');
      expect(extrairPrimeiroNome('')).toBe('Paciente');
      expect(extrairPrimeiroNome(null)).toBe('Paciente');
    });

    it('formata numeros com separador de milhar brasileiro', () => {
      expect(formatarNumeroMilhar(2100)).toBe('2.100');
      expect(formatarNumeroMilhar(1580)).toBe('1.580');
      expect(formatarNumeroMilhar(850)).toBe('850');
      expect(formatarNumeroMilhar(null)).toBe('0');
    });

    it('calcula percentual de meta arredondado', () => {
      expect(calcularPercentualMeta(2100, 2100)).toBe(100);
      expect(calcularPercentualMeta(1575, 2100)).toBe(75);
      expect(calcularPercentualMeta(100, 0)).toBe(0);
      expect(calcularPercentualMeta(null, 2000)).toBe(0);
    });

    it('formata data e hora da proxima consulta por extenso', () => {
      expect(formatarDataHoraConsulta('2026-10-25T14:30:00')).toBe(
        '25 de Outubro, às 14:30'
      );
      expect(formatarDataHoraConsulta('')).toBe('');
      expect(formatarDataHoraConsulta(null)).toBe('');
    });
  });

  describe('chamadas de API', () => {
    it('carregarEvolucao chama endpoint /usuarios/me/historico', async () => {
      const fakeHistorico = {
        consultas: [{ id: 1, pacienteNome: 'Ana', dataHora: '2026-10-01T10:00:00' }],
        avaliacoes: [
          {
            id: 10,
            dataAvaliacao: '2026-10-01T10:00:00',
            peso: 72.5,
            altura: 1.75,
            imc: 23.67,
            razaoCinturaQuadril: 0.82,
            percentualGordura: 18.5,
            massaMuscularKg: 32.0,
            pregaBicipital: 6.0,
            pregaTricipital: 10.0,
            pregaSubescapular: 12.0,
            pregaSuprailiaca: 14.0,
            circunferenciaCintura: 84.0,
            circunferenciaQuadril: 102.0,
            circunferenciaBraco: 34.0
          }
        ]
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce(fakeHistorico);

      const dados = await carregarEvolucao();
      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/historico');
      expect(dados).toEqual(fakeHistorico);
    });

    it('carregarMedidas chama endpoint /usuarios/me/medidas', async () => {
      const fakeMedidas = [{ id: 1, peso: 70, altura: 1.7, imc: 24.2, dataAvaliacao: '2026-10-01' }];
      (apiClient.get as jest.Mock).mockResolvedValueOnce(fakeMedidas);

      const dados = await carregarMedidas();
      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/medidas');
      expect(dados).toEqual(fakeMedidas);
    });

    it('carregarConsumoProgresso retorna null quando ocorre erro', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Falha de rede'));

      const resultado = await carregarConsumoProgresso();
      expect(resultado).toBeNull();
    });

    it('carregarConsumoProgresso retorna dados quando disponivel', async () => {
      const fakeConsumo = {
        data: '2026-10-11',
        caloriasConsumidas: 2100,
        metaCalorias: 2100,
        proteinas: 180,
        metaProteinas: 180,
        carboidratos: 245,
        metaCarboidratos: 245,
        gorduras: 65,
        metaGorduras: 65
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce(fakeConsumo);

      const resultado = await carregarConsumoProgresso();
      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/consumo-diario/progresso');
      expect(resultado).toEqual(fakeConsumo);
    });

    it('carregarDashboardPaciente chama endpoint /usuarios/me/dashboard', async () => {
      const fakeDashboard = {
        nomePaciente: 'Arthur Falavinha',
        consumo: {
          data: '2026-10-18',
          caloriasConsumidas: 2100,
          metaCalorias: 2100,
          proteinas: 180,
          metaProteinas: 180,
          carboidratos: 245,
          metaCarboidratos: 245,
          gorduras: 65,
          metaGorduras: 65
        },
        proximaConsulta: {
          id: 9,
          nutricionistaNome: 'Dra. Camila Ribeiro',
          dataHora: '2026-10-25T14:30:00',
          status: 'CONFIRMADA'
        },
        dietaAtiva: {
          idPlano: 1,
          metaKcal: 2100,
          metaProteina: 180,
          metaCarboidratos: 245,
          metaGordura: 65,
          nutricionistaNome: 'Dra. Camila Ribeiro'
        }
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce(fakeDashboard);

      const resultado = await carregarDashboardPaciente();
      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/dashboard');
      expect(resultado).toEqual(fakeDashboard);
    });
  });
});


