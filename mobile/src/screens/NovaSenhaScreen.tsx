import React, { useEffect, useState } from 'react';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthScreenLayout } from '../components/auth/AuthScreenLayout';
import { recuperacaoSenhaStyles as formulario } from '../components/auth/recuperacaoSenhaStyles';
import { useAppAlert } from '../components/feedback/AppAlertProvider';
import { AppHeader } from '../components/layout/AppHeader';
import { SectionCardHeader, sectionCardStyles } from '../components/layout/SectionCardHeader';
import { MenuDestination, SideMenu } from '../components/navigation/SideMenu';
import { logout, redefinirSenha } from '../core/auth/auth.service';
import { getToken } from '../core/auth/token-storage';
import { ApiError } from '../core/api/api-response.types';
import { carregarPerfil } from '../core/perfil/perfil.service';
import { isValidUuid } from '../core/utils/uuid.util';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/tokens';
import { perfilStyles } from './home/perfil.styles';

export default function NovaSenhaScreen() {
  const { width } = useWindowDimensions();
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

  const rotuloVoltar = isAuthenticated ? 'Voltar ao início' : 'Voltar para o login';
  const cartao = (
    <View style={sectionCardStyles.superficie}>
      <View style={formulario.cabecalho}>
        <SectionCardHeader
          icone="shield"
          titulo={isAuthenticated ? 'Escolha sua nova senha' : 'Redefinir senha'}
        />
        <Text style={perfilStyles.descricao}>
          Escolha uma senha de pelo menos 8 caracteres e confirme abaixo.
        </Text>
      </View>

      <View style={formulario.campo}>
        <Text style={formulario.rotulo}>Nova senha</Text>
        <View style={[formulario.controle, estilos.controleComVisibilidade]}>
          <Feather name="lock" size={18} color={colors.textSecondary} aria-hidden />
          <TextInput
            style={formulario.entrada}
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Nova senha"
            autoComplete="new-password"
            secureTextEntry={!showPassword}
            value={novaSenha}
            onChangeText={setNovaSenha}
          />
          <Pressable
            style={({ pressed }) => [estilos.visibilidade, pressed && perfilStyles.pressionado]}
            onPress={() => setShowPassword((visivel) => !visivel)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
          >
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.brandDark} aria-hidden />
          </Pressable>
        </View>
      </View>

      <View style={formulario.campo}>
        <Text style={formulario.rotulo}>Confirmar nova senha</Text>
        <View style={formulario.controle}>
          <Feather name="lock" size={18} color={colors.textSecondary} aria-hidden />
          <TextInput
            style={formulario.entrada}
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Confirmar nova senha"
            autoComplete="new-password"
            secureTextEntry={!showPassword}
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />
        </View>
      </View>

      <View style={formulario.acoes}>
        <Pressable
          style={({ pressed }) => [
            perfilStyles.botao, perfilStyles.primario,
            pressed && perfilStyles.pressionado, isLoading && formulario.enviando
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          accessibilityRole="button"
          aria-busy={isLoading}
        >
          <Text style={perfilStyles.rotuloPrimario}>Salvar nova senha</Text>
          {isLoading
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Feather name="arrow-right" size={18} color={colors.white} aria-hidden />}
        </Pressable>

        <Pressable
          style={({ pressed }) => [perfilStyles.botao, pressed && perfilStyles.pressionado]}
          onPress={() => navigation.navigate(isAuthenticated ? 'Dashboard' : 'Login')}
          accessibilityRole="button"
          accessibilityLabel={rotuloVoltar}
          testID="nova-senha-back-button"
        >
          <Feather name="arrow-left" size={18} color={colors.brandDark} aria-hidden />
          <Text style={perfilStyles.rotuloBotao}>{rotuloVoltar}</Text>
        </Pressable>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return <AuthScreenLayout>{cartao}</AuthScreenLayout>;
  }

  return (
    <SafeAreaView style={formulario.areaSegura} edges={['left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />
      <SideMenu
        visible={menuVisible}
        activeItem="password"
        userName={userName}
        onClose={() => setMenuVisible(false)}
        onNavigate={(destination) => void handleMenuNavigate(destination)}
      />

      <KeyboardAvoidingView style={formulario.preencher} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={formulario.preencher}
          contentContainerStyle={[formulario.conteudo, width < 420 && formulario.conteudoCompacto]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={formulario.titulo} accessibilityRole="header" aria-level={1}>Redefinir senha</Text>
          {cartao}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  controleComVisibilidade: { paddingRight: 0 },
  visibilidade: {
    minWidth: 48,
    minHeight: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md
  }
});
