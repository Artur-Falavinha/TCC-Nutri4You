import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type ComponentType, type PropsWithChildren
} from 'react';
import {
  Animated, BackHandler, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CalendarIcon from '../../assets/appointments/nav-calendar.svg';
import DietIcon from '../../assets/appointments/nav-diet.svg';
import ExamsIcon from '../../assets/appointments/nav-exams.svg';
import HomeIcon from '../../assets/appointments/nav-home.svg';
import LogoutIcon from '../../assets/appointments/nav-logout.svg';
import ProfileIcon from '../../assets/appointments/nav-profile.svg';
import ResultsIcon from '../../assets/appointments/nav-results.svg';
import ShoppingIcon from '../../assets/appointments/nav-shopping.svg';
import { AvatarFoto } from '../layout/AvatarFoto';
import { carregarFotoPerfil } from '../../core/perfil/foto-perfil.service';
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

interface ConfiguracaoMenu extends Omit<SideMenuProps, 'visible'> {
  id: string;
}

interface EstadoMenu extends ConfiguracaoMenu {
  aberto: boolean;
}

interface ControleMenu {
  abrir: (configuracao: ConfiguracaoMenu) => void;
  fechar: (id: string) => void;
}

const ContextoMenu = createContext<ControleMenu | null>(null);
const LARGURA_MAXIMA_MENU = 320;

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
  { destination: 'home', label: 'Home', icon: HomeIcon },
  { destination: 'appointments', label: 'Agenda', icon: CalendarIcon },
  { destination: 'diet', label: 'Dieta', icon: DietIcon },
  { destination: 'shopping', label: 'Compras', icon: ShoppingIcon },
  { destination: 'results', label: 'Resultados', icon: ResultsIcon },
  { destination: 'exams', label: 'Exames', icon: ExamsIcon },
  { destination: 'profile', label: 'Dados pessoais', icon: ProfileIcon }
];

export function SideMenuProvider({ children }: PropsWithChildren) {
  const [menu, setMenu] = useState<EstadoMenu | null>(null);
  const abrir = useCallback((configuracao: ConfiguracaoMenu) => {
    setMenu(atual => atual?.id === configuracao.id && !atual.aberto
      ? atual
      : { ...configuracao, aberto: true }
    );
  }, []);
  const fechar = useCallback((id: string) => {
    setMenu(atual => atual?.id === id && atual.aberto ? { ...atual, aberto: false } : atual);
  }, []);
  const remover = useCallback((id: string) => {
    setMenu(atual => atual?.id === id && !atual.aberto ? null : atual);
  }, []);
  const controle = useMemo(() => ({ abrir, fechar }), [abrir, fechar]);
  const ocultarTela = Platform.OS !== 'web' && menu !== null;

  return (
    <ContextoMenu.Provider value={controle}>
      <View style={styles.root}>
        <View
          style={styles.root}
          accessibilityElementsHidden={ocultarTela}
          importantForAccessibility={ocultarTela ? 'no-hide-descendants' : 'auto'}
        >
          {children}
        </View>
        {menu && <MenuSobreposto key={menu.id} menu={menu} fechar={fechar} remover={remover} />}
      </View>
    </ContextoMenu.Provider>
  );
}

export function SideMenu({ visible, activeItem, userName, onClose, onNavigate }: SideMenuProps) {
  const id = useId();
  const controle = useContext(ContextoMenu);
  if (!controle) {
    throw new Error('SideMenu deve ser usado dentro de SideMenuProvider.');
  }

  const { abrir, fechar } = controle;
  useEffect(() => {
    if (visible) {
      abrir({ id, activeItem, userName, onClose, onNavigate });
    } else {
      fechar(id);
    }
  }, [visible, id, activeItem, userName, onClose, onNavigate, abrir, fechar]);
  useEffect(() => () => fechar(id), [id, fechar]);

  return null;
}

interface MenuSobrepostoProps {
  menu: EstadoMenu;
  fechar: (id: string) => void;
  remover: (id: string) => void;
}

function MenuSobreposto({ menu, fechar, remover }: MenuSobrepostoProps) {
  const [progresso] = useState(() => new Animated.Value(0));
  const [foto, setFoto] = useState<string | null>(null);
  const acaoSolicitada = useRef(false);
  const { aberto, id } = menu;

  useEffect(() => {
    let ativo = true;
    void carregarFotoPerfil().then(imagem => { if (ativo) setFoto(imagem); }).catch(() => undefined);
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    const animacao = Animated.timing(progresso, {
      toValue: aberto ? 1 : 0,
      duration: 230,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web'
    });
    animacao.start(({ finished }) => {
      if (finished && !aberto) {
        remover(id);
      }
    });
    return () => animacao.stop();
  }, [aberto, id, progresso, remover]);

  const acionar = useCallback((destino?: MenuDestination) => {
    if (!menu.aberto || acaoSolicitada.current) return;

    acaoSolicitada.current = true;
    fechar(menu.id);
    if (destino) {
      menu.onNavigate(destino);
    } else {
      menu.onClose();
    }
  }, [fechar, menu]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const inscricao = BackHandler.addEventListener('hardwareBackPress', () => {
      acionar();
      return true;
    });
    return () => inscricao.remove();
  }, [acionar]);

  const conteudo = (
    <View
      style={styles.overlay}
      accessibilityViewIsModal
      onAccessibilityEscape={() => acionar()}
    >
      <Animated.View style={[styles.backdrop, { opacity: progresso }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => acionar()}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawerFrame,
          { transform: [{ translateX: progresso.interpolate({ inputRange: [0, 1], outputRange: [-LARGURA_MAXIMA_MENU, 0] }) }] }
        ]}
      >
        <SafeAreaView style={styles.drawer} edges={['top', 'bottom', 'left']}>
          <View style={styles.header}>
            <AvatarFoto foto={foto} tamanho={44} />
            <Text style={styles.userName} numberOfLines={1}>
              {menu.userName || 'Paciente'}
            </Text>
          </View>

          <ScrollView
            style={styles.navigation}
            contentContainerStyle={styles.navigationContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map(item => (
              <MenuItem
                key={item.destination}
                label={item.label}
                icon={item.icon}
                active={menu.activeItem === item.destination}
                onPress={() => acionar(item.destination)}
              />
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <MenuItem label="Sair" icon={LogoutIcon} onPress={() => acionar('logout')} />
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );

  return Platform.OS === 'web' ? (
    <Modal visible transparent animationType="none" onRequestClose={() => acionar()}>
      {conteudo}
    </Modal>
  ) : conteudo;
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
  root: {
    flex: 1
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay
  },
  drawerFrame: {
    width: '82%',
    maxWidth: LARGURA_MAXIMA_MENU,
    flex: 1
  },
  drawer: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxxl
  },
  userName: {
    flex: 1,
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
