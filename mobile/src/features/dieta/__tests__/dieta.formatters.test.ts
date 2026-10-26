import {
  formatDate,
  formatFoodSource,
  formatGrams,
  formatNutrient,
  formatTime,
  nutrientEntries
} from '../dieta.formatters';

describe('dieta.formatters', () => {
  it('formata nutrientes com duas casas decimais e vírgula', () => {
    expect(formatNutrient(12)).toBe('12,00');
    expect(formatNutrient(1.256)).toBe('1,26');
  });

  it('formata gramas sem zeros finais desnecessários', () => {
    expect(formatGrams(150)).toBe('150');
    expect(formatGrams(125.5)).toBe('125,5');
    expect(formatGrams(0)).toBe('0');
  });

  it('formata datas civis sem deslocamento de fuso e rejeita valores inválidos', () => {
    expect(formatDate('2026-10-22')).toBe('22/10/2026');
    expect(formatDate('2026-02-30')).toBe('—');
    expect(formatDate(null)).toBe('—');
  });

  it('mostra a origem e a versão do alimento sem completar metadados ausentes', () => {
    expect(formatFoodSource('TACO', '4ª edição (2011)')).toBe('Fonte: TACO · 4ª edição (2011)');
    expect(formatFoodSource('', '')).toBe('Fonte não informada');
  });

  it('exibe horário sem segundos e preserva valores fora do formato conhecido', () => {
    expect(formatTime('08:30:00')).toBe('08:30');
    expect(formatTime('08:30')).toBe('08:30');
    expect(formatTime('25:99:00')).toBe('25:99:00');
  });

  it('mapeia energia e macronutrientes para valores legíveis', () => {
    expect(nutrientEntries({ kcal: 150, proteinas: 3, carboidratos: 24, gorduras: 2 })).toEqual([
      { label: 'Energia', value: '150,00 kcal' },
      { label: 'Proteínas', value: '3,00 g' },
      { label: 'Carboidratos', value: '24,00 g' },
      { label: 'Gorduras', value: '2,00 g' }
    ]);
  });
});
