import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

export interface ChartDataPoint {
  label: string;
  value: number;
  formatted?: string;
}

interface Props {
  data: ChartDataPoint[];
  unidade?: string;
  cor?: string;
  height?: number;
}

export function EvolucaoLineChart({
  data,
  unidade = '',
  cor = '#006f1e',
  height = 140
}: Props) {
  const [containerWidth, setContainerWidth] = useState(300);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - containerWidth) > 2) {
      setContainerWidth(width);
    }
  };

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Sem dados suficientes para o gráfico.</Text>
      </View>
    );
  }

  const activeIndex = selectedIdx !== null && selectedIdx >= 0 && selectedIdx < data.length
    ? selectedIdx
    : data.length - 1;

  const paddingHorizontal = 28;
  const paddingTop = 32;
  const paddingBottom = 26;
  const chartWidth = Math.max(containerWidth - paddingHorizontal * 2, 80);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 40);

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valSpan = maxVal - minVal;

  const effectiveSpan = valSpan === 0 ? Math.max(maxVal * 0.2, 1) : valSpan;
  const baselineMin = valSpan === 0 ? minVal - effectiveSpan / 2 : minVal - effectiveSpan * 0.15;
  const baselineSpan = valSpan === 0 ? effectiveSpan : effectiveSpan * 1.3;

  const points = data.map((item, idx) => {
    const x = data.length === 1
      ? containerWidth / 2
      : paddingHorizontal + (idx / (data.length - 1)) * chartWidth;
    const yRatio = baselineSpan > 0 ? (item.value - baselineMin) / baselineSpan : 0.5;
    const y = paddingTop + chartHeight - Math.max(0, Math.min(1, yRatio)) * chartHeight;
    return { x, y, item, idx };
  });

  const activePoint = points[activeIndex] || points[points.length - 1];

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout} testID="evolucao-line-chart">
      {/* Background horizontal guide lines */}
      <View style={[styles.guideLine, { top: paddingTop }]} />
      <View style={[styles.guideLine, { top: paddingTop + chartHeight / 2 }]} />
      <View style={[styles.guideLine, { top: paddingTop + chartHeight }]} />

      {/* Area fills under segments */}
      {points.length > 1 &&
        points.slice(0, points.length - 1).map((p1, idx) => {
          const p2 = points[idx + 1];
          const sliceWidth = p2.x - p1.x;
          const avgY = (p1.y + p2.y) / 2;
          const sliceHeight = paddingTop + chartHeight - avgY;
          return (
            <View
              key={`fill-${idx}`}
              style={[
                styles.areaSlice,
                {
                  left: p1.x,
                  top: avgY,
                  width: sliceWidth,
                  height: Math.max(0, sliceHeight),
                  backgroundColor: `${cor}15`
                }
              ]}
            />
          );
        })}

      {/* Connected line segments */}
      {points.length > 1 &&
        points.slice(0, points.length - 1).map((p1, idx) => {
          const p2 = points[idx + 1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const length = Math.hypot(dx, dy);
          const angleRad = Math.atan2(dy, dx);
          const angleDeg = (angleRad * 180) / Math.PI;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const strokeWidth = 2.5;

          return (
            <View
              key={`seg-${idx}`}
              style={[
                styles.lineSegment,
                {
                  width: length,
                  height: strokeWidth,
                  backgroundColor: cor,
                  left: midX - length / 2,
                  top: midY - strokeWidth / 2,
                  transform: [{ rotate: `${angleDeg}deg` }]
                }
              ]}
            />
          );
        })}

      {/* Points and hitboxes */}
      {points.map((p) => {
        const isSelected = p.idx === activeIndex;
        return (
          <Pressable
            key={`pt-${p.idx}`}
            onPress={() => setSelectedIdx(p.idx)}
            style={[styles.touchTarget, { left: p.x - 16, top: p.y - 16 }]}
            accessibilityRole="button"
            accessibilityLabel={`${p.item.label}: ${p.item.formatted || p.item.value}`}
          >
            <View
              style={[
                styles.dot,
                {
                  borderColor: cor,
                  backgroundColor: isSelected ? cor : '#ffffff'
                },
                isSelected && styles.dotSelected
              ]}
            >
              {isSelected && <View style={styles.dotInner} />}
            </View>
          </Pressable>
        );
      })}

      {/* Floating active tooltip */}
      {activePoint && (
        <View
          style={[
            styles.tooltip,
            {
              left: Math.max(8, Math.min(containerWidth - 76, activePoint.x - 34)),
              top: Math.max(2, activePoint.y - 32),
              borderColor: cor
            }
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.tooltipText, { color: cor }]}>
            {activePoint.item.formatted || `${activePoint.item.value} ${unidade}`.trim()}
          </Text>
        </View>
      )}

      {/* Bottom X-axis labels */}
      <View style={styles.labelsContainer}>
        {points.map((p) => (
          <View key={`lbl-${p.idx}`} style={[styles.labelWrapper, { left: p.x - 24 }]}>
            <Text
              style={[
                styles.label,
                p.idx === activeIndex && { color: cor, fontWeight: '700' }
              ]}
              numberOfLines={1}
            >
              {p.item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden'
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13
  },
  guideLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: '#f1f5f9'
  },
  areaSlice: {
    position: 'absolute'
  },
  lineSegment: {
    position: 'absolute',
    borderRadius: 2
  },
  touchTarget: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dotSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5
  },
  dotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff'
  },
  tooltip: {
    position: 'absolute',
    minWidth: 68,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '700'
  },
  labelsContainer: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 20
  },
  labelWrapper: {
    position: 'absolute',
    width: 48,
    alignItems: 'center'
  },
  label: {
    fontSize: 11,
    color: '#64748b'
  }
});

