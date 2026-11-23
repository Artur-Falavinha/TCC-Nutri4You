import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionCardHeader, sectionCardStyles } from '../../../components/layout/SectionCardHeader';
import { dataIsoDaClinica, formatarDataCivil } from '../../../core/utils/date-mask.util';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';
import {
  buildCalendarDays,
  fromDateKey,
  isAppointmentDateSelectable,
  monthTitle,
  shiftMonthKey
} from '../appointments-date.util';

const DIAS_DA_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

interface CalendarCardProps {
  selectedDate?: string;
  appointmentDates?: Set<string>;
  onSelectDate: (dateKey: string) => void;
}

export function CalendarCard({ selectedDate, appointmentDates, onSelectDate }: CalendarCardProps) {
  const dataAtual = dataIsoDaClinica();
  const mesAtual = dataAtual.slice(0, 7);
  const [chaveMes, setChaveMes] = useState(() => selectedDate?.slice(0, 7) ?? mesAtual);
  const mes = useMemo(() => fromDateKey(`${chaveMes}-01`), [chaveMes]);
  const dias = useMemo(() => buildCalendarDays(mes), [mes]);
  const semanas = Array.from({ length: dias.length / 7 }, (_, indice) => dias.slice(indice * 7, indice * 7 + 7));
  const permiteVoltarMes = chaveMes > mesAtual;
  const temConsultaNoMes = dias.some(({ dateKey }) => !!dateKey && appointmentDates?.has(dateKey));

  const mudarMes = (intervalo: number) => {
    const proximoMes = shiftMonthKey(chaveMes, intervalo);
    if (proximoMes >= mesAtual) setChaveMes(proximoMes);
  };

  return (
    <View style={sectionCardStyles.superficie}>
      <SectionCardHeader titulo="Escolha a data" icone="calendar" />
      <Text style={styles.instrucao}>Toque em um dia para consultar os horários.</Text>

      <View style={styles.navegacao}>
        <Pressable
          style={({ pressed }) => [
            styles.botaoMes,
            !permiteVoltarMes && styles.botaoDesabilitado,
            pressed && styles.pressionado
          ]}
          onPress={() => mudarMes(-1)}
          disabled={!permiteVoltarMes}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
        >
          <Feather name="chevron-left" size={20} color={colors.brandDark} aria-hidden />
        </Pressable>
        <Text style={styles.mes} aria-live="polite" accessibilityLiveRegion="polite">{monthTitle(mes)}</Text>
        <Pressable
          style={({ pressed }) => [styles.botaoMes, pressed && styles.pressionado]}
          onPress={() => mudarMes(1)}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
        >
          <Feather name="chevron-right" size={20} color={colors.brandDark} aria-hidden />
        </Pressable>
      </View>

      <View style={styles.calendario}>
        <View style={styles.linha}>
          {DIAS_DA_SEMANA.map((dia) => (
            <Text key={dia} style={styles.diaSemana}>{dia}</Text>
          ))}
        </View>

        {semanas.map((semana, indice) => (
          <View key={indice} style={styles.linha}>
            {semana.map(({ key, dateKey, day }) => {
              if (!dateKey) return <View key={key} style={styles.celula} />;

              const selecionado = dateKey === selectedDate;
              const temConsulta = appointmentDates?.has(dateKey);
              const desabilitado = !isAppointmentDateSelectable(dateKey, dataAtual);
              return (
                <Pressable
                  key={key}
                  style={styles.celula}
                  onPress={() => onSelectDate(dateKey)}
                  disabled={desabilitado}
                  accessibilityRole="button"
                  accessibilityLabel={`Dia ${formatarDataCivil(dateKey)}${temConsulta ? ', com consulta' : ''}`}
                  accessibilityState={{ selected: selecionado, disabled: desabilitado }}
                >
                  {({ pressed }) => (
                    <View style={[
                      styles.data,
                      (temConsulta || pressed) && styles.pressionado,
                      selecionado && styles.diaSelecionado
                    ]}>
                      <Text style={[
                        styles.numero,
                        desabilitado && styles.numeroDesabilitado,
                        selecionado && styles.numeroSelecionado
                      ]}>{day}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}

        {temConsultaNoMes && (
          <View style={styles.legenda}>
            <View style={[styles.marcador, styles.pressionado]} aria-hidden />
            <Text style={styles.instrucao}>Dia com consulta</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  instrucao: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  navegacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.subtle,
    borderRadius: radius.md,
    padding: spacing.xxs
  },
  botaoMes: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.sm
  },
  botaoDesabilitado: { opacity: 0.42 },
  pressionado: { backgroundColor: colors.brandSoft },
  mes: {
    flex: 1,
    textAlign: 'center',
    color: colors.brandDeep,
    fontFamily: fontFamily.extrabold,
    fontSize: 15,
    lineHeight: 22
  },
  calendario: { gap: spacing.xxs },
  linha: { flexDirection: 'row', alignItems: 'center' },
  diaSemana: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center'
  },
  celula: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  data: { minWidth: 29, minHeight: 30, maxWidth: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  diaSelecionado: { backgroundColor: colors.brand },
  numero: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  numeroSelecionado: { color: colors.white },
  numeroDesabilitado: { color: colors.textSubtle, fontFamily: fontFamily.regular },
  legenda: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xs },
  marcador: { width: 12, height: 12, borderRadius: radius.pill }
});
