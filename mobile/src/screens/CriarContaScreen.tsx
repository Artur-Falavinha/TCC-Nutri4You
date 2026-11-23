import React, { useMemo, useRef, useState } from 'react';
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
  Linking
} from 'react-native';

import { AuthScreenLayout } from '../components/auth/AuthScreenLayout';
import { ConfirmarEmailCadastro } from '../components/auth/ConfirmarEmailCadastro';
import { authFormStyles } from '../components/auth/authFormStyles';
import { useAppAlert } from '../components/feedback/AppAlertProvider';
import { autocadastrarPaciente } from '../core/auth/auth.service';
import type { ComprovanteCadastro } from '../core/auth/auth.models';
import { URL_TERMOS, VERSAO_TERMOS } from '../core/perfil/privacidade';
import { ApiError } from '../core/api/api-response.types';
import { formatCpfDisplay, isCpfComplete, normalizeCpf } from '../core/utils/cpf-mask.util';
import {
  toIsoDate,
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

const MIN_BIRTH_DATE = new Date(1900, 0, 1);
const TODAY = new Date();

function toHtmlDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const { showAlert } = useAppAlert();
  const webDateInputRef = useRef<HTMLInputElement | null>(null);
  const [nome, setNome] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const email = confirmacao.email;
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [sexo, setSexo] = useState<SexoOption['value'] | null>(null);
  const [dataNascimento, setDataNascimento] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sexoMenuOpen, setSexoMenuOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sexoLabel = useMemo(() => {
    if (sexo === null) {
      return 'Selecione';
    }
    return SEXO_OPTIONS.find((option) => option.value === sexo)?.label ?? 'Selecione';
  }, [sexo]);

  const pickerDate = useMemo(() => {
    return parseDisplayDate(dataNascimento) ?? new Date(2000, 0, 1);
  }, [dataNascimento]);

  const openDatePicker = () => {
    // DateTimePicker nao tem UI no web (retorna null + warning).
    if (Platform.OS === 'web') {
      const input = webDateInputRef.current;
      if (!input) {
        return;
      }
      if (typeof input.showPicker === 'function') {
        try {
          input.showPicker();
          return;
        } catch {
          // browsers sem showPicker caem no click()
        }
      }
      input.click();
      return;
    }
    setShowDatePicker(true);
  };

  const onWebDateInputChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    if (!value) {
      return;
    }
    const [year, month, day] = value.split('-').map(Number);
    setDataNascimento(formatDateFromDate(new Date(year, month - 1, day)));
  };

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
      showAlert('Confirmação expirada', 'Solicite outro e-mail para continuar.');
      aoExpirar();
      return;
    }
    if (!aceitouTermos) {
      showAlert('Atenção', 'Leia e aceite os termos de uso para criar a conta.');
      return;
    }
    if (!nome.trim() || !senha || !confirmarSenha) {
      showAlert('Atenção', 'Preencha nome e senha.');
      return;
    }

    if (senha.length < 8) {
      showAlert('Atenção', 'A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      showAlert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (cpf.trim() && !isCpfComplete(cpf)) {
      showAlert('Atenção', 'CPF incompleto. Use o formato 000.000.000-00.');
      return;
    }

    const isoDate = dataNascimento.trim() ? toIsoDate(dataNascimento) : undefined;
    if (dataNascimento.trim() && !isoDate) {
      showAlert('Atenção', 'Data de nascimento inválida. Use DD/MM/AAAA.');
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

      showAlert('Sucesso', cadastro?.mensagem ?? 'Conta criada com sucesso!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }]
              })
            )
        }
      ]);
    } catch (err: unknown) {
      const apiError = err instanceof ApiError ? err : null;
      showAlert(
        'Erro',
        apiError?.message ??
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
                secureTextEntry={!showPassword}
                value={senha}
                onChangeText={setSenha}
              />
              <TouchableOpacity
                style={styles.iconRight}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
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
                secureTextEntry={!showPassword}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
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

          <View style={authFormStyles.inputGroup}>
            <Text style={authFormStyles.label}>SEXO</Text>
            <TouchableOpacity
              style={authFormStyles.inputContainer}
              onPress={() => setSexoMenuOpen(true)}
              activeOpacity={0.8}
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
              <Feather name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={authFormStyles.inputGroup}>
            <Text style={authFormStyles.label}>DATA NASCIMENTO</Text>
            <View style={authFormStyles.inputContainer}>
              {Platform.OS === 'web' ? (
                <>
                  <Feather name="calendar" size={20} color="#005414" style={authFormStyles.inputIcon} />
                  {React.createElement('input', {
                    ref: webDateInputRef,
                    type: 'date',
                    value: dataNascimento ? toHtmlDateValue(pickerDate) : '',
                    min: toHtmlDateValue(MIN_BIRTH_DATE),
                    max: toHtmlDateValue(TODAY),
                    onChange: onWebDateInputChange,
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
                  onPress={openDatePicker}
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
                value={dataNascimento}
                onChangeText={(text) => setDataNascimento(formatDateDisplay(text))}
              />
            </View>
          </View>

          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(URL_TERMOS).catch(() =>
            showAlert('Atenção', 'Não foi possível abrir os termos.'))}>
            <Text style={styles.termosLink}>Ler termos de uso e aviso de privacidade</Text>
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

      <Modal
        visible={sexoMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSexoMenuOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSexoMenuOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sexo</Text>
            {SEXO_OPTIONS.map((option) => {
              const selected = sexo !== null && sexo === option.value;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => {
                    setSexo(option.value);
                    setSexoMenuOpen(false);
                  }}
                >
                  <Text
                    style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}
                  >
                    {option.label}
                  </Text>
                  {selected ? <Feather name="check" size={18} color="#006f1e" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

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
                maximumDate={TODAY}
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
          maximumDate={TODAY}
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
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#006f1e',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(0, 111, 30, 0.08)'
  },
  modalOptionText: {
    fontSize: 15,
    color: '#2d3335'
  },
  modalOptionTextSelected: {
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
