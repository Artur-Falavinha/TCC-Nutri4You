import React, { useEffect, useState } from 'react';
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
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthScreenLayout } from '../components/auth/AuthScreenLayout';
import { authFormStyles } from '../components/auth/authFormStyles';
import { useAppAlert } from '../components/feedback/AppAlertProvider';
import { AppHeader } from '../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../components/navigation/SideMenu';
import { logout, solicitarRecuperacaoSenha } from '../core/auth/auth.service';
import { getToken } from '../core/auth/token-storage';
import { carregarPerfil } from '../core/perfil/perfil.service';
import { isValidUuid } from '../core/utils/uuid.util';
import type { RootStackParamList } from '../navigation/types';

export default function TrocarSenhaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showAlert } = useAppAlert();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('Paciente');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    let active = true;

    void getToken()
      .then(async (storedToken) => {
        if (!active) return;
        const hasSession = Boolean(storedToken);
        setIsAuthenticated(hasSession);

        if (hasSession) {
          try {
            const perfil = await carregarPerfil();
            if (!active || !perfil) return;
            if (perfil.nome) {
              setUserName(perfil.nome);
            }
            if (perfil.email) {
              setEmail((prev) => prev || perfil.email);
            }
          } catch {
            // Mantém fallback padrão se o perfil não puder ser carregado
          }
        }
      })
      .catch(() => {
        if (active) {
          setIsAuthenticated(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    if (step === 1) {
      if (!email.trim()) {
        showAlert('Atenção', 'Preencha o e-mail cadastrado.');
        return;
      }
      setIsLoading(true);
      const mensagem = await solicitarRecuperacaoSenha(email);
      setIsLoading(false);
      setStep(2);
      showAlert('Pronto', mensagem);
      return;
    }

    const trimmed = token.trim();
    if (!trimmed) {
      showAlert('Atenção', 'Informe o código de verificação que recebeu por e-mail.');
      return;
    }
    if (!isValidUuid(trimmed)) {
      showAlert('Atenção', 'Código inválido. Confira o código no e-mail recebido.');
      return;
    }
    navigation.navigate('NovaSenha', { token: trimmed });
  };

  const handleBackNavigation = () => {
    if (isAuthenticated) {
      navigation.navigate('Dashboard');
      return;
    }
    navigation.navigate('Login');
  };

  const handleSignOut = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      })
    );
  };

  const handleMenuNavigate = async (destination: MenuDestination) => {
    setMenuVisible(false);
    switch (destination) {
      case 'home':
        navigation.navigate('Dashboard');
        return;
      case 'profile':
        navigation.navigate('DadosPessoais');
        return;
      case 'results':
        navigation.navigate('Evolucao');
        return;
      case 'appointments':
        navigation.navigate('Agenda');
        return;
      case 'diet':
        navigation.navigate('Dieta');
        return;
      case 'shopping':
        navigation.navigate('Compras');
        return;
      case 'password':
        return;
      case 'logout':
        await handleSignOut();
        return;
      case 'exams':
        navigation.navigate('Exames');
        return;
    }
  };

  const backLabel = isAuthenticated ? 'Voltar ao início' : 'Voltar para o login';
  const recoveryCard = (
    <View style={authFormStyles.card}>
      <View style={authFormStyles.header}>
        <Text style={authFormStyles.title} accessibilityRole="header">
          {isAuthenticated ? 'Trocar senha' : 'Esqueceu a senha?'}
        </Text>
        <Text style={authFormStyles.description}>
          {step === 1
            ? 'Informe o e-mail cadastrado para receber um código de verificação.'
            : 'Cole o código recebido por e-mail para redefinir a senha.'}
        </Text>
      </View>

      <View style={authFormStyles.inputGroup}>
        <Text style={authFormStyles.label}>Email cadastrado</Text>
        <View style={authFormStyles.inputContainer}>
          <Feather name="mail" size={20} color="#64748b" style={authFormStyles.inputIcon} />
          <TextInput
            style={[authFormStyles.input, step === 2 && styles.inputDisabled]}
            placeholder="email@exemplo.com"
            placeholderTextColor="#94a3b8"
            accessibilityLabel="Email cadastrado"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={step === 1}
          />
        </View>
      </View>

      {step === 2 && (
        <View style={authFormStyles.inputGroup}>
          <Text style={authFormStyles.label}>Código de verificação</Text>
          <View style={authFormStyles.inputContainer}>
            <Feather name="lock" size={20} color="#64748b" style={authFormStyles.inputIcon} />
            <TextInput
              style={authFormStyles.input}
              placeholder="Cole o código recebido"
              placeholderTextColor="#94a3b8"
              accessibilityLabel="Código de verificação"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={authFormStyles.hint}>Não compartilhe esse código com ninguém.</Text>
        </View>
      )}

      <TouchableOpacity
        style={authFormStyles.button}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: isLoading }}
        testID="trocar-senha-submit-button"
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={authFormStyles.buttonText}>
              {step === 1 ? 'Enviar código por e-mail' : 'Continuar'}
            </Text>
            <Feather name="arrow-right" size={16} color="#ffffff" />
          </>
        )}
      </TouchableOpacity>

      {step === 2 && (
        <TouchableOpacity
          style={authFormStyles.secondaryAction}
          onPress={() => setStep(1)}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Alterar e-mail informado"
          testID="trocar-senha-edit-email-button"
        >
          <Text style={authFormStyles.secondaryActionText}>Alterar e-mail informado</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={authFormStyles.secondaryAction}
        onPress={handleBackNavigation}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="trocar-senha-back-button"
      >
        <Feather name="arrow-left" size={16} color="#005414" />
        <Text style={authFormStyles.secondaryActionText}>{backLabel}</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return <AuthScreenLayout>{recoveryCard}</AuthScreenLayout>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />
      <SideMenu
        visible={menuVisible}
        activeItem="password"
        userName={userName}
        onClose={() => setMenuVisible(false)}
        onNavigate={(destination) => void handleMenuNavigate(destination)}
      />

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>{recoveryCard}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  fill: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16
  },
  content: {
    width: '100%',
    maxWidth: 408
  },
  inputDisabled: {
    opacity: 0.5
  }
});
