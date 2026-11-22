import React, { useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

import { AuthScreenLayout } from '../components/auth/AuthScreenLayout';
import { authFormStyles } from '../components/auth/authFormStyles';
import { useAppAlert } from '../components/feedback/AppAlertProvider';
import { login } from '../core/auth/auth.service';
import { ApiError } from '../core/api/api-response.types';
import type { RootStackParamList } from '../navigation/types';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showAlert } = useAppAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }]
        })
      );
    } catch (err: unknown) {
      const apiError = err instanceof ApiError ? err : null;
      showAlert(
        apiError?.status === 401
          ? 'Erro de autenticação'
          : apiError?.status === 403
            ? 'Acesso negado'
            : 'Erro',
        apiError?.message ??
          'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenLayout>
      <View style={authFormStyles.card}>
        <View style={authFormStyles.inputGroup}>
          <Text style={authFormStyles.label}>EMAIL</Text>
          <View style={authFormStyles.inputContainer}>
            <Feather name="mail" size={20} color="#64748b" style={authFormStyles.inputIcon} />
            <TextInput
              style={authFormStyles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={authFormStyles.inputGroup}>
          <Text style={authFormStyles.label}>SENHA</Text>
          <View style={authFormStyles.inputContainer}>
            <Feather name="lock" size={20} color="#64748b" style={authFormStyles.inputIcon} />
            <TextInput
              style={authFormStyles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
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

        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={() => navigation.navigate('TrocarSenha')}
        >
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={authFormStyles.button}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={authFormStyles.buttonText}>Entrar</Text>
              <Feather name="arrow-right" size={16} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={authFormStyles.secondaryAction}
          onPress={() => navigation.navigate('CriarConta')}
        >
          <Text style={authFormStyles.secondaryActionText}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  iconRight: {
    padding: 5
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#005414'
  }
});
