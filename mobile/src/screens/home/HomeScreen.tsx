import { toast } from '../../components/feedback/toast';
import { Feather } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import {
  atualizarPerfil,
  carregarPerfil,
  desvincularNutricionista,
  listarNutricionistas,
  NutricionistaVinculo
} from '../../core/perfil/perfil.service';
import { dataNascimentoParaIso, formatarDataCivil, formatDateDisplay } from '../../core/utils/date-mask.util';
import { formatPhoneDisplay, normalizePhone } from '../../core/utils/phone-mask.util';
import { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/layout/AppHeader';
import { SectionCardHeader, sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { SolicitacoesVinculo } from './SolicitacoesVinculo';
import { Privacidade } from './Privacidade';
import { FotoPerfil } from './FotoPerfil';
import { AvatarNutricionista } from './AvatarNutricionista';
import { LembretesConsulta } from './LembretesConsulta';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';
import { perfilStyles } from './perfil.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'DadosPessoais'>;

const SEXO_OPTIONS = ['Masculino', 'Feminino', 'Prefiro não informar'] as const;

function mensagemErro(erro: unknown, fallback: string): string {
  return erro instanceof ApiError ? erro.message : fallback;
}

export function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [sexo, setSexo] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [vinculos, setVinculos] = useState<NutricionistaVinculo[]>([]);
  const [pendente, setPendente] = useState<NutricionistaVinculo | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    void Promise.all([carregarPerfil(), listarNutricionistas()])
      .then(([perfil, nutricionistas]) => {
        setNome(perfil.nome ?? '');
        setEmail(perfil.email ?? '');
        setTelefone(formatPhoneDisplay(perfil.telefone ?? ''));
        setSexo(perfil.sexo ?? '');
        setDataNascimento(formatarDataCivil(perfil.dataNascimento));
        setVinculos(nutricionistas ?? []);
      })
      .catch((falha: unknown) => {
        setErro(mensagemErro(falha, 'Não foi possível carregar seus dados.'));
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  const salvar = async () => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro('Informe o nome.');
      return;
    }
    const nascimento = dataNascimentoParaIso(dataNascimento);
    if (dataNascimento.trim() && !nascimento) {
      setErro('Data de nascimento inválida. Use DD/MM/AAAA.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const perfil = await atualizarPerfil({
        nome: nomeLimpo,
        telefone: normalizePhone(telefone),
        sexo: sexo.trim() || undefined,
        dataNascimento: nascimento
      });
      setNome(perfil.nome ?? nomeLimpo);
      toast.sucesso('Dados pessoais atualizados.');
    } catch (falha) {
      toast.erro(mensagemErro(falha, 'Não foi possível salvar os dados.'));
    } finally {
      setSalvando(false);
    }
  };

  const executarDesvinculo = async (vinculo: NutricionistaVinculo) => {
    setErro('');
    try {
      await desvincularNutricionista(vinculo.id);
      setVinculos((atual) => atual.filter((item) => item.id !== vinculo.id));
      setPendente(null);
      toast.sucesso(`Relação com ${vinculo.nome} encerrada.`);
    } catch (falha) {
      setPendente(null);
      toast.erro(mensagemErro(falha, 'Não foi possível desvincular.'));
    }
  };

  const sair = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      })
    );
  };

  const navegarPeloMenu = async (destino: MenuDestination) => {
    setMenuVisible(false);
    if (destino === 'home') {
      navigation.navigate('Dashboard');
      return;
    }
    if (destino === 'results') {
      navigation.navigate('Evolucao');
      return;
    }
    if (destino === 'appointments') {
      navigation.navigate('Agenda');
      return;
    }
    if (destino === 'diet') {
      navigation.navigate('Dieta');
      return;
    }
    if (destino === 'shopping') {
      navigation.navigate('Compras');
      return;
    }
    if (destino === 'exams') {
      navigation.navigate('Exames');
      return;
    }
    if (destino === 'password') {
      navigation.navigate('TrocarSenha');
      return;
    }
    if (destino === 'logout') {
      await sair();
      return;
    }
    if (destino !== 'profile') {
      toast.informacao('Este módulo ainda não está disponível nesta etapa.');
    }
  };

  const formularioOcupado = carregando || salvando;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            width < 420 && styles.contentCompacto,
            { maxWidth: width >= 640 ? 760 : 560 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titulo} accessibilityRole="header" aria-level={1}>Dados pessoais</Text>
          <FotoPerfil />

          <View style={sectionCardStyles.superficie}>
            <View style={styles.introducao}>
              <SectionCardHeader titulo="Informações pessoais" icone="user" />
              <Text style={perfilStyles.descricao}>Altere nome, telefone, sexo e data de nascimento.</Text>
            </View>

            {carregando ? <ActivityIndicator color={colors.brand} accessibilityLabel="Carregando dados pessoais" /> : null}
            {erro ? <Text style={perfilStyles.erro} accessibilityRole="alert">{erro}</Text> : null}

            <View style={styles.grupoCampo}>
              <Text style={styles.rotulo}>Nome</Text>
              <TextInput
                style={styles.campo}
                value={nome}
                onChangeText={setNome}
                editable={!formularioOcupado}
                accessibilityLabel="Nome"
              />
            </View>

            <View style={styles.grupoCampo}>
              <Text style={styles.rotulo}>E-mail</Text>
              <View style={styles.campoSomenteLeitura}>
                <TextInput
                  style={[styles.campo, styles.email]}
                  value={email}
                  editable={false}
                  accessibilityLabel="E-mail"
                />
                <Feather name="lock" size={16} color={colors.textSecondary} aria-hidden />
              </View>
            </View>

            <View style={styles.camposContato}>
              <View style={styles.campoContato}>
                <Text style={styles.rotulo}>Telefone</Text>
                <TextInput
                  style={styles.campo}
                  value={telefone}
                  onChangeText={(valor) => setTelefone(formatPhoneDisplay(valor))}
                  keyboardType="phone-pad"
                  editable={!formularioOcupado}
                  accessibilityLabel="Telefone"
                />
              </View>

              <View style={styles.campoContato}>
                <Text style={styles.rotulo}>Data de nascimento</Text>
                <TextInput
                  style={styles.campo}
                  value={dataNascimento}
                  onChangeText={(valor) => setDataNascimento(formatDateDisplay(valor))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={10}
                  editable={!formularioOcupado}
                  accessibilityLabel="Data de nascimento"
                />
              </View>
            </View>

            <View style={styles.grupoCampo}>
              <Text style={styles.rotulo}>Sexo</Text>
              <View style={styles.opcoes}>
                {SEXO_OPTIONS.map((opcao) => {
                  const ativo = sexo === opcao;
                  return (
                    <Pressable
                      key={opcao}
                      style={({ pressed }) => [
                        perfilStyles.botao, styles.opcao, ativo && styles.opcaoAtiva,
                        pressed && perfilStyles.pressionado
                      ]}
                      onPress={() => setSexo(opcao)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: ativo }}
                    >
                      {ativo && <Feather name="check" size={16} color={colors.brandDark} aria-hidden />}
                      <Text style={[perfilStyles.rotuloBotao, !ativo && styles.rotulo]}>{opcao}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                perfilStyles.botao, perfilStyles.primario,
                (pressed || formularioOcupado) && perfilStyles.pressionado
              ]}
              onPress={() => void salvar()}
              disabled={formularioOcupado}
              accessibilityRole="button"
              accessibilityState={{ busy: salvando, disabled: formularioOcupado }}
            >
              {salvando
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Feather name="save" size={18} color={colors.white} aria-hidden />}
              <Text style={perfilStyles.rotuloPrimario}>{salvando ? 'Salvando...' : 'Salvar dados'}</Text>
            </Pressable>
          </View>

          {!carregando && (
            <SolicitacoesVinculo
              onAceito={(novoVinculo) => setVinculos((atuais) => [
                ...atuais.filter((vinculo) => vinculo.id !== novoVinculo.id),
                novoVinculo
              ])}
            />
          )}

          <View style={sectionCardStyles.superficie}>
            <SectionCardHeader titulo="Nutricionistas vinculados" icone="users" />
            {vinculos.length === 0 ? (
              <Text style={perfilStyles.estadoVazio}>Nenhum nutricionista vinculado.</Text>
            ) : (
              vinculos.map((vinculo) => (
                <View key={vinculo.id} style={styles.vinculo}>
                  <View style={styles.identidadeVinculo}>
                    <AvatarNutricionista id={vinculo.id} />
                    <View style={styles.vinculoTexto}>
                      <Text style={styles.vinculoNome}>{vinculo.nome}</Text>
                      <Text style={perfilStyles.descricao}>{vinculo.email}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      perfilStyles.botao, perfilStyles.perigoSuave, pressed && perfilStyles.pressionado
                    ]}
                    onPress={() => setPendente(vinculo)}
                    accessibilityRole="button"
                    accessibilityLabel={'Desvincular ' + vinculo.nome}
                  >
                    <Text style={perfilStyles.rotuloPerigo}>Desvincular</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={sectionCardStyles.superficie}>
            <SectionCardHeader titulo="Segurança" icone="shield" />
            <Pressable
              style={({ pressed }) => [perfilStyles.botao, perfilStyles.secundario, pressed && perfilStyles.pressionado]}
              accessibilityRole="button"
              onPress={() => navigation.navigate('TrocarSenha')}
            >
              <Feather name="key" size={18} color={colors.brandDark} aria-hidden />
              <Text style={perfilStyles.rotuloBotao}>Trocar senha</Text>
            </Pressable>
          </View>

          <LembretesConsulta />
          <Privacidade />

          <Pressable
            style={({ pressed }) => [perfilStyles.botao, styles.sair, pressed && perfilStyles.pressionado]}
            onPress={() => void sair()}
            accessibilityRole="button"
          >
            <Feather name="log-out" size={18} color={colors.dangerText} aria-hidden />
            <Text style={perfilStyles.rotuloPerigo}>Sair</Text>
          </Pressable>
        </ScrollView>

        <Modal visible={pendente !== null} transparent animationType="fade" onRequestClose={() => setPendente(null)}>
          {pendente && (
            <ScrollView contentContainerStyle={styles.confirmaOverlay}>
              <View style={[sectionCardStyles.superficie, styles.confirma]} accessibilityRole="alert" accessibilityViewIsModal>
                <Text style={styles.confirmaTitulo}>Encerrar vínculo?</Text>
                <Text style={perfilStyles.descricao}>
                  Encerrar a relação com {pendente.nome}? A conta permanece ativa.
                </Text>
                <View style={styles.confirmaAcoes}>
                  <Pressable
                    style={({ pressed }) => [perfilStyles.botao, perfilStyles.secundario, pressed && perfilStyles.pressionado]}
                    onPress={() => setPendente(null)}
                    accessibilityRole="button"
                  >
                    <Text style={perfilStyles.rotuloBotao}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [perfilStyles.botao, styles.confirmaPerigo, pressed && perfilStyles.pressionado]}
                    onPress={() => void executarDesvinculo(pendente)}
                    accessibilityRole="button"
                    accessibilityLabel="Confirmar desvínculo"
                  >
                    <Text style={perfilStyles.rotuloPrimario}>Encerrar vínculo</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          )}
        </Modal>
      </KeyboardAvoidingView>
      <SideMenu
        visible={menuVisible}
        activeItem="profile"
        userName={nome || 'Paciente'}
        onClose={() => setMenuVisible(false)}
        onNavigate={(destino) => void navegarPeloMenu(destino)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageAlt },
  flex: { flex: 1 },
  content: {
    width: '100%', alignSelf: 'center', paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md
  },
  contentCompacto: { paddingHorizontal: spacing.sm },
  titulo: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 30, lineHeight: 38 },
  introducao: { gap: spacing.xs },
  grupoCampo: { gap: spacing.xxs },
  rotulo: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14 },
  campo: {
    minHeight: 48,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    backgroundColor: colors.white, color: colors.text, fontFamily: fontFamily.regular, fontSize: 16
  },
  campoSomenteLeitura: {
    flexDirection: 'row', alignItems: 'center', paddingRight: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.page
  },
  email: { flex: 1, borderWidth: 0, backgroundColor: colors.page, color: colors.textSecondary },
  camposContato: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  campoContato: { flexGrow: 1, flexBasis: 160, gap: spacing.xxs },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  opcao: { backgroundColor: colors.page, paddingHorizontal: spacing.sm },
  opcaoAtiva: { borderColor: colors.brand, backgroundColor: colors.confirmedBackground },
  vinculo: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
    gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.page
  },
  identidadeVinculo: { flex: 1, minWidth: 156, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vinculoTexto: { flex: 1, minWidth: 0, gap: spacing.xxs },
  vinculoNome: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15 },
  sair: { backgroundColor: colors.card, borderColor: colors.border },
  confirmaOverlay: {
    flexGrow: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.lg, backgroundColor: colors.overlay
  },
  confirma: { width: '100%', maxWidth: 440, padding: spacing.lg },
  confirmaTitulo: { color: colors.text, fontFamily: fontFamily.extrabold, fontSize: 20 },
  confirmaAcoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xs },
  confirmaPerigo: { backgroundColor: colors.dangerText }
});
