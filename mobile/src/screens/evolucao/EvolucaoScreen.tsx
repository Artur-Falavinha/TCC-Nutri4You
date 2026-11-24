import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { AppHeader } from '../../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { logout } from '../../core/auth/auth.service';
import { carregarPerfil } from '../../core/perfil/perfil.service';
import { formatarDataCivil } from '../../core/utils/date-mask.util';
import {
  AvaliacaoHistorico,
  carregarEvolucao,
  formatarDataMes,
  calcularVariacao
} from '../../core/evolucao/evolucao.service';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';
import { ChartDataPoint, EvolucaoLineChart } from './components/EvolucaoLineChart';
import { MedidasGridCarousel } from './components/MedidasGridCarousel';
import { useCarrosselEvolucao } from './components/useCarrosselEvolucao';

type Props = NativeStackScreenProps<RootStackParamList, 'Evolucao'>;

const GRAFICOS = [
  { titulo: 'Peso', rotulo: 'Peso', acessibilidade: 'Gráfico de Peso', unidade: 'kg' },
  { titulo: 'Gordura Corporal (%)', rotulo: 'Gordura corporal', acessibilidade: 'Gráfico de Gordura Corporal', unidade: '%' }
] as const;

function VariacaoGrafico({ variacao }: { variacao: NonNullable<ReturnType<typeof calcularVariacao>> }) {
  const { direcao, percentual } = variacao;
  const icone = direcao === 'queda' ? 'arrow-down' : direcao === 'alta' ? 'arrow-up' : 'minus';
  const descricao = direcao === 'queda' ? 'Queda' : direcao === 'alta' ? 'Aumento' : 'Estável';
  const cor = direcao === 'alta' ? colors.dangerText : colors.brandDeep;
  return (
    <View
      accessible
      accessibilityLabel={descricao + ', ' + Math.abs(percentual) + '%'}
      style={[
        styles.deltaBadge,
        direcao === 'queda' && styles.deltaBadgeQueda,
        direcao === 'alta' && styles.deltaBadgeAlta
      ]}
    >
      <Feather name={icone} size={14} color={cor} aria-hidden />
      <Text style={[styles.deltaBadgeTexto, { color: cor }]}>{Math.abs(percentual)}%</Text>
    </View>
  );
}

export function EvolucaoScreen({ navigation }: Props) {
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [nomePaciente, setNomePaciente] = useState('Paciente');
  const [menuVisible, setMenuVisible] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoHistorico[]>([]);
  const { width } = useWindowDimensions();
  const { definirRef: definirRefGrafico, pagina: graficoAba, largura: larguraGrafico,
    irPara: selecionarGrafico, onLayout: medirGrafico, aoRolar: rolarGrafico } = useCarrosselEvolucao(GRAFICOS.length);

  const buscarDados = useCallback(async () => {
    const [historicoResp, perfilResp] = await Promise.all([
      carregarEvolucao(),
      carregarPerfil().catch(() => null)
    ]);
    return {
      avaliacoes: historicoResp?.avaliacoes ?? [],
      nome: perfilResp?.nome || 'Paciente'
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    void buscarDados()
      .then((dados) => {
        if (!cancelado) {
          setAvaliacoes(dados.avaliacoes);
          setNomePaciente(dados.nome);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setErro('Não foi possível carregar os dados de evolução.');
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [buscarDados]);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const dados = await buscarDados();
      setAvaliacoes(dados.avaliacoes);
    } catch {
      setErro('Não foi possível carregar os dados de evolução.');
    } finally {
      setCarregando(false);
    }
  }, [buscarDados]);

  const onRefresh = async () => {
    setRecarregando(true);
    try {
      const dados = await buscarDados();
      setAvaliacoes(dados.avaliacoes);
      setErro('');
    } catch {
      setErro('Não foi possível carregar os dados de evolução.');
    } finally {
      setRecarregando(false);
    }
  };

  // Avaliações vêm ordenadas da mais recente para a mais antiga (descendente)
  const cronologicas = [...avaliacoes].reverse(); // da mais antiga para a mais recente
  const atual = avaliacoes[0];
  const anterior = avaliacoes.length > 1 ? avaliacoes[1] : undefined;
  const primeira = cronologicas[0];

  // Dados para o gráfico de Peso
  const pesoChartData: ChartDataPoint[] = cronologicas
    .filter((a) => a.peso != null)
    .map((a) => ({
      label: formatarDataMes(a.dataAvaliacao),
      dataFormatada: formatarDataCivil(a.dataAvaliacao),
      value: Number(a.peso),
      formatted: `${Number(a.peso).toFixed(1)} kg`
    }));

  // Dados para o gráfico de Gordura Corporal (%)
  const gorduraChartData: ChartDataPoint[] = cronologicas
    .filter((a) => a.percentualGordura != null)
    .map((a) => ({
      label: formatarDataMes(a.dataAvaliacao),
      dataFormatada: formatarDataCivil(a.dataAvaliacao),
      value: Number(a.percentualGordura),
      formatted: `${Number(a.percentualGordura).toFixed(1)}%`
    }));

  // Variações entre a última e a penúltima
  const variacaoPesoRecente = atual && anterior ? calcularVariacao(atual.peso, anterior.peso, 'kg') : null;
  const variacaoGorduraRecente = atual && anterior ? calcularVariacao(atual.percentualGordura, anterior.percentualGordura, '%') : null;

  // Progresso total desde o início da jornada
  const gerarMensagemProgresso = (): string => {
    if (avaliacoes.length === 0) {
      return 'Inicie seu acompanhamento clínico com seu nutricionista para acompanhar seu progresso.';
    }
    if (avaliacoes.length === 1) {
      return 'Primeira avaliação registrada com sucesso! Continue focado nas suas metas para acompanhar sua evolução.';
    }

    if (graficoAba === 0 && atual?.peso != null && primeira?.peso != null) {
      const diffTotal = Number((atual.peso - primeira.peso).toFixed(1));
      if (diffTotal < 0) {
        return `Você perdeu ${Math.abs(diffTotal)} kg desde o início da sua jornada. Continue focado nos seus objetivos!`;
      } else if (diffTotal > 0) {
        return `Você ganhou ${diffTotal} kg desde o início da sua jornada. Continue focado nos seus objetivos!`;
      } else {
        return 'Seu peso manteve-se estável desde o início da sua jornada. Continue focado nos seus objetivos!';
      }
    }

    if (graficoAba === 1 && atual?.percentualGordura != null && primeira?.percentualGordura != null) {
      const diffTotal = Number((atual.percentualGordura - primeira.percentualGordura).toFixed(1));
      if (diffTotal < 0) {
        return `Seu percentual de gordura diminuiu ${Math.abs(diffTotal)} pontos percentuais desde o início da sua jornada. Continue focado nos seus objetivos!`;
      } else if (diffTotal > 0) {
        return `Seu percentual de gordura aumentou ${diffTotal} pontos percentuais desde o início da sua jornada. Continue focado nos seus objetivos!`;
      } else {
        return 'Seu percentual de gordura manteve-se estável desde o início da sua jornada.';
      }
    }

    return 'Acompanhe seu progresso e mantenha sua rotina em dia!';
  };

  const sair = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      })
    );
  };

  const navegarPeloMenu = async (destino: MenuDestination) => {
    setMenuVisible(false);
    if (destino === 'home') {
      navigation.navigate('Dashboard');
      return;
    }
    if (destino === 'profile') {
      navigation.navigate('DadosPessoais');
      return;
    }
    if (destino === 'appointments') {
      navigation.navigate('Agenda');
      return;
    }
    if (destino === 'diet') {
      navigation.navigate('Dieta');
      return;
    }
    if (destino === 'shopping') {
      navigation.navigate('Compras');
      return;
    }
    if (destino === 'exams') {
      navigation.navigate('Exames');
      return;
    }
    if (destino === 'password') {
      navigation.navigate('TrocarSenha');
      return;
    }
    if (destino === 'logout') {
      await sair();
      return;
    }
    if (destino !== 'results') {
      setAviso('Este módulo ainda não está disponível nesta etapa.');
    }
  };

  const metricas = [
    { dados: pesoChartData, valor: atual?.peso, variacao: variacaoPesoRecente },
    { dados: gorduraChartData, valor: atual?.percentualGordura, variacao: variacaoGorduraRecente }
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, width < 420 && styles.contentCompact, { maxWidth: width >= 640 ? 760 : 560 }]}
        refreshControl={
          <RefreshControl refreshing={recarregando} onRefresh={onRefresh} colors={[colors.brand]} tintColor={colors.brand} />
        }
      >
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header" aria-level={1}>Resultados</Text>
        </View>

        {aviso ? (
          <View style={styles.avisoBox} aria-live="polite">
            <Text style={styles.avisoText}>{aviso}</Text>
          </View>
        ) : null}
        {carregando ? (
          <View style={[styles.surface, styles.stateCard]} aria-live="polite">
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.bodyText}>Carregando evolução...</Text>
          </View>
        ) : erro ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Feather name="alert-circle" size={24} color={colors.dangerText} aria-hidden />
            <Text style={styles.errorText}>{erro}</Text>
            <Pressable
              style={({ pressed }) => [styles.btnRetry, pressed && styles.pressionado]}
              accessibilityRole="button"
              onPress={() => void carregarDados()}
            >
              <Text style={styles.btnRetryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : avaliacoes.length === 0 ? (
          <View style={[styles.surface, styles.stateCard]} testID="estado-sem-dados-suficientes">
            <View style={styles.sectionIcon} aria-hidden>
              <Feather name="trending-up" size={22} color={colors.brand} />
            </View>
            <Text style={styles.emptyTitle} accessibilityRole="header" aria-level={2}>
              Sem dados suficientes para exibir a evolução
            </Text>
            <Text style={[styles.bodyText, styles.centered]}>
              Seu nutricionista ainda não registrou avaliações antropométricas para o seu acompanhamento.
              Assim que forem adicionadas na sua consulta, seus gráficos e histórico de medidas aparecerão aqui.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.surface} testID="progresso-geral-card">
              <View style={styles.sectionHeading}>
                <View style={styles.sectionIcon} aria-hidden>
                  <Feather name="trending-up" size={20} color={colors.brand} />
                </View>
                <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>Progresso Geral</Text>
              </View>
              <Text style={styles.bodyText} aria-live="polite" accessibilityLiveRegion="polite">
                {gerarMensagemProgresso()}
              </Text>
            </View>

            <View style={styles.surface} testID="graficos-carousel-card">
              <View style={styles.seletorGrafico}>
                {GRAFICOS.map((opcao, indice) => {
                  const selecionado = graficoAba === indice;
                  return (
                    <Pressable
                      key={opcao.unidade}
                      style={({ pressed }) => [
                        styles.seletorBotao, selecionado && styles.seletorAtivo, pressed && styles.pressionado
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={opcao.acessibilidade}
                      accessibilityState={{ selected: selecionado }}
                      {...(Platform.OS === 'web' && { 'aria-pressed': selecionado })}
                      onPress={() => selecionarGrafico(indice)}
                    >
                      <Text style={[styles.seletorTexto, selecionado && styles.seletorTextoAtivo]}>{opcao.rotulo}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView
                ref={definirRefGrafico}
                style={styles.carousel}
                horizontal
                pagingEnabled
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                onLayout={medirGrafico}
                onMomentumScrollEnd={rolarGrafico}
                onScroll={Platform.OS === 'web' ? rolarGrafico : undefined}
                scrollEventThrottle={32}
              >
                {GRAFICOS.map((opcao, indice) => {
                  const { dados, valor, variacao } = metricas[indice];
                  const ativo = graficoAba === indice;
                  return (
                    <View
                      key={opcao.unidade}
                      style={[styles.chartSlide, { width: larguraGrafico || '100%' }]}
                      aria-hidden={!ativo}
                      accessibilityElementsHidden={!ativo}
                      importantForAccessibility={ativo ? 'auto' : 'no-hide-descendants'}
                    >
                      <View style={styles.chartHeader}>
                        <View style={styles.chartIdentity}>
                          <Text style={styles.chartTitulo} accessibilityRole="header" aria-level={2}>{opcao.titulo}</Text>
                          <Text style={styles.chartValorGrande}>
                            {valor != null ? Number(valor).toFixed(1) + (opcao.unidade === 'kg' ? ' kg' : '%') : '—'}
                          </Text>
                        </View>
                        {variacao && <VariacaoGrafico variacao={variacao} />}
                      </View>
                      <EvolucaoLineChart data={dados} unidade={opcao.unidade} height={160} interativo={ativo} />
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            <MedidasGridCarousel avaliacoes={avaliacoes} />
          </>
        )}
      </ScrollView>
      <SideMenu
        visible={menuVisible}
        activeItem="results"
        userName={nomePaciente}
        onClose={() => setMenuVisible(false)}
        onNavigate={(destino) => void navegarPeloMenu(destino)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  contentCompact: { paddingHorizontal: spacing.sm },
  heading: { paddingTop: spacing.xs },
  title: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 30, lineHeight: 38 },
  surface: {
    backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm, ...shadows.card
  },
  avisoBox: { backgroundColor: colors.confirmedBackground, borderRadius: radius.md, padding: spacing.sm },
  avisoText: { color: colors.brandDeep, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIcon: {
    width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.confirmedBackground,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  sectionTitle: { flex: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 20, lineHeight: 27 },
  bodyText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 23 },
  centered: { textAlign: 'center' },
  stateCard: { alignItems: 'center', padding: spacing.xl },
  emptyTitle: {
    color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 19, lineHeight: 26, textAlign: 'center'
  },
  errorBox: {
    backgroundColor: colors.dangerButtonBackground, borderColor: colors.dangerBackground,
    borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, alignItems: 'flex-start'
  },
  errorText: { color: colors.dangerText, fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 23 },
  btnRetry: {
    backgroundColor: colors.brand, minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center'
  },
  btnRetryText: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  pressionado: { opacity: 0.8 },
  seletorGrafico: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  seletorBotao: {
    minHeight: 48, flexGrow: 1, flexShrink: 1, flexBasis: 110, borderRadius: radius.md,
    backgroundColor: colors.page, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs, paddingVertical: spacing.xs
  },
  seletorAtivo: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  seletorTexto: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  seletorTextoAtivo: { color: colors.white },
  carousel: { width: '100%', flexGrow: 0 },
  chartSlide: { gap: spacing.sm },
  chartHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  chartIdentity: { flexGrow: 1, flexShrink: 1, flexBasis: 136, gap: spacing.xxs },
  chartTitulo: { color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21 },
  chartValorGrande: {
    color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 28, lineHeight: 36, fontVariant: ['tabular-nums']
  },
  deltaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs, borderRadius: radius.sm, backgroundColor: colors.page
  },
  deltaBadgeQueda: { backgroundColor: colors.confirmedBackground },
  deltaBadgeAlta: { backgroundColor: colors.dangerButtonBackground },
  deltaBadgeTexto: { fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 18, fontVariant: ['tabular-nums'] }
});
