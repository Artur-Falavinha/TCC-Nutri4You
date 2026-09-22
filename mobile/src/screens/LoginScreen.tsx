import React, { useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';

import { login } from '../core/auth/auth.service';
import { ApiError } from '../core/api/api-response.types';
import type { RootStackParamList } from '../navigation/types';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }]
        })
      );
    } catch (err: unknown) {
      const apiError = err instanceof ApiError ? err : null;
      Alert.alert(
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.blurDecorator} />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#64748b" style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SENHA</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#64748b" style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
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
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Entrar</Text>
                <Feather name="arrow-right" size={16} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createAccountContainer}
            onPress={() => navigation.navigate('CriarConta')}
          >
            <Text style={styles.createAccountText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  blurDecorator: {
    position: 'absolute',
    bottom: 88,
    left: -6,
    width: 156,
    height: 354,
    backgroundColor: 'rgba(149, 242, 240, 0.2)',
    borderRadius: 9999
  },
  content: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 16,
    zIndex: 10
  },
  logoContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 45
  },
  logo: {
    width: '100%',
    height: 132
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: 'rgba(26, 28, 28, 0.06)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6f7a6c',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16
  },
  inputIconLeft: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2d3335',
    height: '100%'
  },
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
  },
  button: {
    backgroundColor: '#005414',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(26, 28, 28, 0.06)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 8
  },
  createAccountContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  createAccountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#005414'
  }
});
