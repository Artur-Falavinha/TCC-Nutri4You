import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
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
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { api } from '../services/api';
import type { ApiResponse } from '../services/api';
import type { RootStackParamList } from '../navigation/types';

export default function NovaSenhaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NovaSenha'>>();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post<ApiResponse<unknown>>('/auth/redefinir-senha', {
        token: route.params.token.trim(),
        senha: novaSenha
      });
      setIsLoading(false);
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
      navigation.navigate('Login');
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Erro', err.response?.data?.message ?? 'Não foi possível alterar a senha.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 30,
    color: '#006f1e',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#2d3335',
    textAlign: 'center',
    lineHeight: 18,
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
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#6f7a6c',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    height: 56,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    position: 'relative',
  },
  inputIconLeft: {
    position: 'absolute',
    left: 16,
    width: 20,
    height: 16,
    resizeMode: 'contain',
    zIndex: 1,
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
  eyeIcon: {
    width: 22,
    height: 15,
    resizeMode: 'contain',
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
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#ffffff',
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
    alignItems: 'flex-start',
  },
  securityIcon: {
    width: 16,
    height: 20,
    resizeMode: 'contain',
    marginRight: 16,
    marginTop: 2,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#005414',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  securityText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#2d3335',
    lineHeight: 18,
  },
});

