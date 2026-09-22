import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';

import { solicitarRecuperacaoSenha } from '../core/auth/auth.service';
import { isValidUuid } from '../core/utils/uuid.util';
import type { RootStackParamList } from '../navigation/types';

export default function TrocarSenhaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (step === 1) {
      if (!email.trim()) {
        Alert.alert('Atenção', 'Preencha o e-mail cadastrado.');
        return;
      }
      setIsLoading(true);
      const mensagem = await solicitarRecuperacaoSenha(email);
      setIsLoading(false);
      setStep(2);
      Alert.alert('Pronto', mensagem);
      return;
    }

    const trimmed = token.trim();
    if (!trimmed) {
      Alert.alert('Atenção', 'Cole o código de verificação (UUID).');
      return;
    }
    if (!isValidUuid(trimmed)) {
      Alert.alert('Atenção', 'Código inválido. Informe um UUID válido.');
      return;
    }
    navigation.navigate('NovaSenha', { token: trimmed });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Esqueceu a senha?</Text>
          <Text style={styles.subtitle}>
            Informe o e-mail cadastrado. Se existir, você receberá instruções para redefinir a senha.
            Em ambiente local, o UUID também aparece no log do backend.
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
              <Text style={styles.label}>CÓDIGO DE VERIFICAÇÃO (UUID)</Text>
              <View style={[styles.inputContainer, { paddingLeft: 16 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Cole o UUID recebido"
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
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                {step === 1 ? 'Enviar token por e-mail' : 'Continuar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.securityTip}>
          <Feather name="shield" size={28} color="#005414" style={styles.securityIcon} />
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>DICA DE SEGURANÇA</Text>
            <Text style={styles.securityText}>
              Não compartilhe com ninguém o seu token de verificação.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 16
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
