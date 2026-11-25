import React, { useMemo, useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent
} from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  type LayoutRectangle
} from 'react-native';

import { AuthFormButton } from '../components/auth/AuthFormButton';
import { AuthScreenLayout } from '../components/auth/AuthScreenLayout';
import { ConfirmarEmailCadastro } from '../components/auth/ConfirmarEmailCadastro';
import { authFormStyles } from '../components/auth/authFormStyles';
import { recuperacaoSenhaStyles as formulario } from '../components/auth/recuperacaoSenhaStyles';
import { SectionCardHeader, sectionCardStyles } from '../components/layout/SectionCardHeader';
import { toast } from '../components/feedback/toast';
import { autocadastrarPaciente } from '../core/auth/auth.service';
import type { ComprovanteCadastro } from '../core/auth/auth.models';
import { URL_TERMOS, VERSAO_TERMOS } from '../core/perfil/privacidade';
import { ApiError } from '../core/api/api-response.types';
import { formatCpfDisplay, isCpfValid, normalizeCpf } from '../core/utils/cpf-mask.util';
import {
  DATA_MINIMA_NASCIMENTO,
  dataNascimentoParaIso,
  toIsoDate,
  formatarDataCivil,
  formatDateDisplay,
  formatDateFromDate,
  parseDisplayDate
} from '../core/utils/date-mask.util';
import { formatPhoneDisplay, normalizePhone } from '../core/utils/phone-mask.util';
import type { RootStackParamList } from '../navigation/types';
import { colors, fontFamily, radius, spacing } from '../theme/tokens';
import { perfilStyles } from './home/perfil.styles';

const SEXO_OPTIONS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Feminino', value: 'Feminino' },
  { label: 'Prefiro não informar', value: '' }
] as const;

type SexoOption = (typeof SEXO_OPTIONS)[number];

const MIN_BIRTH_DATE = new Date(`${DATA_MINIMA_NASCIMENTO}T00:00:00`);

export default function CriarContaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [confirmacao, setConfirmacao] = useState<ComprovanteCadastro | null>(null);

  return confirmacao ? (
    <DadosCadastroPaciente confirmacao={confirmacao} aoExpirar={() => setConfirmacao(null)} />
  ) : (
    <ConfirmarEmailCadastro aoConfirmar={setConfirmacao} aoVoltar={() => navigation.popTo('Login')} />
  );
}

interface DadosCadastroPacienteProps {
  confirmacao: ComprovanteCadastro;
  aoExpirar: () => void;
}

function DadosCadastroPaciente({ confirmacao, aoExpirar }: DadosCadastroPacienteProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [nome, setNome] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const email = confirmacao.email;
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [sexo, setSexo] = useState<SexoOption['value'] | null>(null);
  const [dataNascimento, setDataNascimento] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmacaoSenhaVisivel, setConfirmacaoSenhaVisivel] = useState(false);
  const [seletorSexoAberto, setSeletorSexoAberto] = useState(false);
  const [areaCampoSexo, setAreaCampoSexo] = useState<LayoutRectangle | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hoje = new Date();
  const hojeIso = toIsoDate(formatDateFromDate(hoje)) ?? '';
  const isoDate = dataNascimentoParaIso(dataNascimento);

  const sexoLabel = useMemo(() => {
    if (sexo === null) {
      return 'Selecione';
    }
    return SEXO_OPTIONS.find((option) => option.value === sexo)?.label ?? 'Selecione';
  }, [sexo]);

  const pickerDate = useMemo(() => {
    return (isoDate && isoDate <= hojeIso ? parseDisplayDate(isoDate) : null) ?? new Date(2000, 0, 1);
  }, [hojeIso, isoDate]);

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selected) {
      setDataNascimento(formatDateFromDate(selected));
    }
  };

  const handleRegister = async () => {
    if (Date.parse(confirmacao.expiraEm) <= Date.now()) {
      toast.aviso('Confirmação expirada. Solicite outro e-mail para continuar.');
      aoExpirar();
      return;
    }
    if (!aceitouTermos) {
      toast.aviso('Leia e aceite os termos de uso para criar a conta.');
      return;
    }
    if (!nome.trim() || !senha || !confirmarSenha) {
      toast.aviso('Preencha nome e senha.');
      return;
    }

    if (senha.length < 8) {
      toast.aviso('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      toast.erro('As senhas não coincidem.');
      return;
    }

    const cpfInformado = cpf.trim();
    const cpfParaEnvio = isCpfValid(cpfInformado) ? normalizeCpf(cpfInformado) : undefined;
    if (!cpfParaEnvio) {
      toast.aviso(cpfInformado ? 'Informe um CPF válido com 11 dígitos.' : 'Informe seu CPF.');
      return;
    }

    if (dataNascimento.trim() && !isoDate) {
      toast.aviso('Data de nascimento inválida. Use DD/MM/AAAA.');
      return;
    }

    setIsLoading(true);

    try {
      const cadastro = await autocadastrarPaciente({
        nome,
        email,
        tokenCadastro: confirmacao.token,
        senha,
        cpf: cpfParaEnvio,
        telefone: normalizePhone(telefone),
        sexo: sexo || undefined,
        dataNascimento: isoDate,
        versaoTermos: VERSAO_TERMOS
      });

      toast.sucesso(cadastro?.mensagem ?? 'Conta criada com sucesso!');
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    } catch (err: unknown) {
      const apiError = err instanceof ApiError ? err : null;
      toast.erro(apiError?.message ??
          'Ocorreu um erro ao tentar criar a conta. Tente novamente mais tarde.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthScreenLayout>
        <View style={sectionCardStyles.superficie}>
          <View style={formulario.cabecalho}>
            <SectionCardHeader icone="user-plus" titulo="Complete seu cadastro" />
            <Text style={authFormStyles.etapa}>Cadastro · 3 de 3</Text>
          </View>

          <View style={formulario.campo}>
            <Text style={formulario.rotulo}>E-mail confirmado</Text>
            <View style={[formulario.controle, authFormStyles.somenteLeitura]}>
              <Feather name="check-circle" size={18} color={colors.brandDark} aria-hidden />
              <Text style={authFormStyles.valorSomenteLeitura}>{email}</Text>
            </View>
          </View>

          <View style={formulario.campo}>
            <Text style={formulario.rotulo}>Nome completo *</Text>
            <View style={formulario.controle}>
              <Feather name="user" size={18} color={colors.textSecondary} aria-hidden />
              <TextInput
                style={formulario.entrada}
                placeholder="Seu nome"
                accessibilityLabel="Nome completo"
                autoComplete="name"
                placeholderTextColor={colors.textSecondary}
                value={nome}
                onChangeText={setNome}
              />
            </View>
          </View>

          <View style={formulario.campo}>
            <Text style={formulario.rotulo}>Senha *</Text>
            <View style={[formulario.controle, authFormStyles.controleComVisibilidade]}>
              <Feather name="lock" size={18} color={colors.textSecondary} aria-hidden />
              <TextInput
                style={formulario.entrada}
                placeholder="Mínimo 8 caracteres"
                accessibilityLabel="Senha"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!senhaVisivel}
                value={senha}
                onChangeText={setSenha}
              />
              <Pressable
                style={({ pressed }) => [authFormStyles.visibilidade, pressed && perfilStyles.pressionado]}
                onPress={() => setSenhaVisivel((visivel) => !visivel)}
                accessibilityRole="button"
                accessibilityLabel={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <Feather
                  name={senhaVisivel ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.brandDark}
                  aria-hidden
                />
              </Pressable>
            </View>
          </View>

          <View style={formulario.campo}>
            <Text style={formulario.rotulo}>Confirmar senha *</Text>
            <View style={[formulario.controle, authFormStyles.controleComVisibilidade]}>
              <Feather name="lock" size={18} color={colors.textSecondary} aria-hidden />
              <TextInput
                style={formulario.entrada}
                placeholder="Repita a senha"
                accessibilityLabel="Confirmar senha"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!confirmacaoSenhaVisivel}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
              <Pressable
                style={({ pressed }) => [authFormStyles.visibilidade, pressed && perfilStyles.pressionado]}
                onPress={() => setConfirmacaoSenhaVisivel((visivel) => !visivel)}
                accessibilityRole="button"
                accessibilityLabel={confirmacaoSenhaVisivel ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
              >
                <Feather
                  name={confirmacaoSenhaVisivel ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.brandDark}
                  aria-hidden
                />
              </Pressable>
            </View>
          </View>

          <View style={formulario.campo}>
            <Text style={formulario.rotulo}>CPF *</Text>
            <View style={formulario.controle}>
              <Feather name="credit-card" size={18} color={colors.textSecondary} aria-hidden />
              <TextInput
                style={formulario.entrada}
                placeholder="000.000.000-00"
                accessibilityLabel="CPF"
                aria-required
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={cpf}
                onChangeText={(text) => setCpf(formatCpfDisplay(text))}
              />
            </View>
          </View>

          <View style={formulario.campo}>
            <Text style={formulario.rotulo}>Telefone</Text>
            <View style={formulario.controle}>
              <Feather name="phone" size={18} color={colors.textSecondary} aria-hidden />
              <TextInput
                style={formulario.entrada}
                placeholder="(00) 00000-0000"
                accessibilityLabel="Telefone"
                autoComplete="tel"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={15}
                value={telefone}
                onChangeText={(text) => setTelefone(formatPhoneDisplay(text))}
              />
            </View>
          </View>

          <View
            style={formulario.campo}
            onLayout={(evento) => setAreaCampoSexo(evento.nativeEvent.layout)}
          >
            <Text style={formulario.rotulo}>Sexo</Text>
            <TouchableOpacity
              style={formulario.controle}
              onPress={() => setSeletorSexoAberto((aberto) => !aberto)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Sexo, ${sexoLabel}`}
              aria-expanded={seletorSexoAberto}
            >
              <Text
                style={[
                  formulario.entrada,
                  styles.selectValue,
                  sexo === null && styles.selectPlaceholder
                ]}
                numberOfLines={1}
              >
                {sexoLabel}
              </Text>
              <Feather name={seletorSexoAberto ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} aria-hidden />
            </TouchableOpacity>
          </View>

          {seletorSexoAberto && areaCampoSexo && (
            <View
              style={[
                styles.opcoesSexo,
                {
                  left: areaCampoSexo.x,
                  top: areaCampoSexo.y + areaCampoSexo.height + 4,
                  width: areaCampoSexo.width
                }
              ]}
              accessibilityRole="radiogroup"
              accessibilityLabel="Opções de sexo"
            >
              {SEXO_OPTIONS.map((opcao) => {
                const selecionada = sexo === opcao.value;
                return (
                  <TouchableOpacity
                    key={opcao.value}
                    style={[styles.opcaoSexo, selecionada && styles.opcaoSexoSelecionada]}
                    onPress={() => {
                      setSexo(opcao.value);
                      setSeletorSexoAberto(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityLabel={opcao.label}
                    aria-checked={selecionada}
                  >
                    <Text style={[styles.textoOpcaoSexo, selecionada && styles.textoOpcaoSexoSelecionada]}>
                      {opcao.label}
                    </Text>
                    {selecionada && <Feather name="check" size={18} color={colors.brand} aria-hidden />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={formulario.campo}>
            <Text style={formulario.rotulo}>Data de nascimento</Text>
            <View style={[formulario.controle, styles.controleData]}>
              {Platform.OS === 'web' ? (
                <View style={styles.acaoData}>
                  <Feather name="calendar" size={18} color={colors.brandDark} aria-hidden />
                  {React.createElement('input', {
                    type: 'date',
                    lang: 'pt-BR',
                    value: isoDate ?? '',
                    min: DATA_MINIMA_NASCIMENTO,
                    max: hojeIso,
                    onChange: (evento: React.ChangeEvent<HTMLInputElement>) =>
                      setDataNascimento(formatarDataCivil(evento.currentTarget.value)),
                    // Cobre o icone: clique nativo do browser abre o date picker.
                    style: {
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      border: 'none',
                      zIndex: 2
                    },
                    'aria-label': 'Abrir seletor de data'
                  })}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.acaoData}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir seletor de data"
                >
                  <Feather name="calendar" size={18} color={colors.brandDark} aria-hidden />
                </TouchableOpacity>
              )}
              <TextInput
                style={formulario.entrada}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={10}
                accessibilityLabel="Data de nascimento"
                value={dataNascimento}
                onChangeText={(text) => setDataNascimento(formatDateDisplay(text))}
              />
            </View>
          </View>

          <Pressable style={styles.termosLinkArea} accessibilityRole="link" onPress={() => void Linking.openURL(`${URL_TERMOS}/${VERSAO_TERMOS}`)
            .catch(() => toast.aviso('Não foi possível abrir os termos.'))}>
            <Text style={styles.termosLink}>Ler termos de uso e aviso de privacidade (PDF)</Text>
          </Pressable>
          <Pressable style={styles.termosAceite} accessibilityRole="checkbox" accessibilityState={{ checked: aceitouTermos }}
            onPress={() => setAceitouTermos(valor => !valor)}>
            <View style={[styles.termosCheck, aceitouTermos && styles.termosCheckAtivo]}>
              {aceitouTermos && <Feather name="check" size={15} color={colors.white} aria-hidden />}
            </View>
            <Text style={styles.termosTexto}>Li e aceito os termos de uso.</Text>
          </Pressable>
          <View style={formulario.acoes}>
            <AuthFormButton titulo="Criar conta" icone="arrow-right" ocupado={isLoading} onPress={() => void handleRegister()} />
            <AuthFormButton titulo="Já tenho conta" icone="arrow-left" variante="texto" onPress={() => navigation.navigate('Login')} />
          </View>
        </View>
      </AuthScreenLayout>

      {showDatePicker && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
            <View style={styles.iosPickerCard}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosPickerDone}>Concluído</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                locale="pt-BR"
                maximumDate={hoje}
                minimumDate={MIN_BIRTH_DATE}
                onChange={onDateChange}
              />
            </View>
          </Pressable>
        </Modal>
      ) : null}

      {showDatePicker && (Platform.OS === 'android' || Platform.OS === 'windows') ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          maximumDate={hoje}
          minimumDate={MIN_BIRTH_DATE}
          onChange={onDateChange}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  termosLinkArea: { minHeight: 44, justifyContent: 'center' },
  termosLink: { color: colors.brandDark, fontFamily: fontFamily.bold },
  termosAceite: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  termosCheck: { width: 22, height: 22, borderWidth: 1, borderColor: colors.textSecondary, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  termosCheckAtivo: { backgroundColor: colors.brand, borderColor: colors.brand },
  termosTexto: { flex: 1, color: colors.text, fontFamily: fontFamily.regular, fontSize: 14 },
  controleData: { paddingLeft: 0, gap: spacing.xxs },
  acaoData: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  selectValue: {
    textAlignVertical: 'center',
    paddingVertical: spacing.sm
  },
  selectPlaceholder: {
    color: colors.textSecondary
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24
  },
  opcoesSexo: {
    position: 'absolute',
    zIndex: 3,
    elevation: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 4
  },
  opcaoSexo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm
  },
  opcaoSexoSelecionada: {
    backgroundColor: colors.confirmedBackground
  },
  textoOpcaoSexo: {
    flexShrink: 1,
    fontSize: 15,
    color: colors.text
  },
  textoOpcaoSexoSelecionada: {
    fontWeight: '700',
    color: colors.brand
  },
  iosPickerCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 'auto'
  },
  iosPickerHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  iosPickerDone: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand
  }
});
