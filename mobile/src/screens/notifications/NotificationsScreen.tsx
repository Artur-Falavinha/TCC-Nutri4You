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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listAppointments } from '../../features/appointments/appointments.service';
import { Appointment } from '../../features/appointments/appointments.models';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Notificacoes'>;

export function NotificationsScreen({ navigation }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [agora, setAgora] = useState(0);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setAppointments((await listAppointments()) ?? []);
      setAgora(Date.now());
    } catch {
      setError('Não foi possível carregar seus lembretes. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const lembretes = useMemo(() => appointments
    .filter((item) => ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADA'].includes(item.status)
      && new Date(item.dataHora).getTime() >= agora)
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora)), [appointments, agora]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}
          accessibilityRole="button" accessibilityLabel="Voltar">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Notificações</Text>
        <View style={styles.backSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <Text style={styles.subtitle}>Lembretes das suas consultas</Text>
        {loading ? <ActivityIndicator color={colors.brand} accessibilityLabel="Carregando notificações" /> : null}
        {!loading && error ? (
          <View style={styles.card}>
            <Text style={styles.body} accessibilityRole="alert">{error}</Text>
            <Pressable onPress={() => void load()} accessibilityRole="button"><Text style={styles.link}>Tentar novamente</Text></Pressable>
          </View>
        ) : null}
        {!loading && !error && lembretes.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>Tudo em dia</Text>
            <Text style={styles.body}>Você não tem consultas futuras para lembrar.</Text>
          </View>
        ) : null}
        {!loading && !error ? lembretes.map((item) => (
          <Pressable key={item.id} style={styles.card} onPress={() => navigation.navigate('Agenda')}
            accessibilityRole="button" accessibilityLabel={`Consulta ${formatarData(item.dataHora)}. Abrir agenda`}>
            <View style={styles.row}>
              <View style={styles.dot} />
              <Text style={styles.cardTitle}>Consulta {item.status === 'CONFIRMADA' ? 'confirmada' : 'aguardando confirmação'}</Text>
            </View>
            <Text style={styles.body}>{formatarData(item.dataHora)}</Text>
            <Text style={styles.link}>Ver agenda</Text>
          </Pressable>
        )) : null}
        <Text style={styles.caption}>Os lembretes são baseados nas consultas vinculadas à sua conta.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatarData(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  header: { minHeight: 56, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 40, height: 40, justifyContent: 'center' },
  backText: { color: colors.brandDeep, fontSize: 36, lineHeight: 40 },
  backSpacer: { width: 40 },
  title: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 18 },
  content: { padding: spacing.lg, gap: spacing.md },
  subtitle: { color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 15, marginBottom: spacing.xs },
  card: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.brand },
  cardTitle: { flex: 1, color: colors.text, fontFamily: fontFamily.bold, fontSize: 15 },
  emptyTitle: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 16 },
  body: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  link: { color: colors.brand, fontFamily: fontFamily.semibold, fontSize: 14, paddingTop: spacing.xs },
  caption: { color: colors.textSubtle, fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.sm }
});
