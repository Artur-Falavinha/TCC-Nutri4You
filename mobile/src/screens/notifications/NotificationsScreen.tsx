import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
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

import { AppHeader } from '../../components/layout/AppHeader';
import { SideMenu } from '../../components/navigation/SideMenu';
import { sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { formatarDataHoraCivil } from '../../core/utils/date-mask.util';
import { useNotificacoes } from '../../features/notificacoes/NotificacoesProvider';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Notificacoes'>;

export function NotificationsScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [menuVisivel, setMenuVisivel] = useState(false);
  const { avisos, lembretes, nome, carregando, atualizando, erro, carregar } = useNotificacoes();
  const larguraMaxima = width >= 640 ? 760 : 560;
  const margemCompacta = width < 420 && styles.margemCompacta;
  const pronto = !carregando && !erro;
  const abrirAgenda = () => navigation.navigate('Agenda');

  return (
    <SafeAreaView style={styles.areaSegura} edges={['left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisivel(true)} exibirNotificacoes={false} />
      <SideMenu
        visible={menuVisivel}
        activeItem="notifications"
        userName={nome || 'Paciente'}
        onClose={() => setMenuVisivel(false)}
      />

      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={[styles.conteudo, margemCompacta, { maxWidth: larguraMaxima }]}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => void carregar('gesto')}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        <View style={styles.introducao}>
          <Text style={styles.titulo} accessibilityRole="header" aria-level={1}>Notificações</Text>
          <Text style={styles.subtitulo}>Atualizações e lembretes das suas consultas</Text>
        </View>

        {carregando ? (
          <View style={[sectionCardStyles.superficie, styles.estado]} aria-live="polite">
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.texto, styles.centralizado]}>Carregando notificações</Text>
          </View>
        ) : null}

        {!carregando && erro ? (
          <View style={sectionCardStyles.superficie}>
            <View style={styles.linha}>
              <View style={[styles.icone, styles.iconeErro]} aria-hidden>
                <Feather name="alert-circle" size={22} color={colors.dangerText} />
              </View>
              <Text style={[styles.texto, styles.identidade]} accessibilityRole="alert">{erro}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.tentarNovamente, pressed && styles.pressionado]}
              onPress={() => void carregar('abertura')}
              accessibilityRole="button"
            >
              <Feather name="refresh-cw" size={18} color={colors.brandDark} aria-hidden />
              <Text style={styles.acaoTexto}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {pronto && avisos.length === 0 && lembretes.length === 0 ? (
          <View style={[sectionCardStyles.superficie, styles.estado]}>
            <View style={[styles.icone, styles.iconeVazio]} aria-hidden>
              <Feather name="bell" size={24} color={colors.brandDark} />
            </View>
            <View style={styles.identidade}>
              <Text style={[styles.tituloCartao, styles.centralizado]} accessibilityRole="header" aria-level={2}>
                Tudo em dia
              </Text>
              <Text style={[styles.texto, styles.centralizado]}>As atualizações e os lembretes das suas consultas aparecem aqui.</Text>
            </View>
          </View>
        ) : null}

        {pronto && avisos.length > 0 ? <Text style={styles.tituloCartao} accessibilityRole="header" aria-level={2}>Atualizações recentes</Text> : null}
        {pronto ? avisos.map(({ id, tipo, dataHora }) => (
          <CartaoNotificacao key={'aviso:' + id} tipo={tipo} dataHora={dataHora} onAbrirAgenda={abrirAgenda} />
        )) : null}
        {pronto && lembretes.length > 0 ? <Text style={styles.tituloCartao} accessibilityRole="header" aria-level={2}>Lembretes</Text> : null}
        {pronto ? lembretes.map(({ id, status, dataHora }) => (
          <CartaoNotificacao key={'lembrete:' + id}
            tipo={status === 'CONFIRMADA' || status === 'RECUSADA' ? status : 'AGUARDANDO_CONFIRMACAO'}
            dataHora={dataHora} onAbrirAgenda={abrirAgenda} />
        )) : null}
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
  REAGENDADA: {
    titulo: 'Consulta reagendada',
    icone: 'calendar',
    cor: colors.brandDark,
    fundo: colors.confirmedBackground,
    detalhe: 'O nutricionista confirmou esse novo horário.'
  },
  CANCELADA: {
    titulo: 'Consulta cancelada',
    icone: 'slash',
    cor: colors.dangerText,
    fundo: colors.dangerButtonBackground,
    detalhe: 'Esse horário foi removido da sua agenda.'
  },
  AGUARDANDO_CONFIRMACAO: {
    titulo: 'Consulta aguardando confirmação',
    icone: 'clock',
    cor: colors.pending,
    fundo: colors.pendingBackground,
    detalhe: ''
  }
} as const;

type CartaoProps = { tipo: keyof typeof apresentacoes; dataHora: string; onAbrirAgenda: () => void };

function CartaoNotificacao({ tipo, dataHora, onAbrirAgenda }: CartaoProps) {
  const apresentacao = apresentacoes[tipo];
  const data = formatarDataHoraCivil(dataHora);
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


const styles = StyleSheet.create({
  areaSegura: { flex: 1, backgroundColor: colors.page },
  introducao: { gap: spacing.xs },
  titulo: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 30, lineHeight: 38 },
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
  }
});
