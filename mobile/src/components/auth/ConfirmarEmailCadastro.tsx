import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ApiError } from '../../core/api/api-response.types';
import { confirmarCadastroPaciente, iniciarCadastroPaciente } from '../../core/auth/auth.service';
import { ComprovanteCadastro } from '../../core/auth/auth.models';
import { isValidUuid } from '../../core/utils/uuid.util';
import { AuthScreenLayout } from './AuthScreenLayout';
import { authFormStyles } from './authFormStyles';

interface ConfirmarEmailCadastroProps {
  aoConfirmar: (confirmacao: ComprovanteCadastro) => void;
  aoVoltar: () => void;
}

export function ConfirmarEmailCadastro({ aoConfirmar, aoVoltar }: ConfirmarEmailCadastroProps) {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar() {
    if (!email.trim()) {
      setErro('Informe seu e-mail.');
      return;
    }

    setOcupado(true);
    setErro('');
    try {
      await iniciarCadastroPaciente(email);
      setEnviado(true);
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : 'Não foi possível enviar. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  }

  async function confirmar() {
    if (!isValidUuid(codigo)) {
      setErro('Cole o código de cadastro recebido por e-mail.');
      return;
    }

    setOcupado(true);
    setErro('');
    try {
      const confirmacao = await confirmarCadastroPaciente(codigo.trim());
      aoConfirmar({ ...confirmacao, token: codigo.trim() });
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : 'Não foi possível confirmar. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <AuthScreenLayout>
      <View style={authFormStyles.card}>
        <View style={authFormStyles.header}>
          <Text style={authFormStyles.title} accessibilityRole="header">
            {enviado ? 'Confirme seu e-mail' : 'Crie sua conta'}
          </Text>
          <Text style={authFormStyles.description}>
            {enviado
              ? 'Confira sua caixa de entrada e cole o código do e-mail para continuar.'
              : 'Informe seu e-mail para iniciar o cadastro de paciente.'}
          </Text>
        </View>

        <View style={authFormStyles.inputGroup}>
          <Text style={authFormStyles.label}>{enviado ? 'CÓDIGO DO E-MAIL' : 'E-MAIL'}</Text>
          <View style={authFormStyles.inputContainer}>
            <Feather name={enviado ? 'key' : 'mail'} size={20} color="#64748b" style={authFormStyles.inputIcon} />
            {enviado ? (
              <TextInput
                key="codigo"
                accessibilityLabel="Código recebido por e-mail"
                style={authFormStyles.input}
                placeholder="Cole o código"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                value={codigo}
                onChangeText={setCodigo}
              />
            ) : (
              <TextInput
                key="email"
                accessibilityLabel="E-mail"
                style={authFormStyles.input}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            )}
          </View>
        </View>

        {!!erro && <Text accessibilityRole="alert" style={authFormStyles.description}>{erro}</Text>}
        <TouchableOpacity
          accessibilityRole="button"
          style={authFormStyles.button}
          disabled={ocupado}
          onPress={() => void (enviado ? confirmar() : enviar())}
        >
          {ocupado ? <ActivityIndicator color="#fff" /> : (
            <Text style={authFormStyles.buttonText}>{enviado ? 'Confirmar e-mail' : 'Enviar link de confirmação'}</Text>
          )}
        </TouchableOpacity>

        {enviado && (
          <>
            <TouchableOpacity accessibilityRole="button" disabled={ocupado} onPress={() => void enviar()}>
              <Text style={authFormStyles.description}>Reenviar e-mail</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" disabled={ocupado} onPress={() => {
              setEnviado(false);
              setCodigo('');
              setErro('');
            }}>
              <Text style={authFormStyles.description}>Trocar endereço de e-mail</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity accessibilityRole="button" disabled={ocupado} onPress={aoVoltar}>
          <Text style={authFormStyles.description}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
}
