import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { toast } from '../feedback/toast';
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
      if (falha instanceof ApiError && falha.error === 'EMAIL_EM_USO') {
        voltarParaEmail();
        toast.erro(falha.message);
        return;
      }
      toast.erro(falha instanceof ApiError ? falha.message : 'Não foi possível enviar. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  }

  function voltarParaEmail() {
    setEnviado(false);
    setCodigo('');
    setErro('');
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
      if (falha instanceof ApiError && falha.status === 400) setErro(falha.message);
      else toast.erro(falha instanceof ApiError ? falha.message : 'Não foi possível confirmar. Tente novamente.');
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
              ? 'Cole abaixo o código recebido por e-mail para continuar.'
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
            <TouchableOpacity
              style={authFormStyles.secondaryAction}
              onPress={() => void enviar()}
              disabled={ocupado}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={authFormStyles.secondaryActionText}>Reenviar e-mail</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={authFormStyles.secondaryAction}
              onPress={voltarParaEmail}
              disabled={ocupado}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={authFormStyles.secondaryActionText}>Trocar endereço de e-mail</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={authFormStyles.secondaryAction}
          onPress={aoVoltar}
          disabled={ocupado}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o login"
        >
          <Feather name="arrow-left" size={16} color="#005414" />
          <Text style={authFormStyles.secondaryActionText}>Voltar para o login</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
}
