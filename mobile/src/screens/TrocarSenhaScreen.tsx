import React, { useEffect, useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
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
import { logout, solicitarRecuperacaoSenha } from '../core/auth/auth.service';
import { getToken } from '../core/auth/token-storage';
import { carregarPerfil } from '../core/perfil/perfil.service';
import { isValidUuid } from '../core/utils/uuid.util';
import type { RootStackParamList } from '../navigation/types';
import { colors, fontFamily } from '../theme/tokens';
import { perfilStyles } from './home/perfil.styles';

export default function TrocarSenhaScreen() {
  const { width } = useWindowDimensions();
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

  const etapaCodigo = step === 2;
  const rotuloVoltar = isAuthenticated ? 'Voltar ao início' : 'Voltar para o login';
  const cartao = (
    <View style={sectionCardStyles.superficie}>
      <View style={formulario.cabecalho}>
        <SectionCardHeader
          icone={etapaCodigo ? 'lock' : 'mail'}
          titulo={isAuthenticated
            ? (etapaCodigo ? 'Verificar código' : 'Solicitar código')
            : 'Esqueceu a senha?'}
        />
        <Text style={estilos.etapa}>Verificação · {step} de 2</Text>
        <Text style={perfilStyles.descricao}>
          {etapaCodigo
            ? 'Cole o código recebido por e-mail para redefinir a senha.'
            : 'Informe o e-mail cadastrado para receber um código de verificação.'}
        </Text>
      </View>

      <View style={formulario.campo}>
        <Text style={formulario.rotulo}>Email cadastrado</Text>
        <View style={[formulario.controle, etapaCodigo && estilos.somenteLeitura]}>
          <Feather name="mail" size={18} color={colors.textSecondary} aria-hidden />
          <TextInput
            style={[formulario.entrada, etapaCodigo && estilos.entradaSomenteLeitura]}
            placeholder="email@exemplo.com"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Email cadastrado"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!etapaCodigo}
          />
        </View>
      </View>

      {etapaCodigo && (
        <View style={formulario.campo}>
          <Text style={formulario.rotulo}>Código de verificação</Text>
          <View style={formulario.controle}>
            <Feather name="key" size={18} color={colors.textSecondary} aria-hidden />
            <TextInput
              style={formulario.entrada}
              placeholder="Cole o código recebido"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Código de verificação"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="one-time-code"
            />
          </View>
          <Text style={perfilStyles.descricao}>Não compartilhe esse código com ninguém.</Text>
        </View>
      )}

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
          testID="trocar-senha-submit-button"
        >
          <Text style={perfilStyles.rotuloPrimario}>
            {etapaCodigo ? 'Continuar' : 'Enviar código por e-mail'}
          </Text>
          {isLoading
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Feather name="arrow-right" size={18} color={colors.white} aria-hidden />}
        </Pressable>

        {etapaCodigo && (
          <Pressable
            style={({ pressed }) => [perfilStyles.botao, perfilStyles.secundario, pressed && perfilStyles.pressionado]}
            onPress={() => setStep(1)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Alterar e-mail informado"
            testID="trocar-senha-edit-email-button"
          >
            <Feather name="edit-2" size={16} color={colors.brandDark} aria-hidden />
            <Text style={perfilStyles.rotuloBotao}>Alterar e-mail informado</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [perfilStyles.botao, pressed && perfilStyles.pressionado]}
          onPress={handleBackNavigation}
          accessibilityRole="button"
          accessibilityLabel={rotuloVoltar}
          testID="trocar-senha-back-button"
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
          <Text style={formulario.titulo} accessibilityRole="header" aria-level={1}>Trocar senha</Text>
          {cartao}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  etapa: { color: colors.brandDark, fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 20 },
  somenteLeitura: { backgroundColor: colors.page, borderColor: colors.border },
  entradaSomenteLeitura: { color: colors.textSecondary }
});
