import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import BellIcon from '../../assets/appointments/bell.svg';
import MenuIcon from '../../assets/appointments/menu.svg';
import BrandAvatar from '../../assets/appointments/brand-avatar.png';
import { colors, fontFamily, shadows } from '../../theme/tokens';

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

      <View style={styles.brand} accessibilityRole="header">
        <View style={styles.avatarBorder}>
          <Image source={BrandAvatar} style={styles.avatar} accessibilityIgnoresInvertColors />
        </View>
        <Text style={styles.title}>I Need a Nutri</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatarBorder: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,111,30,0.2)',
    padding: 1,
    overflow: 'hidden'
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 9999
  },
  title: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 28
  }
});
