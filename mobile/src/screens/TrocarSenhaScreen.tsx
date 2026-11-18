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
  const [menuNotice, setMenuNotice] = useState('');

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
    setMenuNotice('');
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {isAuthenticated ? (
        <>
          <AppHeader onOpenMenu={() => setMenuVisible(true)} />
          <SideMenu
            visible={menuVisible}
            activeItem="password"
            userName={userName}
            onClose={() => setMenuVisible(false)}
            onNavigate={(destination) => void handleMenuNavigate(destination)}
          />
        </>
      ) : null}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isAuthenticated && styles.scrollContentAuthenticated
          ]}
          showsVerticalScrollIndicator={false}
        >
          {menuNotice ? (
            <View style={styles.noticeBox} accessibilityRole="alert">
              <Text style={styles.noticeText}>{menuNotice}</Text>
            </View>
          ) : null}

          <View style={styles.topNavigationRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackNavigation}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={isAuthenticated ? 'Voltar ao início' : 'Voltar para o login'}
              testID="trocar-senha-back-button"
            >
              <Feather name="arrow-left" size={18} color="#005414" />
              <Text style={styles.backButtonText}>
                {isAuthenticated ? 'Voltar ao início' : 'Voltar para o login'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>
              {isAuthenticated ? 'Trocar Senha' : 'Esqueceu a senha?'}
            </Text>
            <Text style={styles.subtitle}>
              Informe o e-mail cadastrado. Se existir, você receberá instruções para redefinir a senha.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL CADASTRADO</Text>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={[styles.input, step === 2 && styles.inputDisabled]}
                  placeholder="email@exemplo.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={step === 1}
                />
              </View>
            </View>

            {step === 2 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CÓDIGO DE VERIFICAÇÃO</Text>
                <View style={[styles.inputContainer, { paddingLeft: 16 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Cole o código recebido"
                    placeholderTextColor="#94a3b8"
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
              testID="trocar-senha-submit-button"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  {step === 1 ? 'Enviar código por e-mail' : 'Continuar'}
                </Text>
              )}
            </TouchableOpacity>

            {step === 2 ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => setStep(1)}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Alterar e-mail informado"
                testID="trocar-senha-edit-email-button"
              >
                <Text style={styles.secondaryActionText}>Alterar e-mail informado</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.securityTip}>
            <Feather name="shield" size={28} color="#005414" style={styles.securityIcon} />
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>DICA DE SEGURANÇA</Text>
              <Text style={styles.securityText}>
                Não compartilhe com ninguém o seu código de verificação.
              </Text>
            </View>
          </View>
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
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16
  },
  scrollContentAuthenticated: {
    paddingTop: 20
  },
  noticeBox: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  noticeText: {
    color: '#006f1e',
    fontSize: 13,
    fontWeight: '600'
  },
  topNavigationRow: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 84, 20, 0.08)'
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#005414'
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 440
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#006f1e',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#2d3335',
    textAlign: 'center',
    lineHeight: 18
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: 'rgba(26, 28, 28, 0.06)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 30
  },
  inputGroup: {
    marginBottom: 24
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6f7a6c',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
    alignSelf: 'flex-end'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    height: 56,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    position: 'relative'
  },
  inputIconLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 1
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2d3335',
    height: '100%'
  },
  inputDisabled: {
    opacity: 0.5
  },
  button: {
    backgroundColor: '#005414',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: 'rgba(26, 28, 28, 0.06)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff'
  },
  secondaryAction: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006f1e'
  },
  securityTip: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(0, 84, 20, 0.05)',
    borderColor: 'rgba(0, 84, 20, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  securityIcon: {
    marginRight: 16,
    marginTop: 2
  },
  securityTextContainer: {
    flex: 1
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005414',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  securityText: {
    fontSize: 14,
    color: '#2d3335',
    lineHeight: 18
  }
});
