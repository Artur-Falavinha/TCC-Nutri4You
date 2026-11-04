import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DailyConsumption, getConsumption, markMeal } from '../../../features/dieta/consumo.service';
import { colors, spacing, radius } from '../../../theme/tokens';

export function DailyMealsCard({ onChanged }: { onChanged: () => Promise<void> }) {
  const [daily, setDaily] = useState<DailyConsumption | null>(null);
  const [selection, setSelection] = useState<{ date?: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError('');
    void getConsumption(selection.date).then(result => { if (active) setDaily(result); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar as refeições.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selection]));
  const moveDate = (delta: number) => {
    if (!daily) return;
    const value = new Date(`${daily.data}T12:00:00`);
    value.setDate(value.getDate() + delta);
    setSelection({ date: `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}` });
  };
  const toggle = async (id: number, consumed: boolean) => {
    if (!daily || !daily.editavel || saving) return;
    setSaving(true); setError('');
    try {
      setDaily(await markMeal(id, daily.data, !consumed));
      await onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar o consumo.'); }
    finally { setSaving(false); }
  };
  return <View style={styles.card} testID="daily-meals-card">
    <Text style={styles.title}>Refeições consumidas</Text>
    <View style={styles.dates}>
      <Pressable accessibilityRole="button" accessibilityLabel="Consumo do dia anterior" disabled={loading || saving} onPress={() => moveDate(-1)}><Text style={styles.action}>← Anterior</Text></Pressable>
      <Text>{daily?.data.split('-').reverse().join('/')}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao consumo de hoje" disabled={saving} onPress={() => { setSelection({}); }}><Text style={styles.action}>Hoje</Text></Pressable>
    </View>
    {loading ? <ActivityIndicator color={colors.brand} /> : <>
      {!daily?.editavel ? <Text>Histórico de consumo — somente leitura</Text> : <Text>Marque as refeições consumidas hoje.</Text>}
      {daily?.refeicoes.map(meal => <Pressable key={meal.id} accessibilityRole="checkbox"
        accessibilityLabel={`${meal.nome} ${meal.horario.slice(0, 5)}`} aria-checked={meal.consumida} accessibilityState={{ checked: meal.consumida, disabled: !daily.editavel || saving }}
        disabled={!daily.editavel || saving} onPress={() => void toggle(meal.id, meal.consumida)} style={styles.meal}>
        <Text style={styles.action}>{meal.consumida ? '☑' : '☐'} {meal.nome}</Text><Text>{meal.horario.slice(0, 5)} · {Math.round(meal.totais.kcal)} kcal</Text>
      </Pressable>)}
      {daily?.refeicoes.length === 0 ? <Text>Nenhuma refeição prevista para esta data.</Text> : null}
    </>}
    {error ? <View accessibilityRole="alert"><Text style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setSelection(current => ({ ...current }))}><Text style={styles.action}>Tentar novamente</Text></Pressable></View> : null}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.brand },
  dates: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  meal: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 4 },
  action: { color: colors.brand, fontWeight: '700' }, error: { color: '#ba1a1a' }
});
