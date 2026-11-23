import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';

const ETAPAS = ['Nutricionista', 'Data e horário', 'Solicitação'] as const;

export function AppointmentSteps({ atual }: { atual: 1 | 2 | 3 }) {
  return (
    <View style={styles.etapas} accessible accessibilityLabel={`Etapa ${atual} de 3. ${ETAPAS[atual - 1]}`}>
      {ETAPAS.map((etapa, indice) => {
        const numero = indice + 1;
        const ativa = atual === numero;
        const concluida = atual > numero;
        return (
          <View key={etapa} style={[styles.etapa, ativa && styles.etapaAtiva]} aria-current={ativa ? 'step' : undefined}>
            <View style={[styles.numero, ativa && styles.numeroAtivo, concluida && styles.numeroConcluido]}>
              {concluida
                ? <Feather name="check" size={14} color={colors.brandDark} aria-hidden />
                : <Text style={[styles.rotuloNumero, ativa && styles.rotuloAtivo]}>{numero}</Text>}
            </View>
            <Text style={[styles.rotulo, ativa && styles.rotuloEtapaAtiva]}>{etapa}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  etapas: { flexDirection: 'row', gap: spacing.xxs, backgroundColor: colors.subtle, borderRadius: radius.md, padding: spacing.xxs },
  etapa: { flex: 1, alignItems: 'center', gap: spacing.xxs, paddingVertical: spacing.xs, borderRadius: radius.sm },
  etapaAtiva: { backgroundColor: colors.card },
  numero: {
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.border
  },
  numeroAtivo: { backgroundColor: colors.brand },
  numeroConcluido: { backgroundColor: colors.brandSoft },
  rotuloNumero: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 12 },
  rotuloAtivo: { color: colors.white },
  rotulo: { color: colors.text, fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  rotuloEtapaAtiva: { color: colors.brandDeep, fontFamily: fontFamily.extrabold }
});
