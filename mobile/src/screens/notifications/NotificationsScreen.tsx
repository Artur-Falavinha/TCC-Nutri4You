import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { formatarDataHoraCivil, FUSO_HORARIO_CLINICA } from '../../core/utils/date-mask.util';
import { listAppointments } from '../../features/appointments/appointments.service';
import { Appointment } from '../../features/appointments/appointments.models';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Notificacoes'>;

const relogioDaClinica = new Intl.DateTimeFormat('en', {
  timeZone: FUSO_HORARIO_CLINICA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

export function NotificationsScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [agoraNaClinica, setAgoraNaClinica] = useState(0);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setAppointments((await listAppointments()) ?? []);
      setAgoraNaClinica(horarioCivilDaClinica(new Date(Date.now())));
    } catch {
      setError('Não foi possível carregar seus lembretes. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const notificacoes = useMemo(() => appointments
    .filter((item) => item.status === 'RECUSADA'
      || (['AGUARDANDO_CONFIRMACAO', 'CONFIRMADA'].includes(item.status)
        && horarioCivilEmMilissegundos(item.dataHora) >= agoraNaClinica))
    .sort((a, b) => a.status === 'RECUSADA' && b.status !== 'RECUSADA' ? -1
      : b.status === 'RECUSADA' && a.status !== 'RECUSADA' ? 1
        : a.dataHora.localeCompare(b.dataHora)), [appointments, agoraNaClinica]);

  const voltar = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Dashboard');
    }
  };

  const larguraMaxima = width >= 640 ? 760 : 560;
  const margemCompacta = width < 420 && styles.margemCompacta;

  return (
    <SafeAreaView style={styles.areaSegura} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.barra}>
        <View style={[styles.cabecalho, margemCompacta, { maxWidth: larguraMaxima }]}>
          <Pressable
            onPress={voltar}
            style={({ pressed }) => [styles.voltar, pressed && styles.pressionado]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Feather name="arrow-left" size={22} color={colors.brandDeep} aria-hidden />
          </Pressable>
          <Text style={styles.titulo} accessibilityRole="header" aria-level={1}>Notificações</Text>
        </View>
      </View>

      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={[styles.conteudo, margemCompacta, { maxWidth: larguraMaxima }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        <Text style={styles.subtitulo}>Atualizações e lembretes das suas consultas</Text>

        {loading ? (
          <View style={[sectionCardStyles.superficie, styles.estado]} aria-live="polite">
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.texto, styles.centralizado]}>Carregando notificações</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={sectionCardStyles.superficie}>
            <View style={styles.linha}>
              <View style={[styles.icone, styles.iconeErro]} aria-hidden>
                <Feather name="alert-circle" size={22} color={colors.dangerText} />
              </View>
              <Text style={[styles.texto, styles.identidade]} accessibilityRole="alert">{error}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.tentarNovamente, pressed && styles.pressionado]}
              onPress={() => void load()}
              accessibilityRole="button"
            >
              <Feather name="refresh-cw" size={18} color={colors.brandDark} aria-hidden />
              <Text style={styles.acaoTexto}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && notificacoes.length === 0 ? (
          <View style={[sectionCardStyles.superficie, styles.estado]}>
            <View style={[styles.icone, styles.iconeVazio]} aria-hidden>
              <Feather name="bell" size={24} color={colors.brandDark} />
            </View>
            <View style={styles.identidade}>
              <Text style={[styles.tituloCartao, styles.centralizado]} accessibilityRole="header" aria-level={2}>
                Tudo em dia
              </Text>
              <Text style={[styles.texto, styles.centralizado]}>Você não tem consultas futuras para lembrar.</Text>
            </View>
          </View>
        ) : null}

        {!loading && !error ? notificacoes.map((consulta) => (
          <CartaoNotificacao key={consulta.id} consulta={consulta} onAbrirAgenda={() => navigation.navigate('Agenda')} />
        )) : null}

        <View style={styles.rodape}>
          <Feather name="info" size={16} color={colors.textSecondary} aria-hidden />
          <Text style={[styles.texto, styles.legenda]}>
            Os lembretes são baseados nas consultas vinculadas à sua conta.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const apresentacoes = {
  RECUSADA: {
    titulo: 'Consulta recusada',
    icone: 'x-circle',
    cor: colors.dangerText,
    fundo: colors.dangerButtonBackground,
    detalhe: 'O nutricionista não pôde aceitar este horário. Escolha uma nova data na agenda.'
  },
  CONFIRMADA: {
    titulo: 'Consulta confirmada',
    icone: 'check-circle',
    cor: colors.brandDark,
    fundo: colors.confirmedBackground,
    detalhe: ''
  },
  AGUARDANDO_CONFIRMACAO: {
    titulo: 'Consulta aguardando confirmação',
    icone: 'clock',
    cor: colors.pending,
    fundo: colors.pendingBackground,
    detalhe: ''
  }
} as const;

type CartaoProps = { consulta: Appointment; onAbrirAgenda: () => void };

function CartaoNotificacao({ consulta, onAbrirAgenda }: CartaoProps) {
  const apresentacao = consulta.status === 'RECUSADA' || consulta.status === 'CONFIRMADA'
    ? apresentacoes[consulta.status]
    : apresentacoes.AGUARDANDO_CONFIRMACAO;
  const data = formatarDataHoraCivil(consulta.dataHora);
  const rotulo = [apresentacao.titulo, data, apresentacao.detalhe, 'Abrir agenda'].filter(Boolean).join('. ');

  return (
    <Pressable
      style={({ pressed }) => [sectionCardStyles.superficie, pressed && styles.pressionado]}
      onPress={onAbrirAgenda}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
    >
      <View style={styles.linha}>
        <View style={[styles.icone, { backgroundColor: apresentacao.fundo }]} aria-hidden>
          <Feather name={apresentacao.icone} color={apresentacao.cor} size={22} />
        </View>
        <View style={styles.identidade}>
          <Text style={styles.tituloCartao}>{apresentacao.titulo}</Text>
          <Text style={styles.data}>{data}</Text>
        </View>
      </View>
      {apresentacao.detalhe ? <Text style={styles.texto}>{apresentacao.detalhe}</Text> : null}
      <View style={styles.acaoCartao}>
        <Text style={styles.acaoTexto}>Ver agenda</Text>
        <Feather name="arrow-right" size={18} color={colors.brandDark} aria-hidden />
      </View>
    </Pressable>
  );
}


// A API envia horário civil da clínica sem offset. A escala UTC mantém esses campos
// na comparação e na exibição, independentemente do fuso do dispositivo.
function horarioCivilEmMilissegundos(dataHora: string): number {
  return Date.parse(dataHora + 'Z');
}

function horarioCivilDaClinica(agora: Date): number {
  const { year, month, day, hour, minute, second } = Object.fromEntries(
    relogioDaClinica.formatToParts(agora).map(({ type, value }) => [type, value])
  );
  return Date.UTC(
    Number(year), Number(month) - 1, Number(day),
    Number(hour), Number(minute), Number(second), agora.getUTCMilliseconds()
  );
}

const styles = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: colors.card },
  barra: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  cabecalho: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs
  },
  voltar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
    borderRadius: radius.md
  },
  titulo: { flex: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 24, lineHeight: 32 },
  pressionado: { opacity: 0.75 },
  rolagem: { flex: 1, backgroundColor: colors.page },
  conteudo: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md
  },
  margemCompacta: { paddingHorizontal: spacing.sm },
  subtitulo: { color: colors.text, fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 22 },
  estado: { alignItems: 'center', paddingVertical: spacing.xl },
  centralizado: { textAlign: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icone: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  iconeVazio: { width: 56, height: 56, backgroundColor: colors.confirmedBackground },
  iconeErro: { backgroundColor: colors.dangerButtonBackground },
  identidade: { flexShrink: 1, gap: spacing.xxs },
  tituloCartao: { color: colors.text, fontFamily: fontFamily.extrabold, fontSize: 16, lineHeight: 23 },
  data: { color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21 },
  texto: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  acaoCartao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  acaoTexto: { flexShrink: 1, color: colors.brandDark, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 21 },
  tentarNovamente: {
    minHeight: 48,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.confirmedBackground
  },
  rodape: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start', paddingHorizontal: spacing.xs },
  legenda: { flex: 1, fontSize: 13, lineHeight: 19 }
});
