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
  ActivityIndicator,
  Modal,
  Pressable,
  Linking,
  type LayoutRectangle
} from 'react-native';

import { AuthScreenLayout } from '../components/auth/AuthScreenLayout';
import { ConfirmarEmailCadastro } from '../components/auth/ConfirmarEmailCadastro';
import { authFormStyles } from '../components/auth/authFormStyles';
import { toast } from '../components/feedback/toast';
import { autocadastrarPaciente } from '../core/auth/auth.service';
import type { ComprovanteCadastro } from '../core/auth/auth.models';
import { URL_TERMOS, VERSAO_TERMOS } from '../core/perfil/privacidade';
import { ApiError } from '../core/api/api-response.types';
import { formatCpfDisplay, isCpfComplete, normalizeCpf } from '../core/utils/cpf-mask.util';
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

    if (cpf.trim() && !isCpfComplete(cpf)) {
      toast.aviso('CPF incompleto. Use o formato 000.000.000-00.');
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
        cpf: normalizeCpf(cpf),
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
        <View style={authFormStyles.card}>
          <View style={authFormStyles.header}>
            <Text style={authFormStyles.title} accessibilityRole="header">Crie sua conta</Text>
            <Text style={authFormStyles.description}>E-mail confirmado: {email}</Text>
          </View>

          <View style={authFormStyles.inputGroup}>
            <Text style={authFormStyles.label}>NOME COMPLETO *</Text>
            <View style={authFormStyles.inputContainer}>
              <Feather name="user" size={20} color="#64748b" style={authFormStyles.inputIcon} />
              <TextInput
                style={authFormStyles.input}
                placeholder="Seu Nome"
                placeholderTextColor="#94a3b8"
                value={nome}
                onChangeText={setNome}
              />
            </View>
          </View>

          <View style={authFormStyles.inputGroup}>
            <Text style={authFormStyles.label}>SENHA *</Text>
            <View style={authFormStyles.inputContainer}>
              <Feather name="lock" size={20} color="#64748b" style={authFormStyles.inputIcon} />
              <TextInput
                style={authFormStyles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!senhaVisivel}
                value={senha}
                onChangeText={setSenha}
              />
              <TouchableOpacity
                style={styles.iconRight}
                onPress={() => setSenhaVisivel((visivel) => !visivel)}
                accessibilityRole="button"
                accessibilityLabel={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <Feather
                  name={senhaVisivel ? 'eye-off' : 'eye'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={authFormStyles.inputGroup}>
            <Text style={authFormStyles.label}>CONFIRMAR SENHA *</Text>
            <View style={authFormStyles.inputContainer}>
              <Feather name="lock" size={20} color="#64748b" style={authFormStyles.inputIcon} />
              <TextInput
                style={authFormStyles.input}
                placeholder="Repita a senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!confirmacaoSenhaVisivel}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
              <TouchableOpacity
                style={styles.iconRight}
                onPress={() => setConfirmacaoSenhaVisivel((visivel) => !visivel)}
                accessibilityRole="button"
                accessibilityLabel={confirmacaoSenhaVisivel ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
              >
                <Feather
                  name={confirmacaoSenhaVisivel ? 'eye-off' : 'eye'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={authFormStyles.inputGroup}>
            <Text style={authFormStyles.label}>CPF</Text>
            <View style={authFormStyles.inputContainer}>
              <Feather name="credit-card" size={20} color="#64748b" style={authFormStyles.inputIcon} />
              <TextInput
                style={authFormStyles.input}
                placeholder="000.000.000-00"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={14}
                value={cpf}
                onChangeText={(text) => setCpf(formatCpfDisplay(text))}
              />
            </View>
          </View>

          <View style={authFormStyles.inputGroup}>
            <Text style={authFormStyles.label}>TELEFONE</Text>
            <View style={authFormStyles.inputContainer}>
              <Feather name="phone" size={20} color="#64748b" style={authFormStyles.inputIcon} />
              <TextInput
                style={authFormStyles.input}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={15}
                value={telefone}
                onChangeText={(text) => setTelefone(formatPhoneDisplay(text))}
              />
            </View>
          </View>

          <View
            style={authFormStyles.inputGroup}
            onLayout={(evento) => setAreaCampoSexo(evento.nativeEvent.layout)}
          >
            <Text style={authFormStyles.label}>SEXO</Text>
            <TouchableOpacity
              style={authFormStyles.inputContainer}
              onPress={() => setSeletorSexoAberto((aberto) => !aberto)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Sexo, ${sexoLabel}`}
              aria-expanded={seletorSexoAberto}
            >
              <Text
                style={[
                  authFormStyles.input,
                  styles.selectValue,
                  sexo === null && styles.selectPlaceholder
                ]}
                numberOfLines={1}
              >
                {sexoLabel}
              </Text>
              <Feather name={seletorSexoAberto ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
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
                    {selecionada && <Feather name="check" size={18} color="#006f1e" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={authFormStyles.inputGroup}>
            <Text style={authFormStyles.label}>DATA NASCIMENTO</Text>
            <View style={authFormStyles.inputContainer}>
              {Platform.OS === 'web' ? (
                <>
                  <Feather name="calendar" size={20} color="#005414" style={authFormStyles.inputIcon} />
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
                      width: 52,
                      height: 56,
                      opacity: 0,
                      cursor: 'pointer',
                      border: 'none',
                      zIndex: 2
                    },
                    'aria-label': 'Abrir seletor de data'
                  })}
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir seletor de data"
                >
                  <Feather name="calendar" size={20} color="#005414" style={authFormStyles.inputIcon} />
                </TouchableOpacity>
              )}
              <TextInput
                style={authFormStyles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={10}
                accessibilityLabel="Data de nascimento"
                value={dataNascimento}
                onChangeText={(text) => setDataNascimento(formatDateDisplay(text))}
              />
            </View>
          </View>

          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`${URL_TERMOS}/${VERSAO_TERMOS}`)
            .catch(() => toast.aviso('Não foi possível abrir os termos.'))}>
            <Text style={styles.termosLink}>Ler termos de uso e aviso de privacidade (PDF)</Text>
          </Pressable>
          <Pressable style={styles.termosAceite} accessibilityRole="checkbox" accessibilityState={{ checked: aceitouTermos }}
            onPress={() => setAceitouTermos(valor => !valor)}>
            <View style={[styles.termosCheck, aceitouTermos && styles.termosCheckAtivo]}>
              {aceitouTermos && <Feather name="check" size={15} color="#fff" />}
            </View>
            <Text style={styles.termosTexto}>Li e aceito os termos de uso.</Text>
          </Pressable>
          <TouchableOpacity
            style={authFormStyles.button}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={authFormStyles.buttonText}>Criar conta</Text>
                <Feather name="arrow-right" size={16} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={authFormStyles.secondaryAction}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
          >
            <Text style={authFormStyles.secondaryActionText}>Já tenho conta</Text>
          </TouchableOpacity>
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
  termosLink: { color: '#006f1e', fontWeight: '700', paddingVertical: 8 },
  termosAceite: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginBottom: 12 },
  termosCheck: { width: 22, height: 22, borderWidth: 1, borderColor: '#94a3b8', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  termosCheckAtivo: { backgroundColor: '#006f1e', borderColor: '#006f1e' },
  termosTexto: { flex: 1, color: '#334155', fontSize: 14 },
  iconRight: {
    padding: 5
  },
  selectValue: {
    textAlignVertical: 'center',
    paddingVertical: 18
  },
  selectPlaceholder: {
    color: '#94a3b8'
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4
  },
  opcaoSexo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  opcaoSexoSelecionada: {
    backgroundColor: 'rgba(0, 111, 30, 0.08)'
  },
  textoOpcaoSexo: {
    flexShrink: 1,
    fontSize: 15,
    color: '#2d3335'
  },
  textoOpcaoSexoSelecionada: {
    fontWeight: '700',
    color: '#006f1e'
  },
  iosPickerCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 'auto'
  },
  iosPickerHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0'
  },
  iosPickerDone: {
    fontSize: 16,
    fontWeight: '700',
    color: '#006f1e'
  }
});
