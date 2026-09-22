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
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable
} from 'react-native';

import { autocadastrarPaciente } from '../core/auth/auth.service';
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
  const webDateInputRef = useRef<HTMLInputElement | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
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
    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e senha.');
      return;
    }

    if (senha.length < 8) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (cpf.trim() && !isCpfComplete(cpf)) {
      Alert.alert('Atenção', 'CPF incompleto. Use o formato 000.000.000-00.');
      return;
    }

    const isoDate = dataNascimento.trim() ? toIsoDate(dataNascimento) : undefined;
    if (dataNascimento.trim() && !isoDate) {
      Alert.alert('Atenção', 'Data de nascimento inválida. Use DD/MM/AAAA.');
      return;
    }

    setIsLoading(true);

    try {
      await autocadastrarPaciente({
        nome,
        email,
        senha,
        cpf: normalizeCpf(cpf),
        telefone: normalizePhone(telefone),
        sexo: sexo || undefined,
        dataNascimento: isoDate
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login para continuar.', [
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
      Alert.alert(
        'Erro',
        apiError?.message ??
          'Ocorreu um erro ao tentar criar a conta. Tente novamente mais tarde.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Crie Sua Conta</Text>
          <Text style={styles.subtitle}>Cadastro de paciente no Nutri4You</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOME COMPLETO *</Text>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#64748b" style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
                placeholder="Seu Nome"
                placeholderTextColor="#94a3b8"
                value={nome}
                onChangeText={setNome}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-MAIL *</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#64748b" style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SENHA *</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#64748b" style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONFIRMAR SENHA *</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#64748b" style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
                placeholder="Repita a senha"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>CPF</Text>
              <View style={styles.inputContainer}>
                <Feather name="credit-card" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={14}
                  value={cpf}
                  onChangeText={(text) => setCpf(formatCpfDisplay(text))}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>TELEFONE</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={15}
                  value={telefone}
                  onChangeText={(text) => setTelefone(formatPhoneDisplay(text))}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SEXO</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setSexoMenuOpen(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.input,
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATA NASCIMENTO</Text>
            <View style={styles.inputContainer}>
              {Platform.OS === 'web' ? (
                <>
                  <Feather name="calendar" size={20} color="#005414" style={styles.inputIconLeft} />
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
                  <Feather name="calendar" size={20} color="#005414" style={styles.inputIconLeft} />
                </TouchableOpacity>
              )}
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={10}
                value={dataNascimento}
                onChangeText={(text) => setDataNascimento(formatDateDisplay(text))}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Criar conta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20
  },
  header: {
    marginBottom: 35,
    alignItems: 'center'
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#006f1e',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center'
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 2
  },
  inputGroup: {
    marginBottom: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  flex1: {
    flex: 1
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderColor: '#f4f4f5',
    borderWidth: 1,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden'
  },
  inputIconLeft: {
    marginRight: 12
  },
  iconRight: {
    padding: 5
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#2d3335',
    height: '100%'
  },
  selectValue: {
    textAlignVertical: 'center',
    paddingVertical: 18
  },
  selectPlaceholder: {
    color: '#94a3b8'
  },
  button: {
    backgroundColor: '#006f1e',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: 'rgba(20, 83, 45, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff'
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006f1e'
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
