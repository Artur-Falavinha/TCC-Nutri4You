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

import { AuthScreenLayout } from '../components/auth/AuthScreenLayout';
import { authFormStyles } from '../components/auth/authFormStyles';
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

  const backLabel = isAuthenticated ? 'Voltar ao início' : 'Voltar para o login';
  const passwordCard = (
    <View style={authFormStyles.card}>
      <View style={authFormStyles.header}>
        <Text style={authFormStyles.title} accessibilityRole="header">Redefinir senha</Text>
        <Text style={authFormStyles.description}>
          Escolha uma senha de pelo menos 8 caracteres e confirme abaixo.
        </Text>
      </View>

      <View style={authFormStyles.inputGroup}>
        <Text style={authFormStyles.label}>Nova senha</Text>
        <View style={authFormStyles.inputContainer}>
          <Feather name="lock" size={20} color="#64748b" style={authFormStyles.inputIcon} />
          <TextInput
            style={authFormStyles.input}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            accessibilityLabel="Nova senha"
            autoComplete="new-password"
            secureTextEntry={!showPassword}
            value={novaSenha}
            onChangeText={setNovaSenha}
          />
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
          >
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={authFormStyles.inputGroup}>
        <Text style={authFormStyles.label}>Confirmar nova senha</Text>
        <View style={authFormStyles.inputContainer}>
          <Feather name="lock" size={20} color="#64748b" style={authFormStyles.inputIcon} />
          <TextInput
            style={authFormStyles.input}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            accessibilityLabel="Confirmar nova senha"
            autoComplete="new-password"
            secureTextEntry={!showPassword}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />
        </View>
      </View>

      <TouchableOpacity
        style={authFormStyles.button}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={authFormStyles.buttonText}>Salvar nova senha</Text>
            <Feather name="arrow-right" size={16} color="#ffffff" />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={authFormStyles.secondaryAction}
        onPress={() => navigation.navigate(isAuthenticated ? 'Dashboard' : 'Login')}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="nova-senha-back-button"
      >
        <Feather name="arrow-left" size={16} color="#005414" />
        <Text style={authFormStyles.secondaryActionText}>{backLabel}</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return <AuthScreenLayout>{passwordCard}</AuthScreenLayout>;
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
          <View style={styles.content}>{passwordCard}</View>
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
  iconRight: {
    padding: 5
  }
});
