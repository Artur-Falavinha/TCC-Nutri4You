import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { toast } from '../feedback/toast';
import { ApiError } from '../../core/api/api-response.types';
import { confirmarCadastroPaciente, iniciarCadastroPaciente } from '../../core/auth/auth.service';
import { ComprovanteCadastro } from '../../core/auth/auth.models';
import { isValidUuid } from '../../core/utils/uuid.util';
import { AuthFormButton } from './AuthFormButton';
import { AuthScreenLayout } from './AuthScreenLayout';
import { authFormStyles } from './authFormStyles';
import { recuperacaoSenhaStyles as formulario } from './recuperacaoSenhaStyles';
import { SectionCardHeader, sectionCardStyles } from '../layout/SectionCardHeader';
import { perfilStyles } from '../../screens/home/perfil.styles';
import { colors } from '../../theme/tokens';

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
      toast.sucesso('Solicitação recebida. Confira sua caixa de entrada e o spam.');
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
      toast.sucesso('E-mail confirmado.');
    } catch (falha) {
      if (falha instanceof ApiError && falha.status === 400) setErro(falha.message);
      else toast.erro(falha instanceof ApiError ? falha.message : 'Não foi possível confirmar. Tente novamente.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <AuthScreenLayout>
      <View style={sectionCardStyles.superficie}>
        <View style={formulario.cabecalho}>
          <SectionCardHeader icone={enviado ? 'key' : 'mail'} titulo={enviado ? 'Confirme seu e-mail' : 'Crie sua conta'} />
          <Text style={authFormStyles.etapa}>Cadastro · {enviado ? 2 : 1} de 3</Text>
          <Text style={perfilStyles.descricao}>
            {enviado
              ? 'Cole o código recebido por e-mail para continuar.'
              : 'Informe seu e-mail para iniciar o cadastro de paciente.'}
          </Text>
        </View>

        <View style={formulario.campo}>
          <Text style={formulario.rotulo}>E-mail</Text>
          <View style={[formulario.controle, enviado && authFormStyles.somenteLeitura]}>
            <Feather name="mail" size={18} color={colors.textSecondary} aria-hidden />
            {enviado ? (
              <Text style={authFormStyles.valorSomenteLeitura}>{email.trim()}</Text>
            ) : (
              <TextInput
                style={formulario.entrada}
                accessibilityLabel="E-mail"
                placeholder="email@exemplo.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            )}
          </View>
          {!enviado && !!erro && <Text accessibilityRole="alert" style={authFormStyles.erroCampo}>{erro}</Text>}
        </View>

        {enviado && (
          <View style={formulario.campo}>
            <Text style={formulario.rotulo}>Código de verificação</Text>
            <View style={formulario.controle}>
              <Feather name="key" size={18} color={colors.textSecondary} aria-hidden />
              <TextInput
                style={formulario.entrada}
                accessibilityLabel="Código recebido por e-mail"
                placeholder="Cole o código recebido"
                placeholderTextColor={colors.textSecondary}
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect={false}
                value={codigo}
                onChangeText={setCodigo}
              />
            </View>
            {!!erro && <Text accessibilityRole="alert" style={authFormStyles.erroCampo}>{erro}</Text>}
          </View>
        )}

        <View style={formulario.acoes}>
          <AuthFormButton
            titulo={enviado ? 'Confirmar e-mail' : 'Enviar código por e-mail'}
            icone="arrow-right"
            ocupado={ocupado}
            onPress={() => void (enviado ? confirmar() : enviar())}
          />
          {enviado && (
            <>
              <AuthFormButton titulo="Reenviar e-mail" icone="refresh-cw" variante="secundario" desativado={ocupado} onPress={() => void enviar()} />
              <AuthFormButton titulo="Trocar endereço de e-mail" icone="edit-2" variante="secundario" desativado={ocupado} onPress={voltarParaEmail} />
            </>
          )}
          <AuthFormButton titulo="Voltar para o login" icone="arrow-left" variante="texto" desativado={ocupado} onPress={aoVoltar} />
        </View>
      </View>
    </AuthScreenLayout>
  );
}
