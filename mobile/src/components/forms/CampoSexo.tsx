import { type ComponentRef, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

const OPCOES = [
  { label: 'Masculino', valor: 'Masculino' },
  { label: 'Feminino', valor: 'Feminino' },
  { label: 'Prefiro não informar', valor: '' }
] as const;

export type ValorSexo = (typeof OPCOES)[number]['valor'];

interface Props {
  valor: string | null;
  aoSelecionar: (valor: ValorSexo) => void;
  desabilitado?: boolean;
}

export function CampoSexo({ valor, aoSelecionar, desabilitado = false }: Props) {
  const [aberto, setAberto] = useState(false);
  const controle = useRef<ComponentRef<typeof Pressable>>(null);
  const mostrarOpcoes = aberto && !desabilitado;
  const selecao = OPCOES.find(opcao => opcao.valor === valor);
  const rotulo = selecao?.label ?? 'Selecione';

  function selecionar(opcao: ValorSexo) {
    aoSelecionar(opcao);
    if (Platform.OS === 'web') controle.current?.focus();
    setAberto(false);
  }

  return (
    <View style={styles.campo}>
      <Text style={styles.rotulo}>Sexo</Text>
      <Pressable
        ref={controle}
        style={({ pressed }) => [styles.controle, pressed && styles.pressionado]}
        onPress={() => setAberto(atual => !atual)}
        disabled={desabilitado}
        accessibilityRole="button"
        accessibilityLabel={`Sexo, ${rotulo}`}
        aria-expanded={mostrarOpcoes}
      >
        <Text style={[styles.valor, !selecao && styles.placeholder]}>{rotulo}</Text>
        <Feather name={mostrarOpcoes ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} aria-hidden />
      </Pressable>

      {mostrarOpcoes && (
        <View style={styles.opcoes} accessibilityRole="radiogroup" accessibilityLabel="Opções de sexo">
          {OPCOES.map(opcao => {
            const selecionada = valor === opcao.valor;
            return (
              <Pressable
                key={opcao.valor}
                style={({ pressed }) => [styles.opcao, selecionada && styles.selecionada, pressed && styles.pressionado]}
                onPress={() => selecionar(opcao.valor)}
                accessibilityRole="radio"
                accessibilityLabel={opcao.label}
                aria-checked={selecionada}
              >
                <Text style={[styles.textoOpcao, selecionada && styles.textoSelecionado]}>{opcao.label}</Text>
                {selecionada && <Feather name="check" size={18} color={colors.brand} aria-hidden />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { gap: spacing.xxs },
  rotulo: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14 },
  controle: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.textSecondary, borderRadius: radius.md
  },
  valor: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fontFamily.regular, fontSize: 16 },
  placeholder: { color: colors.textSecondary },
  opcoes: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.xxs
  },
  opcao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm,
    minHeight: 48, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm
  },
  selecionada: { backgroundColor: colors.confirmedBackground },
  textoOpcao: { flexShrink: 1, fontFamily: fontFamily.regular, fontSize: 15, color: colors.text },
  textoSelecionado: { fontFamily: fontFamily.bold, color: colors.brand },
  pressionado: { opacity: 0.8 }
});
