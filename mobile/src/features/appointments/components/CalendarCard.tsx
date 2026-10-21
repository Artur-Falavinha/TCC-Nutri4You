import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import CalendarMonthIcon from '../../../assets/appointments/calendar-month.svg';
import { colors, fontFamily, radius, shadows, spacing } from '../../../theme/tokens';
import {
  buildCalendarDays,
  fromDateKey,
  isAppointmentDateSelectable,
  monthTitle,
  shiftMonthKey,
  toDateKey
} from '../appointments-date.util';

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

interface CalendarCardProps {
  selectedDate: string;
  appointmentDates: Set<string>;
  onSelectDate: (dateKey: string) => void;
}

export function CalendarCard({
  selectedDate,
  appointmentDates,
  onSelectDate
}: CalendarCardProps) {
  const currentMonthKey = toDateKey(new Date()).slice(0, 7);
  const [visibleMonthKey, setVisibleMonthKey] = useState(currentMonthKey);
  const visibleMonth = useMemo(
    () => fromDateKey(`${visibleMonthKey}-01`),
    [visibleMonthKey]
  );
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const weeks = useMemo(
    () => Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    [days]
  );
  const canGoToPreviousMonth = visibleMonthKey > currentMonthKey;

  const changeMonth = (amount: number) => {
    const nextMonthKey = shiftMonthKey(visibleMonthKey, amount);
    if (nextMonthKey >= currentMonthKey) {
      setVisibleMonthKey(nextMonthKey);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Agendamento</Text>
        <View style={styles.monthControls}>
          <Pressable
            style={({ pressed }) => [
              styles.monthNavigationButton,
              !canGoToPreviousMonth && styles.monthNavigationButtonDisabled,
              pressed && canGoToPreviousMonth && styles.pressed
            ]}
            onPress={() => changeMonth(-1)}
            disabled={!canGoToPreviousMonth}
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
            accessibilityState={{ disabled: !canGoToPreviousMonth }}
          >
            <Text style={styles.monthNavigationText}>‹</Text>
          </Pressable>
          <View style={styles.monthRow}>
            <Text style={styles.month}>{monthTitle(visibleMonth)}</Text>
            <CalendarMonthIcon />
          </View>
          <Pressable
            style={({ pressed }) => [styles.monthNavigationButton, pressed && styles.pressed]}
            onPress={() => changeMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
          >
            <Text style={styles.monthNavigationText}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.calendar}>
        <View style={styles.weekHeaderRow}>
          {WEEKDAYS.map((weekday) => (
            <Text key={weekday} style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.calendarWeek}>
              {week.map((item) => {
                if (!item.dateKey) {
                  return <View key={item.key} style={styles.dayCell} />;
                }
                const isSelected = item.dateKey === selectedDate;
                const hasAppointment = appointmentDates.has(item.dateKey);
                const disabled = !isAppointmentDateSelectable(item.dateKey);
                return (
                  <Pressable
                    key={item.key}
                    style={styles.dayCell}
                    onPress={() => onSelectDate(item.dateKey as string)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={`Dia ${item.day}`}
                    accessibilityState={{ selected: isSelected, disabled }}
                  >
                    <View
                      style={[
                        styles.dayBadge,
                        hasAppointment && styles.appointmentDay,
                        isSelected && styles.selectedDay
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          hasAppointment && styles.appointmentDayText,
                          isSelected && styles.selectedDayText,
                          disabled && styles.disabledDayText
                        ]}
                      >
                        {item.day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.xl,
    ...shadows.card
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: -0.45
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  monthNavigationButton: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm
  },
  monthNavigationButtonDisabled: {
    opacity: 0.28
  },
  monthNavigationText: {
    color: colors.brandDark,
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 28
  },
  month: {
    color: colors.brandDark,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20
  },
  pressed: {
    opacity: 0.7
  },
  calendar: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.card
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  weekday: {
    flex: 1,
    color: colors.textSubtle,
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    textAlign: 'center'
  },
  grid: {
    width: '100%'
  },
  calendarWeek: {
    width: '100%',
    flexDirection: 'row'
  },
  dayCell: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayBadge: {
    minWidth: 38,
    height: 22,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm
  },
  appointmentDay: {
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brand
  },
  selectedDay: {
    backgroundColor: colors.brandDark,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4
  },
  dayText: {
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  appointmentDayText: {
    color: colors.brandDark,
    fontFamily: fontFamily.bold
  },
  selectedDayText: {
    color: colors.white,
    fontFamily: fontFamily.bold
  },
  disabledDayText: {
    color: '#cbd5e1'
  }
});
