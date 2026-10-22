import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { EvolucaoLineChart } from '../components/EvolucaoLineChart';
import { MedidasGridCarousel } from '../components/MedidasGridCarousel';
import { ConsumoProgressoCard } from '../components/ConsumoProgressoCard';
import { AvaliacaoHistorico } from '../../../core/evolucao/evolucao.service';

describe('Evolução Components', () => {
  describe('EvolucaoLineChart', () => {
    it('renderiza mensagem de estado vazio quando não há dados', async () => {
      let tree: renderer.ReactTestRenderer | undefined;
      await act(async () => {
        tree = renderer.create(<EvolucaoLineChart data={[]} />);
      });
      expect(JSON.stringify(tree?.toJSON())).toContain('Sem dados suficientes para o gráfico.');
    });

    it('renderiza ponto único com tooltip e label', async () => {
      let tree: renderer.ReactTestRenderer | undefined;
      await act(async () => {
        tree = renderer.create(
          <EvolucaoLineChart
            data={[{ label: 'Out', value: 72.5, formatted: '72.5 kg' }]}
            unidade="kg"
          />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('72.5 kg');
      expect(str).toContain('Out');
    });

    it('renderiza múltiplos pontos e segmentos', async () => {
      const data = [
        { label: 'Jan', value: 76.7, formatted: '76.7 kg' },
        { label: 'Fev', value: 74.0, formatted: '74.0 kg' },
        { label: 'Mar', value: 72.5, formatted: '72.5 kg' }
      ];
      let tree: renderer.ReactTestRenderer | undefined;
      await act(async () => {
        tree = renderer.create(
          <EvolucaoLineChart data={data} unidade="kg" cor="#006f1e" />
        );
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Jan');
      expect(str).toContain('Fev');
      expect(str).toContain('Mar');
      expect(str).toContain('72.5 kg');
    });
  });

  describe('MedidasGridCarousel', () => {
    const fakeAvaliacoes: AvaliacaoHistorico[] = [
      {
        id: 2,
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
      },
      {
        id: 1,
        dataAvaliacao: '2026-09-01T10:00:00',
        peso: 75.0,
        altura: 1.75,
        imc: 24.49,
        razaoCinturaQuadril: 0.84,
        percentualGordura: 19.5,
        massaMuscularKg: 31.5,
        pregaBicipital: 7.0,
        pregaTricipital: 11.0,
        pregaSubescapular: 13.0,
        pregaSuprailiaca: 15.5,
        circunferenciaCintura: 86.0,
        circunferenciaQuadril: 103.0,
        circunferenciaBraco: 34.0
      }
    ];

    it('renderiza o primeiro slide com cintura, quadril, braço e RCQ e deltas', async () => {
      let tree: renderer.ReactTestRenderer | undefined;
      await act(async () => {
        tree = renderer.create(<MedidasGridCarousel avaliacoes={fakeAvaliacoes} />);
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Cintura');
      expect(str).toContain('84,0 cm');
      expect(str).toContain('-2.0 cm');
      expect(str).toContain('Quadril');
      expect(str).toContain('102,0 cm');
      expect(str).toContain('-1.0 cm');
      expect(str).toContain('Braço');
      expect(str).toContain('34,0 cm');
      expect(str).toContain('0 cm');
      expect(str).toContain('Relação Cintura/Quadril');
      expect(str).toContain('0,82');
      expect(str).toContain('-0.02');
    });

    it('permite alternar para o segundo slide exibindo massa muscular e dobras', async () => {
      let component: renderer.ReactTestRenderer | undefined;
      await act(async () => {
        component = renderer.create(<MedidasGridCarousel avaliacoes={fakeAvaliacoes} />);
      });
      const root = component!.root;

      const dotSlide2 = root.findAllByProps({ accessibilityLabel: 'Slide 2' })[0];
      await act(async () => {
        dotSlide2.props.onPress();
      });

      const str = JSON.stringify(component!.toJSON());
      expect(str).toContain('Massa Muscular');
      expect(str).toContain('32,0 kg');
      expect(str).toContain('+0.5 kg');
      expect(str).toContain('IMC');
      expect(str).toContain('23,67');
      expect(str).toContain('Prega Tricipital');
      expect(str).toContain('10,0 mm');
      expect(str).toContain('-1.0 mm');
      expect(str).toContain('Prega Supra-ilíaca');
      expect(str).toContain('14,0 mm');
    });

  });

  describe('ConsumoProgressoCard', () => {
    it('renderiza estado vazio quando consumo é nulo', async () => {
      let tree: renderer.ReactTestRenderer | undefined;
      await act(async () => {
        tree = renderer.create(<ConsumoProgressoCard consumo={null} />);
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('Consumo do dia');
      expect(str).toContain('Sem registros');
      expect(str).toContain('Nenhum registro de consumo para hoje');
    });

    it('renderiza calorias e macronutrientes quando consumo está preenchido', async () => {
      const fakeConsumo = {
        data: '2026-10-11',
        caloriasConsumidas: 1800,
        metaCalorias: 2000,
        proteinas: 110,
        metaProteinas: 130,
        carboidratos: 220,
        metaCarboidratos: 250,
        gorduras: 45,
        metaGorduras: 60
      };
      let tree: renderer.ReactTestRenderer | undefined;
      await act(async () => {
        tree = renderer.create(<ConsumoProgressoCard consumo={fakeConsumo} />);
      });
      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('1800');
      expect(str).toContain('2000');
      expect(str).toContain('kcal');
      expect(str).toContain('Proteínas');
      expect(str).toContain('110');
      expect(str).toContain('Carboidratos');
      expect(str).toContain('220');
      expect(str).toContain('Gorduras');
      expect(str).toContain('45');
    });

    it('não inventa uma meta calórica quando o plano ainda não a definiu', async () => {
      let tree: renderer.ReactTestRenderer | undefined;
      await act(async () => {
        tree = renderer.create(
          <ConsumoProgressoCard
            consumo={{
              data: 'Hoje',
              caloriasConsumidas: 450,
              metaCalorias: null,
              proteinas: 20,
              carboidratos: 50,
              gorduras: 10
            }}
          />
        );
      });

      const str = JSON.stringify(tree?.toJSON());
      expect(str).toContain('450');
      expect(str).toContain('Meta calórica ainda não definida.');
      expect(str).not.toContain('2000');
    });
  });
});
