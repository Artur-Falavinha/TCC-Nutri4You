import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import BellIcon from '../../assets/appointments/bell.svg';
import MenuIcon from '../../assets/appointments/menu.svg';
import { BadgeNotificacoes, rotuloNotificacoes } from '../../features/notificacoes/BadgeNotificacoes';
import { useNotificacoes } from '../../features/notificacoes/NotificacoesProvider';
import { colors, radius, shadows } from '../../theme/tokens';
import { RootStackParamList } from '../../navigation/types';

interface AppHeaderProps {
  onOpenMenu: () => void;
  exibirNotificacoes?: boolean;
}

export function AppHeader({ onOpenMenu, exibirNotificacoes = true }: AppHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { quantidade } = useNotificacoes();
  return (
    <SafeAreaView style={styles.header} edges={['top']}>
      <View style={styles.headerContent}>
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

        {exibirNotificacoes ? (
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Notificacoes')}
            accessibilityRole="button"
            accessibilityLabel={rotuloNotificacoes(quantidade)}
            hitSlop={8}
          >
            <BellIcon color={colors.text} aria-hidden />
            {quantidade > 0 && (
              <View style={styles.badge} pointerEvents="none" aria-hidden>
                <BadgeNotificacoes quantidade={quantidade} />
              </View>
            )}
          </Pressable>
        ) : <View style={styles.iconButton} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    zIndex: 10,
    ...shadows.card,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2
  },
  headerContent: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badge: {
    position: 'absolute', top: 0, right: -4,
    backgroundColor: colors.card, borderRadius: radius.pill, padding: 1
  },
  pressed: { opacity: 0.7 },
  brand: {
    alignItems: 'center',
    flexShrink: 1
  },
  logo: {
    width: 144,
    height: 43
  }
});
