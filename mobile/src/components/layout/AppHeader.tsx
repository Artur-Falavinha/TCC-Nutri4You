import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import BellIcon from '../../assets/appointments/bell.svg';
import MenuIcon from '../../assets/appointments/menu.svg';
import { colors, shadows } from '../../theme/tokens';
import { RootStackParamList } from '../../navigation/types';

interface AppHeaderProps {
  onOpenMenu: () => void;
}

export function AppHeader({ onOpenMenu }: AppHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notificacoes')}
          accessibilityRole="button"
          accessibilityLabel="Notificações"
          hitSlop={8}
        >
          <BellIcon />
        </Pressable>
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
  brand: {
    alignItems: 'center',
    flexShrink: 1
  },
  logo: {
    width: 144,
    height: 43
  }
});
