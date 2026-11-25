import { Feather } from '@expo/vector-icons';
import { useEffect, useId, useRef, useState, type ComponentProps, type ComponentRef, type ReactNode } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text,
  View, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';

export interface AcaoDialogo {
  rotulo: string;
  executar: () => void | Promise<void>;
  variante?: 'secundaria' | 'perigo';
  desabilitada?: boolean;
  rotuloOcupado?: string;
  testID?: string;
}

interface Props {
  titulo: string;
  descricao?: string;
  icone?: ComponentProps<typeof Feather>['name'];
  acoes: AcaoDialogo[];
  fechar: () => void;
  children?: ReactNode;
  testID?: string;
}

export function DialogoConfirmacao({
  titulo, descricao, icone, acoes, fechar, children, testID
}: Props) {
  const tituloId = useId();
  const descricaoId = useId();
  const referenciaTitulo = useRef<ComponentRef<typeof Text>>(null);
  const primeiraAcao = useRef<ComponentRef<typeof Pressable>>(null);
  const tituloAnterior = useRef(titulo);
  const executando = useRef(false);
  const [acaoOcupada, setAcaoOcupada] = useState<number | null>(null);
  const [acaoEmFoco, setAcaoEmFoco] = useState<number | null>(null);
  const { width, fontScale } = useWindowDimensions();
  const [reduzirMovimento, setReduzirMovimento] = useState<boolean | null>(null);
  const perigo = acoes.some((acao) => acao.variante === 'perigo');
  const empilhar = width < 370 || fontScale >= 1.25 || acoes.length > 2;

  useEffect(() => {
    let ativo = true;
    const atualizar = (reduzir: boolean) => {
      if (ativo) setReduzirMovimento(reduzir);
    };
    const inscricao = AccessibilityInfo.addEventListener('reduceMotionChanged', atualizar);
    void AccessibilityInfo.isReduceMotionEnabled().then(atualizar, () => atualizar(true));
    return () => {
      ativo = false;
      inscricao?.remove();
    };
  }, []);

  useEffect(() => {
    if (tituloAnterior.current === titulo) return;
    tituloAnterior.current = titulo;

    if (Platform.OS === 'web') primeiraAcao.current?.focus();
    else if (referenciaTitulo.current) AccessibilityInfo.sendAccessibilityEvent(referenciaTitulo.current, 'focus');
  }, [titulo]);

  const acionar = async (acao: AcaoDialogo, indice: number) => {
    if (executando.current || acao.desabilitada) return;
    executando.current = true;
    setAcaoOcupada(indice);
    try {
      await acao.executar();
    } finally {
      executando.current = false;
      setAcaoOcupada(null);
    }
  };

  return (
    <Modal
      visible={reduzirMovimento !== null}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      supportedOrientations={['portrait', 'portrait-upside-down', 'landscape']}
      animationType={reduzirMovimento ? 'none' : 'fade'}
      aria-labelledby={tituloId}
      aria-describedby={descricao ? descricaoId : undefined}
      onRequestClose={() => {
        if (!executando.current) fechar();
      }}
      onShow={() => {
        if (Platform.OS !== 'web' && referenciaTitulo.current) {
          AccessibilityInfo.sendAccessibilityEvent(referenciaTitulo.current, 'focus');
        }
      }}
    >
      <SafeAreaView style={estilos.fundo}>
        <View style={estilos.painel} accessibilityViewIsModal testID={testID}>
          <ScrollView
            style={estilos.rolagem}
            contentContainerStyle={estilos.conteudo}
            keyboardShouldPersistTaps="handled" bounces={false}
          >
            <View style={[estilos.icone, perigo && estilos.iconePerigo]} aria-hidden>
              <Feather
                name={icone ?? (perigo ? 'alert-triangle' : 'info')}
                size={24}
                color={perigo ? colors.dangerText : colors.brandDeep}
              />
            </View>
            <View style={estilos.textos}>
              <Text ref={referenciaTitulo} nativeID={tituloId} accessibilityRole="header" style={estilos.titulo}>
                {titulo}
              </Text>
              {descricao ? <Text nativeID={descricaoId} style={estilos.descricao}>{descricao}</Text> : null}
            </View>
            {children}
            <View style={[estilos.acoes, empilhar && estilos.acoesEmpilhadas]}>
              {acoes.map((acao, indice) => {
                const secundario = acao.variante === 'secundaria';
                const destrutivo = acao.variante === 'perigo';
                const ocupado = acaoOcupada === indice;
                const desabilitado = acaoOcupada !== null || acao.desabilitada === true;
                const rotulo = ocupado && acao.rotuloOcupado ? acao.rotuloOcupado : acao.rotulo;

                return (
                  <Pressable
                    key={acao.rotulo}
                    ref={indice === 0 ? primeiraAcao : undefined}
                    style={({ pressed }) => [
                      estilos.botao,
                      !empilhar && estilos.botaoLadoALado,
                      secundario && estilos.botaoSecundario,
                      destrutivo && estilos.botaoPerigo,
                      acaoEmFoco === indice && estilos.botaoEmFoco,
                      (pressed || (desabilitado && !ocupado)) && estilos.atenuado
                    ]}
                    onPress={() => acionar(acao, indice)}
                    onFocus={() => setAcaoEmFoco(indice)}
                    onBlur={() => setAcaoEmFoco(null)}
                    disabled={desabilitado}
                    accessibilityRole="button"
                    accessibilityLabel={rotulo}
                    accessibilityState={{ disabled: desabilitado, busy: ocupado }}
                    testID={acao.testID}
                  >
                    {ocupado && <ActivityIndicator color={secundario ? colors.brandDeep : colors.white} aria-hidden />}
                    <Text style={[estilos.rotulo, secundario && estilos.rotuloSecundario]}>{rotulo}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.overlay
  },
  painel: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '100%',
    flexShrink: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card
  },
  rolagem: { flexGrow: 0, flexShrink: 1, borderRadius: radius.xl },
  conteudo: { padding: spacing.xl, gap: spacing.md },
  icone: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.confirmedBackground
  },
  iconePerigo: { backgroundColor: colors.dangerButtonBackground },
  textos: { gap: spacing.xs },
  titulo: { color: colors.text, fontFamily: fontFamily.extrabold, fontSize: 22, lineHeight: 30 },
  descricao: { color: colors.text, fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  acoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  acoesEmpilhadas: { flexDirection: 'column' },
  botao: {
    minHeight: 48,
    minWidth: 0,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs
  },
  botaoLadoALado: { flex: 1 },
  botaoSecundario: { backgroundColor: colors.page, borderColor: colors.border },
  botaoPerigo: { backgroundColor: colors.dangerText },
  botaoEmFoco: {
    borderColor: colors.brandDeep,
    outlineColor: colors.brandDeep,
    outlineWidth: 2,
    outlineOffset: 2,
    outlineStyle: 'solid'
  },
  atenuado: { opacity: 0.55 },
  rotulo: { flexShrink: 1, color: colors.white, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 20, textAlign: 'center' },
  rotuloSecundario: { color: colors.brandDeep }
});