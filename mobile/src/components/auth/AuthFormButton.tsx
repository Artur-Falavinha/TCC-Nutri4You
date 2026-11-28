import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { perfilStyles } from '../../screens/home/perfil.styles';
import { colors } from '../../theme/tokens';
import { recuperacaoSenhaStyles as formulario } from './recuperacaoSenhaStyles';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'texto';
  icone?: ComponentProps<typeof Feather>['name'];
  ocupado?: boolean;
  desativado?: boolean;
};

export function AuthFormButton({
  titulo, onPress, variante = 'primario', icone, ocupado = false, desativado = false
}: Props) {
  const primario = variante === 'primario';
  const bloqueado = desativado || ocupado;

  return (
    <Pressable
      style={({ pressed }) => [
        perfilStyles.botao,
        primario && perfilStyles.primario,
        variante === 'secundario' && perfilStyles.secundario,
        pressed && perfilStyles.pressionado,
        ocupado && primario && formulario.enviando,
        desativado && perfilStyles.pressionado
      ]}
      onPress={onPress}
      disabled={bloqueado}
      accessibilityRole="button"
      accessibilityState={{ busy: ocupado, disabled: bloqueado }}
    >
      {!primario && icone && <Feather name={icone} size={18} color={colors.brandDark} aria-hidden />}
      <Text style={[primario ? perfilStyles.rotuloPrimario : perfilStyles.rotuloBotao, styles.rotulo]}>{titulo}</Text>
      {ocupado ? <ActivityIndicator size="small" color={primario ? colors.white : colors.brandDark} /> : (
        primario && icone ? <Feather name={icone} size={18} color={colors.white} aria-hidden /> : null
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rotulo: { textAlign: 'center' }
});
