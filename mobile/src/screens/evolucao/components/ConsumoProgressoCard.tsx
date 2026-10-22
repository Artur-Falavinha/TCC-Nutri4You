import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConsumoProgresso } from '../../../core/evolucao/evolucao.service';

interface Props {
  consumo: ConsumoProgresso | null;
}

export function ConsumoProgressoCard({ consumo }: Props) {
  if (!consumo || (!consumo.caloriasConsumidas && !consumo.proteinas && !consumo.carboidratos && !consumo.gorduras)) {
    return (
      <View style={styles.card} testID="consumo-vazio-card">
        <View style={styles.header}>
          <Text style={styles.titulo}>Consumo do dia</Text>
          <Text style={styles.badgeVazio}>Sem registros</Text>
        </View>
        <Text style={styles.descricaoVazia}>
          Nenhum registro de consumo para hoje. Acompanhe suas calorias e macronutrientes assim que suas refeições forem adicionadas.
        </Text>
      </View>
    );
  }

  const metaCal = consumo.metaCalorias && consumo.metaCalorias > 0
    ? consumo.metaCalorias
    : null;
  const percCal = metaCal
    ? Math.max(0, Math.min(100, Math.round((consumo.caloriasConsumidas / metaCal) * 100)))
    : null;
  const formatarMacro = (valor: number | null | undefined) =>
    valor == null || !Number.isFinite(valor) ? '—' : `${Math.round(valor)}g`;

  return (
    <View style={styles.card} testID="consumo-progresso-card">
      <View style={styles.header}>
        <Text style={styles.titulo}>Consumo do dia</Text>
        <Text style={styles.dataBadge}>{consumo.data}</Text>
      </View>

      {/* Calorias com barra de progresso */}
      <View style={styles.caloriasBloco}>
        <View style={styles.caloriasInfo}>
          <Text style={styles.caloriasValor}>{Math.round(consumo.caloriasConsumidas)}</Text>
          <Text style={styles.caloriasMeta}>
            {metaCal ? `/ ${Math.round(metaCal)} kcal (${percCal}%)` : 'kcal'}
          </Text>
        </View>
        <View style={styles.barraFundo}>
          <View style={[styles.barraPreenchida, { width: `${percCal ?? 0}%` }]} />
        </View>
        {!metaCal ? <Text style={styles.metaAusente}>Meta calórica ainda não definida.</Text> : null}
      </View>

      {/* Macronutrientes */}
      <View style={styles.macrosGrid}>
        <View style={styles.macroItem}>
          <Text style={styles.macroRotulo}>Proteínas</Text>
          <Text style={styles.macroValor}>{formatarMacro(consumo.proteinas)}</Text>
          {consumo.metaProteinas ? (
            <Text style={styles.macroMeta}>meta: {consumo.metaProteinas}g</Text>
          ) : null}
        </View>

        <View style={styles.macroItem}>
          <Text style={styles.macroRotulo}>Carboidratos</Text>
          <Text style={styles.macroValor}>{formatarMacro(consumo.carboidratos)}</Text>
          {consumo.metaCarboidratos ? (
            <Text style={styles.macroMeta}>meta: {consumo.metaCarboidratos}g</Text>
          ) : null}
        </View>

        <View style={styles.macroItem}>
          <Text style={styles.macroRotulo}>Gorduras</Text>
          <Text style={styles.macroValor}>{formatarMacro(consumo.gorduras)}</Text>
          {consumo.metaGorduras ? (
            <Text style={styles.macroMeta}>meta: {consumo.metaGorduras}g</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  badgeVazio: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999
  },
  dataBadge: {
    fontSize: 12,
    color: '#006f1e',
    fontWeight: '600'
  },
  descricaoVazia: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18
  },
  caloriasBloco: {
    marginBottom: 16
  },
  caloriasInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6
  },
  caloriasValor: {
    fontSize: 24,
    fontWeight: '700',
    color: '#006f1e'
  },
  caloriasMeta: {
    fontSize: 13,
    color: '#64748b'
  },
  barraFundo: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden'
  },
  barraPreenchida: {
    height: '100%',
    backgroundColor: '#006f1e',
    borderRadius: 4
  },
  metaAusente: {
    marginTop: 6,
    fontSize: 11,
    color: '#64748b'
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  macroItem: {
    flex: 1,
    alignItems: 'center'
  },
  macroRotulo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2
  },
  macroValor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  macroMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2
  }
});

