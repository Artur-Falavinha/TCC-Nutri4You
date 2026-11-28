import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AvatarFoto } from '../../../components/layout/AvatarFoto';
import { SectionCardHeader, sectionCardStyles } from '../../../components/layout/SectionCardHeader';
import { formatarDataCivil } from '../../../core/utils/date-mask.util';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';
import { timeRangeLabel } from '../appointments-date.util';
import { Appointment } from '../appointments.models';

interface Props {
  consulta: Appointment;
  reagendamento: boolean;
  duracao: number;
  foto: string | null;
}

export function AppointmentRequestReceipt({ consulta, reagendamento, duracao, foto }: Props) {
  const pendente = consulta.status === 'AGUARDANDO_CONFIRMACAO';
  const vinculoPendente = pendente && consulta.avulsa;
  const status = pendente ? 'Consulta aguardando confirmação'
    : consulta.status === 'CONFIRMADA' ? 'Consulta confirmada' : 'Confira o status na Agenda';
  return (
    <View style={sectionCardStyles.superficie} testID="agenda-comprovante">
      <SectionCardHeader icone="send" titulo={reagendamento ? 'Reagendamento solicitado' : 'Solicitação enviada'} />
      <View style={styles.resumo}>
        <AvatarFoto foto={foto} tamanho={40} />
        <View style={styles.textos}>
          <Text style={styles.nome}>{consulta.nutricionistaNome}</Text>
          <Text style={styles.horario}>
            {formatarDataCivil(consulta.dataHora)} · {timeRangeLabel(consulta.dataHora, duracao)}
          </Text>
        </View>
      </View>
      <View style={styles.status} accessibilityLiveRegion="polite" aria-live="polite">
        <Feather name={pendente ? 'clock' : 'check-circle'} size={20} color={colors.pending} aria-hidden />
        <View style={styles.textos}>
          <Text style={styles.statusTitulo}>{status}</Text>
          {vinculoPendente ? (
            <>
              <Text style={styles.statusTitulo}>Vínculo pendente</Text>
              <Text style={styles.descricao}>
                Quando o nutricionista aceitar a primeira consulta, o horário será confirmado e o vínculo será criado.
              </Text>
            </>
          ) : pendente && (
            <Text style={styles.descricao}>O horário será confirmado quando o nutricionista aceitar a solicitação.</Text>
          )}
        </View>
      </View>
      {reagendamento && (
        <Text style={styles.descricao}>Se adicionou a consulta ao Google Agenda, atualize o evento manualmente.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resumo: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm,
    backgroundColor: colors.subtle, borderRadius: radius.md
  },
  nome: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 17, lineHeight: 24 },
  horario: { color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21, fontVariant: ['tabular-nums'] },
  status: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm,
    backgroundColor: colors.pendingBackground, borderRadius: radius.md },
  textos: { flex: 1, gap: spacing.xxs },
  statusTitulo: { color: colors.pending, fontFamily: fontFamily.extrabold, fontSize: 15, lineHeight: 22 },
  descricao: { color: colors.text, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 }
});
