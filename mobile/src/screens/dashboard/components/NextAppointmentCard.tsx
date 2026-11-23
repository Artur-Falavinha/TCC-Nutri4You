import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatarDataHoraConsulta } from '../../../core/evolucao/evolucao.service';
import { SectionCardHeader, sectionCardStyles } from '../../../components/layout/SectionCardHeader';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';

type Props = {
  dataHora?: string;
  abrirAgenda: () => void;
};

export function NextAppointmentCard({ dataHora, abrirAgenda }: Props) {
  const texto = dataHora ? formatarDataHoraConsulta(dataHora) : 'Nenhuma consulta agendada';

  return (
    <Pressable
      style={({ pressed }) => [sectionCardStyles.superficie, pressed && estilos.pressionado]}
      onPress={abrirAgenda}
      accessibilityRole="button"
      accessibilityLabel={`Próxima consulta: ${texto}`}
      accessibilityHint="Abre a agenda"
      testID="dashboard-proxima-consulta-card"
    >
      <SectionCardHeader titulo="Próxima consulta" icone="calendar" />
      <View style={[estilos.resumo, dataHora && estilos.resumoAgendado]}>
        <Text style={[estilos.data, dataHora && estilos.dataAgendada]} testID="dashboard-proxima-consulta-texto">
          {texto}
        </Text>
        <View style={estilos.seta} aria-hidden>
          <Feather name="chevron-right" color={colors.brandDark} size={18} />
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pressionado: { backgroundColor: colors.page },
  resumo: {
    backgroundColor: colors.subtle,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  resumoAgendado: { backgroundColor: colors.confirmedBackground },
  data: { flex: 1, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21 },
  dataAgendada: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 16, fontVariant: ['tabular-nums'] },
  seta: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
