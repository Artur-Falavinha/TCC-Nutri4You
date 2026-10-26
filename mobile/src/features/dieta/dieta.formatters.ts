import { Nutrients } from './dieta.models';

export function formatNutrient(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function formatNutrientAmount(value: number | null | undefined): string {
  return value == null ? '—' : `${formatNutrient(value)} g`;
}

export function formatGrams(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

export function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!date) {
    return '—';
  }

  const [, year, month, day] = date;
  const validDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    validDate.getUTCFullYear() !== Number(year) ||
    validDate.getUTCMonth() + 1 !== Number(month) ||
    validDate.getUTCDate() !== Number(day)
  ) {
    return '—';
  }

  return `${day}/${month}/${year}`;
}

export function formatFoodSource(source: string, version: string): string {
  const details = [source.trim(), version.trim()].filter(Boolean).join(' · ');
  return details ? `Fonte: ${details}` : 'Fonte não informada';
}

export function formatTime(value: string): string {
  const time = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!time || Number(time[1]) > 23 || Number(time[2]) > 59) {
    return value;
  }
  return `${time[1]}:${time[2]}`;
}

export function nutrientEntries(nutrients: Nutrients): { label: string; value: string }[] {
  return [
    { label: 'Energia', value: `${formatNutrient(nutrients.kcal)} kcal` },
    { label: 'Proteínas', value: `${formatNutrient(nutrients.proteinas)} g` },
    { label: 'Carboidratos', value: `${formatNutrient(nutrients.carboidratos)} g` },
    { label: 'Gorduras', value: `${formatNutrient(nutrients.gorduras)} g` },
    { label: 'Fibras', value: formatNutrientAmount(nutrients.fibras) }
  ];
}
