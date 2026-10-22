import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { logout } from '../../core/auth/auth.service';
import { carregarPerfil } from '../../core/perfil/perfil.service';
import {
  AvaliacaoHistorico,
  carregarConsumoProgresso,
  carregarEvolucao,
  ConsumoProgresso,
  formatarDataMes,
  calcularVariacao
} from '../../core/evolucao/evolucao.service';
import { RootStackParamList } from '../../navigation/types';
import { ChartDataPoint, EvolucaoLineChart } from './components/EvolucaoLineChart';
import { MedidasGridCarousel } from './components/MedidasGridCarousel';
import { ConsumoProgressoCard } from './components/ConsumoProgressoCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Evolucao'>;

export function EvolucaoScreen({ navigation }: Props) {
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [nomePaciente, setNomePaciente] = useState('Paciente');
  const [menuVisible, setMenuVisible] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoHistorico[]>([]);
  const [consumo, setConsumo] = useState<ConsumoProgresso | null>(null);
  const [graficoAba, setGraficoAba] = useState<0 | 1>(0); // 0: Peso, 1: Gordura Corporal
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 64);
  const chartScrollRef = useRef<ScrollView>(null);

  const buscarDados = useCallback(async () => {
    const [historicoResp, consumoResp, perfilResp] = await Promise.all([
      carregarEvolucao(),
      carregarConsumoProgresso(),
      carregarPerfil().catch(() => null)
    ]);
    return {
      avaliacoes: historicoResp?.avaliacoes ?? [],
      consumo: consumoResp,
      nome: perfilResp?.nome || 'Paciente'
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    void buscarDados()
      .then((dados) => {
        if (!cancelado) {
          setAvaliacoes(dados.avaliacoes);
          setConsumo(dados.consumo);
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
      setConsumo(dados.consumo);
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
      setConsumo(dados.consumo);
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
      value: Number(a.peso),
      formatted: `${Number(a.peso).toFixed(1)} kg`
    }));

  // Dados para o gráfico de Gordura Corporal (%)
  const gorduraChartData: ChartDataPoint[] = cronologicas
    .filter((a) => a.percentualGordura != null)
    .map((a) => ({
      label: formatarDataMes(a.dataAvaliacao),
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
        return `Você perdeu ${Math.abs(diffTotal)}% de gordura corporal desde o início da sua jornada. Continue focado nos seus objetivos!`;
      } else if (diffTotal > 0) {
        return `Sua gordura corporal variou +${diffTotal}% desde o início da sua jornada. Continue focado nos seus objetivos!`;
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

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={recarregando} onRefresh={onRefresh} colors={['#006f1e']} />
        }
      >
        {aviso ? (
          <View style={styles.avisoBox}>
            <Text style={styles.avisoText}>{aviso}</Text>
          </View>
        ) : null}
        {carregando ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#006f1e" />
            <Text style={styles.loadingText}>Carregando evolução...</Text>
          </View>
        ) : erro ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={28} color="#b42318" />
            <Text style={styles.errorText}>{erro}</Text>
            <Pressable style={styles.btnRetry} onPress={() => void carregarDados()}>
              <Text style={styles.btnRetryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : avaliacoes.length === 0 ? (
          /* Estado sem dados suficientes */
          <View style={styles.emptyCard} testID="estado-sem-dados-suficientes">
            <View style={styles.emptyIconCircle}>
              <Ionicons name="trending-up-outline" size={32} color="#006f1e" />
            </View>
            <Text style={styles.emptyTitle}>Sem dados suficientes para exibir a evolução</Text>
            <Text style={styles.emptyDescription}>
              Seu nutricionista ainda não registrou avaliações antropométricas para o seu acompanhamento.
              Assim que forem adicionadas na sua consulta, seus gráficos e histórico de medidas aparecerão aqui.
            </Text>
            <Pressable style={styles.btnEmptyRefresh} onPress={() => void carregarDados()}>
              <Ionicons name="refresh-outline" size={18} color="#006f1e" />
              <Text style={styles.btnEmptyRefreshText}>Verificar atualizações</Text>
            </Pressable>

            {/* Consumo Diário mesmo sem medidas antropométricas */}
            <ConsumoProgressoCard consumo={consumo} />
          </View>
        ) : (
          /* Dashboard com dados */
          <>
            {/* Card Progresso Geral */}
            <View style={styles.progressoGeralCard} testID="progresso-geral-card">
              <Text style={styles.progressoGeralTitulo}>Progresso Geral</Text>
              <Text style={styles.progressoGeralTexto}>{gerarMensagemProgresso()}</Text>
            </View>

            {/* Carrossel 1: Gráficos de Evolução (Peso & Gordura Corporal) */}
            <View
              style={styles.chartCarouselCard}
              testID="graficos-carousel-card"
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width - 32;
                if (w > 0) {
                  setChartWidth(w);
                }
              }}
            >
              <ScrollView
                ref={chartScrollRef}
                horizontal
                pagingEnabled
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  if (chartWidth > 0) {
                    const page = Math.round(e.nativeEvent.contentOffset.x / chartWidth);
                    setGraficoAba(page >= 1 ? 1 : 0);
                  }
                }}
              >
                {/* Slide Peso */}
                <View style={{ width: chartWidth }}>
                  <View style={styles.chartHeader}>
                    <View>
                      <Text style={styles.chartTitulo}>Peso</Text>
                      <Text style={styles.chartValorGrande}>
                        {atual?.peso != null ? `${Number(atual.peso).toFixed(1)} kg` : '—'}
                      </Text>
                    </View>
                    {variacaoPesoRecente && (
                      <View
                        style={[
                          styles.deltaBadge,
                          variacaoPesoRecente.direcao === 'queda' && styles.deltaBadgeVerde,
                          variacaoPesoRecente.direcao === 'alta' && styles.deltaBadgeVermelho
                        ]}
                      >
                        <Ionicons
                          name={
                            variacaoPesoRecente.direcao === 'queda'
                              ? 'arrow-down'
                              : variacaoPesoRecente.direcao === 'alta'
                                ? 'arrow-up'
                                : 'remove'
                          }
                          size={12}
                          color={
                            variacaoPesoRecente.direcao === 'queda'
                              ? '#006f1e'
                              : variacaoPesoRecente.direcao === 'alta'
                                ? '#b42318'
                                : '#64748b'
                          }
                        />
                        <Text
                          style={[
                            styles.deltaBadgeTexto,
                            variacaoPesoRecente.direcao === 'queda' && styles.deltaBadgeTextoVerde,
                            variacaoPesoRecente.direcao === 'alta' && styles.deltaBadgeTextoVermelho
                          ]}
                        >
                          {Math.abs(variacaoPesoRecente.percentual)}%
                        </Text>
                      </View>
                    )}
                  </View>

                  <EvolucaoLineChart
                    data={pesoChartData}
                    unidade="kg"
                    cor="#006f1e"
                    height={150}
                  />
                </View>

                {/* Slide Gordura Corporal (%) */}
                <View style={{ width: chartWidth }}>
                  <View style={styles.chartHeader}>
                    <View>
                      <Text style={styles.chartTitulo}>Gordura Corporal (%)</Text>
                      <Text style={styles.chartValorGrande}>
                        {atual?.percentualGordura != null ? `${Number(atual.percentualGordura).toFixed(1)}%` : '—'}
                      </Text>
                    </View>
                    {variacaoGorduraRecente && (
                      <View
                        style={[
                          styles.deltaBadge,
                          variacaoGorduraRecente.direcao === 'queda' && styles.deltaBadgeVerde,
                          variacaoGorduraRecente.direcao === 'alta' && styles.deltaBadgeVermelho
                        ]}
                      >
                        <Ionicons
                          name={
                            variacaoGorduraRecente.direcao === 'queda'
                              ? 'arrow-down'
                              : variacaoGorduraRecente.direcao === 'alta'
                                ? 'arrow-up'
                                : 'remove'
                          }
                          size={12}
                          color={
                            variacaoGorduraRecente.direcao === 'queda'
                              ? '#006f1e'
                              : variacaoGorduraRecente.direcao === 'alta'
                                ? '#b42318'
                                : '#64748b'
                          }
                        />
                        <Text
                          style={[
                            styles.deltaBadgeTexto,
                            variacaoGorduraRecente.direcao === 'queda' && styles.deltaBadgeTextoVerde,
                            variacaoGorduraRecente.direcao === 'alta' && styles.deltaBadgeTextoVermelho
                          ]}
                        >
                          {Math.abs(variacaoGorduraRecente.percentual)}%
                        </Text>
                      </View>
                    )}
                  </View>

                  <EvolucaoLineChart
                    data={gorduraChartData}
                    unidade="%"
                    cor="#008726"
                    height={150}
                  />
                </View>
              </ScrollView>

              {/* Dots do Carrossel de Gráficos */}
              <View style={styles.chartDotsRow}>
                <Pressable
                  onPress={() => {
                    setGraficoAba(0);
                    chartScrollRef.current?.scrollTo?.({ x: 0, animated: true });
                  }}
                  style={[styles.chartDot, graficoAba === 0 && styles.chartDotAtivo]}
                  accessibilityRole="button"
                  accessibilityLabel="Gráfico de Peso"
                />
                <Pressable
                  onPress={() => {
                    setGraficoAba(1);
                    chartScrollRef.current?.scrollTo?.({ x: chartWidth, animated: true });
                  }}
                  style={[styles.chartDot, graficoAba === 1 && styles.chartDotAtivo]}
                  accessibilityRole="button"
                  accessibilityLabel="Gráfico de Gordura Corporal"
                />
              </View>
            </View>

            {/* Carrossel 2: Medidas Antropométricas */}
            <MedidasGridCarousel avaliacoes={avaliacoes} />

            {/* Consumo Diário e Macronutrientes */}
            <ConsumoProgressoCard consumo={consumo} />
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
  safe: {
    flex: 1,
    backgroundColor: '#f8faf8'
  },
  avisoBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  avisoText: {
    color: '#006f1e',
    fontSize: 13,
    fontWeight: '600'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoImage: {
    width: 26,
    height: 26
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006f1e',
    letterSpacing: -0.5
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  iconButton: {
    padding: 6,
    borderRadius: 8
  },
  content: {
    padding: 16,
    paddingBottom: 36
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14
  },
  errorBox: {
    backgroundColor: '#fef3f2',
    borderWidth: 1,
    borderColor: '#fecdca',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginVertical: 20
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500'
  },
  btnRetry: {
    backgroundColor: '#b42318',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  btnRetryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginTop: 10
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18
  },
  btnEmptyRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#006f1e',
    backgroundColor: '#ffffff'
  },
  btnEmptyRefreshText: {
    color: '#006f1e',
    fontSize: 13,
    fontWeight: '700'
  },
  progressoGeralCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  progressoGeralTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6
  },
  progressoGeralTexto: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20
  },
  chartCarouselCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  chartTitulo: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600'
  },
  chartValorGrande: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f1f5f9'
  },
  deltaBadgeVerde: {
    backgroundColor: '#e8f5e9'
  },
  deltaBadgeVermelho: {
    backgroundColor: '#fef3f2'
  },
  deltaBadgeTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  deltaBadgeTextoVerde: {
    color: '#006f1e'
  },
  deltaBadgeTextoVermelho: {
    color: '#b42318'
  },
  chartDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1'
  },
  chartDotAtivo: {
    width: 22,
    backgroundColor: '#006f1e'
  }
});
