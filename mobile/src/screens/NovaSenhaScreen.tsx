import React, { useEffect, useState } from 'react';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
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
import { logout, redefinirSenha } from '../core/auth/auth.service';
import { getToken } from '../core/auth/token-storage';
import { ApiError } from '../core/api/api-response.types';
import { carregarPerfil } from '../core/perfil/perfil.service';
import { isValidUuid } from '../core/utils/uuid.util';
import type { RootStackParamList } from '../navigation/types';

export default function NovaSenhaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showAlert } = useAppAlert();
  const route = useRoute<RouteProp<RootStackParamList, 'NovaSenha'>>();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('Paciente');
  const [menuVisible, setMenuVisible] = useState(false);

  const token = route.params?.token?.trim() ?? '';

  useEffect(() => {
    let active = true;
    void getToken()
      .then(async (storedToken) => {
        if (!active) return;
        const hasSession = Boolean(storedToken);
        setIsAuthenticated(hasSession);
        if (hasSession) {
          const perfil = await carregarPerfil().catch(() => null);
          if (active && perfil?.nome) {
            setUserName(perfil.nome);
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

  useEffect(() => {
    if (!token || !isValidUuid(token)) {
      showAlert('Link inválido', 'Token de redefinição ausente ou inválido.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('TrocarSenha')
        }
      ]);
    }
  }, [token, navigation, showAlert]);

  const handleSubmit = async () => {
    if (!token || !isValidUuid(token)) {
      showAlert('Erro', 'Token de redefinição ausente ou inválido.');
      return;
    }

    if (!novaSenha || !confirmarSenha) {
      showAlert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (novaSenha.length < 8) {
      showAlert('Atenção', 'A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      showAlert('Erro', 'As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsLoading(true);

    try {
      await redefinirSenha(token, novaSenha);
      showAlert('Sucesso', 'Senha alterada com sucesso!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: isAuthenticated ? 'Dashboard' : 'Login' }]
              })
            )
        }
      ]);
    } catch (err: unknown) {
      const apiError = err instanceof ApiError ? err : null;
      const mensagem =
        apiError?.error === 'REQUISICAO_INVALIDA' || apiError?.status === 400
          ? 'Token inválido ou expirado. Solicite uma nova recuperação de senha.'
          : (apiError?.message ?? 'Não foi possível alterar a senha.');
      showAlert('Erro', mensagem);
    } finally {
      setIsLoading(false);
    }
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
        await logout();
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topNavigationRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate(isAuthenticated ? 'Dashboard' : 'Login')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={isAuthenticated ? 'Voltar ao início' : 'Voltar para o login'}
              testID="nova-senha-back-button"
            >
              <Feather name="arrow-left" size={18} color="#005414" />
              <Text style={styles.backButtonText}>
                {isAuthenticated ? 'Voltar ao início' : 'Voltar para o login'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Trocar Senha</Text>
            <Text style={styles.subtitle}>
              Para sua segurança, escolha uma senha forte que você ainda não tenha usado nesta conta.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOVA SENHA</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={novaSenha}
                  onChangeText={setNovaSenha}
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
              <Text style={styles.label}>CONFIRMAR NOVA SENHA</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#64748b" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Salvar Nova Senha</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.securityTip}>
            <Feather name="shield" size={28} color="#005414" style={styles.securityIcon} />
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>DICA DE SEGURANÇA</Text>
              <Text style={styles.securityText}>
                Use pelo menos 8 caracteres, incluindo letras maiúsculas, números e símbolos especiais.
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
  iconRight: {
    padding: 5
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
