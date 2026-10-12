import { Pressable, StyleSheet, Text, View } from 'react-native';

import CalendarMonthIcon from '../../../assets/appointments/calendar-month.svg';
import { colors, fontFamily, radius, shadows, spacing } from '../../../theme/tokens';
import {
  buildCalendarDays,
  fromDateKey,
  isPastDate,
  monthTitle
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
  const selected = fromDateKey(selectedDate);
  const days = buildCalendarDays(selected);

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Agendamento</Text>
        <View style={styles.monthRow}>
          <Text style={styles.month}>{monthTitle(selected)}</Text>
          <CalendarMonthIcon />
        </View>
      </View>

      <View style={styles.calendar}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((weekday) => (
            <Text key={weekday} style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {days.map((item) => {
            if (!item.dateKey) {
              return <View key={item.key} style={styles.dayCell} />;
            }
            const isSelected = item.dateKey === selectedDate;
            const hasAppointment = appointmentDates.has(item.dateKey);
            const disabled = isPastDate(item.dateKey);
            const highlighted = isSelected || hasAppointment;
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
                <View style={[styles.dayBadge, highlighted && styles.highlightedDay]}>
                  <Text
                    style={[
                      styles.dayText,
                      highlighted && styles.highlightedDayText,
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  month: {
    color: colors.brandDark,
    fontFamily: fontFamily.bold,
    fontSize: 14,
    lineHeight: 20
  },
  calendar: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.card
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  weekday: {
    width: `${100 / 7}%`,
    color: colors.textSubtle,
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    textAlign: 'center'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayCell: {
    width: `${100 / 7}%`,
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
  highlightedDay: {
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
  highlightedDayText: {
    color: colors.white,
    fontFamily: fontFamily.bold
  },
  disabledDayText: {
    color: '#cbd5e1'
  }
});
