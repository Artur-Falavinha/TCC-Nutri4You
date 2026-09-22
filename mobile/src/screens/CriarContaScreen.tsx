import React, { useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
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
  ActivityIndicator
} from 'react-native';

import { autocadastrarPaciente } from '../core/auth/auth.service';
import { ApiError } from '../core/api/api-response.types';
import type { RootStackParamList } from '../navigation/types';

function toIsoDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  return undefined;
}

export default function CriarContaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [sexo, setSexo] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    const isoDate = dataNascimento.trim() ? toIsoDate(dataNascimento) : undefined;
    if (dataNascimento.trim() && !isoDate) {
      Alert.alert('Atenção', 'Data de nascimento inválida. Use AAAA-MM-DD ou DD/MM/AAAA.');
      return;
    }

    setIsLoading(true);

    try {
      await autocadastrarPaciente({
        nome,
        email,
        senha,
        cpf: cpf || undefined,
        telefone: telefone || undefined,
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
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={setCpf}
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
                  value={telefone}
                  onChangeText={setTelefone}
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>SEXO</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Masculino"
                  placeholderTextColor="#94a3b8"
                  value={sexo}
                  onChangeText={setSexo}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>DATA NASCIMENTO</Text>
              <View style={styles.inputContainer}>
                <Feather name="calendar" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={dataNascimento}
                  onChangeText={setDataNascimento}
                />
              </View>
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
    paddingHorizontal: 16
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
  }
});
