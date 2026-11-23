import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme/tokens';

interface AvatarFotoProps {
  foto: string | null;
  tamanho: number;
}

export function AvatarFoto({ foto, tamanho }: AvatarFotoProps) {
  const dimensoes = { width: tamanho, height: tamanho };
  return (
    <View style={[styles.avatar, dimensoes]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {foto ? (
        <Image source={{ uri: foto }} style={dimensoes} resizeMode="cover" />
      ) : (
        <Ionicons name="person-outline" size={tamanho / 2} color={colors.brand} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.subtle,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
