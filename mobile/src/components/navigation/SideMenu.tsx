import { Feather } from '@expo/vector-icons';
import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type ComponentProps, type PropsWithChildren
} from 'react';
import {
  AccessibilityInfo, Animated, BackHandler, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarFoto } from '../layout/AvatarFoto';
import { logout } from '../../core/auth/auth.service';
import { BadgeNotificacoes, rotuloNotificacoes } from '../../features/notificacoes/BadgeNotificacoes';
import { useNotificacoes } from '../../features/notificacoes/NotificacoesProvider';
import type { RootStackParamList } from '../../navigation/types';
import { carregarFotoPerfil } from '../../core/perfil/foto-perfil.service';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

export type MenuDestination =
  | 'notifications'
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
  onNavigate?: (destination: MenuDestination) => void;
}

interface ConfiguracaoMenu extends Omit<SideMenuProps, 'visible' | 'onNavigate'> {
  id: string;
  onNavigate: (destination: MenuDestination) => void;
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
  icon: ComponentProps<typeof Feather>['name'];
  active?: boolean;
  quantidadeNaoLidas?: number;
  sair?: boolean;
  onPress: () => void;
}

const menuItems: {
  destination: MenuDestination;
  label: string;
  icon: ComponentProps<typeof Feather>['name'];
}[] = [
  { destination: 'home', label: 'Home', icon: 'home' },
  { destination: 'appointments', label: 'Agenda', icon: 'calendar' },
  { destination: 'diet', label: 'Dieta', icon: 'book-open' },
  { destination: 'shopping', label: 'Compras', icon: 'shopping-cart' },
  { destination: 'results', label: 'Resultados', icon: 'activity' },
  { destination: 'exams', label: 'Exames', icon: 'clipboard' },
  { destination: 'notifications', label: 'Notificações', icon: 'bell' },
  { destination: 'profile', label: 'Dados pessoais', icon: 'user' }
];

const rotasMenu = {
  home: 'Dashboard',
  appointments: 'Agenda',
  diet: 'Dieta',
  shopping: 'Compras',
  results: 'Evolucao',
  exams: 'Exames',
  notifications: 'Notificacoes',
  profile: 'DadosPessoais',
  password: 'TrocarSenha'
} as const satisfies Record<Exclude<MenuDestination, 'logout'>, keyof RootStackParamList>;

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const controle = useContext(ContextoMenu);
  if (!controle) {
    throw new Error('SideMenu deve ser usado dentro de SideMenuProvider.');
  }

  const { abrir, fechar } = controle;
  const navegar = useCallback(async (destino: MenuDestination) => {
    if (onNavigate && destino !== 'notifications') {
      onNavigate(destino);
      return;
    }

    onClose();
    if (destino === activeItem) return;
    if (destino === 'logout') {
      await logout();
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
      return;
    }

    navigation.navigate(rotasMenu[destino]);
  }, [activeItem, navigation, onClose, onNavigate]);
  useEffect(() => {
    if (visible) {
      abrir({ id, activeItem, userName, onClose, onNavigate: navegar });
    } else {
      fechar(id);
    }
  }, [visible, id, activeItem, userName, onClose, navegar, abrir, fechar]);
  useEffect(() => () => fechar(id), [id, fechar]);

  return null;
}

interface MenuSobrepostoProps {
  menu: EstadoMenu;
  fechar: (id: string) => void;
  remover: (id: string) => void;
}

function MenuSobreposto({ menu, fechar, remover }: MenuSobrepostoProps) {
  const { quantidade } = useNotificacoes();
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
    let vigente = true;
    let animacao: Animated.CompositeAnimation | undefined;

    function mover(reduzirMovimento: boolean) {
      if (!vigente) return;

      if (reduzirMovimento) {
        progresso.setValue(aberto ? 1 : 0);
        if (!aberto) remover(id);
        return;
      }

      animacao = Animated.timing(progresso, {
        toValue: aberto ? 1 : 0,
        duration: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web'
      });
      animacao.start(({ finished }) => {
        if (finished && !aberto) remover(id);
      });
    }

    void AccessibilityInfo.isReduceMotionEnabled().then(mover, () => mover(false));
    return () => {
      vigente = false;
      animacao?.stop();
    };
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
      <Animated.View style={[styles.backdrop, { opacity: progresso }]} aria-hidden>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => acionar()}
          focusable={false}
          accessible={false}
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
            <View style={styles.avatar}>
              <AvatarFoto foto={foto} tamanho={40} />
            </View>
            <Text style={styles.userName} numberOfLines={2}>
              {menu.userName || 'Paciente'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.fechar, pressed && styles.pressed]}
              onPress={() => acionar()}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
            >
              <Feather name="x" size={20} color={colors.brandDeep} aria-hidden />
            </Pressable>
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
                quantidadeNaoLidas={item.destination === 'notifications' ? quantidade : undefined}
                onPress={() => acionar(item.destination)}
              />
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <MenuItem label="Sair" icon="log-out" sair onPress={() => acionar('logout')} />
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

function MenuItem({ label, icon, active = false, quantidadeNaoLidas, sair = false, onPress }: MenuItemProps) {
  let corIcone: string = colors.menuIcon;
  if (active) corIcone = colors.brandDark;
  if (sair) corIcone = colors.dangerText;
  return (
    <Pressable
      style={({ pressed }) => [styles.item, active && styles.activeItem, sair && styles.sair, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      aria-current={active ? 'page' : undefined}
      accessibilityLabel={quantidadeNaoLidas === undefined ? label : rotuloNotificacoes(quantidadeNaoLidas)}
    >
      {active && <View style={styles.indicadorAtivo} aria-hidden />}
      <View style={[styles.icon, active && styles.iconeAtivo, sair && styles.iconeSair]} aria-hidden>
        <Feather name={icon} size={18} color={corIcone} />
      </View>
      <Text style={[styles.itemLabel, active && styles.activeLabel, sair && styles.rotuloSair]}>{label}</Text>
      {quantidadeNaoLidas !== undefined && <BadgeNotificacoes quantidade={quantidadeNaoLidas} />}
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
    width: '86%',
    maxWidth: LARGURA_MAXIMA_MENU,
    flex: 1
  },
  drawer: {
    flex: 1,
    backgroundColor: colors.card,
    borderTopRightRadius: radius.drawer,
    borderBottomRightRadius: radius.drawer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.page,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg
  },
  avatar: {
    padding: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    flexShrink: 0
  },
  userName: {
    flex: 1,
    minWidth: 0,
    color: colors.brandDeep,
    fontFamily: fontFamily.extrabold,
    fontSize: 16,
    lineHeight: 22
  },
  fechar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md
  },
  navigation: {
    flex: 1,
    minHeight: 0
  },
  navigationContent: {
    gap: spacing.xs,
    padding: spacing.xxs
  },
  item: {
    minHeight: 52,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md
  },
  activeItem: {
    backgroundColor: colors.confirmedBackground
  },
  indicadorAtivo: {
    position: 'absolute',
    left: 0,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 3,
    backgroundColor: colors.brand,
    borderRadius: radius.pill
  },
  pressed: {
    opacity: 0.72
  },
  icon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
    borderRadius: radius.sm
  },
  iconeAtivo: {
    backgroundColor: colors.brandSoft
  },
  itemLabel: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 21
  },
  activeLabel: {
    color: colors.brandDeep,
    fontFamily: fontFamily.extrabold
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xxs
  },
  sair: {
    backgroundColor: colors.page
  },
  iconeSair: {
    backgroundColor: colors.dangerButtonBackground
  },
  rotuloSair: {
    color: colors.dangerText,
    fontFamily: fontFamily.bold
  }
});
