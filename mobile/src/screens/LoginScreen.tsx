import React, { useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthFormButton } from '../components/auth/AuthFormButton';
import { AuthScreenLayout } from '../components/auth/AuthScreenLayout';
import { authFormStyles } from '../components/auth/authFormStyles';
import { recuperacaoSenhaStyles as formulario } from '../components/auth/recuperacaoSenhaStyles';
import { SectionCardHeader, sectionCardStyles } from '../components/layout/SectionCardHeader';
import { toast } from '../components/feedback/toast';
import { login } from '../core/auth/auth.service';
import { ApiError } from '../core/api/api-response.types';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/tokens';
import { perfilStyles } from './home/perfil.styles';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.aviso('Preencha todos os campos.');
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
      toast.erro(
        apiError?.message ??
          'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenLayout>
      <View style={sectionCardStyles.superficie}>
        <SectionCardHeader icone="log-in" titulo="Acesse sua conta" />

        <View style={formulario.campo}>
          <Text style={formulario.rotulo}>E-mail</Text>
          <View style={formulario.controle}>
            <Feather name="mail" size={18} color={colors.textSecondary} aria-hidden />
            <TextInput
              style={formulario.entrada}
              placeholder="email@exemplo.com"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={formulario.campo}>
          <Text style={formulario.rotulo}>Senha</Text>
          <View style={[formulario.controle, authFormStyles.controleComVisibilidade]}>
            <Feather name="lock" size={18} color={colors.textSecondary} aria-hidden />
            <TextInput
              style={formulario.entrada}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Senha"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              style={({ pressed }) => [authFormStyles.visibilidade, pressed && perfilStyles.pressionado]}
              onPress={() => setShowPassword((visible) => !visible)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.brandDark} aria-hidden />
            </Pressable>
          </View>
        </View>

        <View style={formulario.acoes}>
          <AuthFormButton titulo="Entrar" icone="arrow-right" ocupado={isLoading} onPress={() => void handleLogin()} />
          <AuthFormButton titulo="Esqueci minha senha" variante="texto" onPress={() => navigation.navigate('TrocarSenha')} />
          <AuthFormButton titulo="Criar conta" icone="user-plus" variante="secundario" onPress={() => navigation.navigate('CriarConta')} />
        </View>
      </View>
    </AuthScreenLayout>
  );
}
