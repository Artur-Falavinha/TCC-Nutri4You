import { Image, Pressable, StyleSheet, View } from 'react-native';

import BellIcon from '../../assets/appointments/bell.svg';
import MenuIcon from '../../assets/appointments/menu.svg';
import { shadows } from '../../theme/tokens';

interface AppHeaderProps {
  onOpenMenu: () => void;
}

export function AppHeader({ onOpenMenu }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        style={styles.iconButton}
        onPress={onOpenMenu}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        hitSlop={8}
      >
        <MenuIcon />
      </Pressable>

      <View style={styles.brand} accessibilityRole="header" accessibilityLabel="Nutri4You">
        <Image
          source={require('../../../assets/logo-nutri4u.webp')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Nutri4U"
          accessibilityIgnoresInvertColors
        />
      </View>

      <Pressable
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Notificações"
      >
        <BellIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)',
    zIndex: 10,
    ...shadows.card,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brand: {
    alignItems: 'center',
    flexShrink: 1
  },
  logo: {
    width: 144,
    height: 43
  }
});
