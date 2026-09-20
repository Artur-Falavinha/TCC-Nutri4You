import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
import * as SecureStore from 'expo-secure-store';

import { api, LoginResponse, ApiResponse, TOKEN_KEY } from '../services/api';
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
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
        email,
        senha: password
      });
      const loginData = response.data.data;

      if (response.status === 200 && loginData?.token) {
        await SecureStore.setItemAsync(TOKEN_KEY, loginData.token);
        Alert.alert('Sucesso', 'Login realizado com sucesso!');
        // navigation.navigate('Home');
      }
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      Alert.alert(
        status === 401 ? 'Erro de autenticação' : 'Erro',
        message ?? 'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.'
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
      {/* Background Decorator (Opcional, reproduzindo o blur do Figma) */}
      <View style={styles.blurDecorator} />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          
          {/* Email Input */}
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

          {/* Password Input */}
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

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => navigation.navigate('TrocarSenha')}
          >
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Submit Button */}
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
    alignItems: 'center',
  },
  blurDecorator: {
    position: 'absolute',
    bottom: 88,
    left: -6,
    width: 156,
    height: 354,
    backgroundColor: 'rgba(149, 242, 240, 0.2)',
    borderRadius: 9999,
    // Nota: Efeitos de Blur nativos exigem bibliotecas como expo-blur, 
    // mas deixamos a cor de fundo aproximada.
  },
  content: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  logoContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 45,
  },
  logo: {
    width: '100%',
    height: 132,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    // Drop shadow
    shadowColor: 'rgba(26, 28, 28, 0.06)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#6f7a6c',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIconLeft: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#2d3335',
    height: '100%',
  },
  iconRight: {
    padding: 5,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    color: '#005414',
  },
  button: {
    backgroundColor: '#005414', // Fallback caso não use LinearGradient
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(26, 28, 28, 0.06)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
    marginRight: 8,
  },
});

