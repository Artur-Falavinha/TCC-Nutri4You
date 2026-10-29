import { ComponentType } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CalendarIcon from '../../assets/appointments/nav-calendar.svg';
import DietIcon from '../../assets/appointments/nav-diet.svg';
import ExamsIcon from '../../assets/appointments/nav-exams.svg';
import HomeIcon from '../../assets/appointments/nav-home.svg';
import LockIcon from '../../assets/appointments/nav-lock.svg';
import LogoutIcon from '../../assets/appointments/nav-logout.svg';
import ProfileIcon from '../../assets/appointments/nav-profile.svg';
import ResultsIcon from '../../assets/appointments/nav-results.svg';
import ShoppingIcon from '../../assets/appointments/nav-shopping.svg';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

export type MenuDestination =
  | 'profile'
  | 'home'
  | 'diet'
  | 'appointments'
  | 'exams'
  | 'shopping'
  | 'results'
  | 'password'
  | 'logout';

interface SideMenuProps {
  visible: boolean;
  activeItem: MenuDestination;
  userName: string;
  onClose: () => void;
  onNavigate: (destination: MenuDestination) => void;
}

interface MenuItemProps {
  label: string;
  icon: ComponentType<{ color?: string }>;
  active?: boolean;
  onPress: () => void;
}

const menuItems: {
  destination: MenuDestination;
  label: string;
  icon: ComponentType<{ color?: string }>;
}[] = [
  { destination: 'profile', label: 'Dados pessoais', icon: ProfileIcon },
  { destination: 'home', label: 'Home', icon: HomeIcon },
  { destination: 'diet', label: 'Dieta', icon: DietIcon },
  { destination: 'appointments', label: 'Agenda', icon: CalendarIcon },
  { destination: 'exams', label: 'Exames', icon: ExamsIcon },
  { destination: 'shopping', label: 'Compras', icon: ShoppingIcon },
  { destination: 'results', label: 'Resultados', icon: ResultsIcon },
  { destination: 'password', label: 'Trocar Senha', icon: LockIcon }
];

export function SideMenu({
  visible,
  activeItem,
  userName,
  onClose,
  onNavigate
}: SideMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
        />
        <SafeAreaView style={styles.drawer} edges={['top', 'bottom', 'left']}>
          <View style={styles.header}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName || 'Paciente'}
            </Text>
          </View>

          <ScrollView
            style={styles.navigation}
            contentContainerStyle={styles.navigationContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item) => (
              <MenuItem
                key={item.destination}
                label={item.label}
                icon={item.icon}
                active={activeItem === item.destination}
                onPress={() => onNavigate(item.destination)}
              />
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <MenuItem
              label="Sair"
              icon={LogoutIcon}
              onPress={() => onNavigate('logout')}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function MenuItem({ label, icon, active = false, onPress }: MenuItemProps) {
  const Icon = icon;
  return (
    <Pressable
      style={({ pressed }) => [styles.item, active && styles.activeItem, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View style={styles.icon}>
        <Icon color={active ? colors.brandDeep : colors.menuIcon} />
      </View>
      <Text style={[styles.itemLabel, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay
  },
  drawer: {
    width: '82%',
    maxWidth: 320,
    flex: 1,
    backgroundColor: '#fafaf9',
    borderTopRightRadius: radius.drawer,
    borderBottomRightRadius: radius.drawer,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 16
  },
  header: {
    paddingBottom: spacing.xxxl
  },
  userName: {
    color: '#065f46',
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 25
  },
  navigation: {
    flex: 1,
    minHeight: 0
  },
  navigationContent: {
    gap: spacing.xs
  },
  item: {
    minHeight: 52,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg
  },
  activeItem: {
    backgroundColor: colors.brandSoft
  },
  pressed: {
    opacity: 0.72
  },
  icon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemLabel: {
    color: '#57534e',
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20
  },
  activeLabel: {
    color: colors.brandDeep
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eeeeec',
    paddingTop: spacing.xs
  }
});
