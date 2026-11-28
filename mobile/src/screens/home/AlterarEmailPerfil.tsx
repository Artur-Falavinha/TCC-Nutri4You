import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { toast } from '../../components/feedback/toast';
import { confirmarAlteracaoEmail, iniciarAlteracaoEmail } from '../../core/perfil/perfil.service';
import { isValidUuid } from '../../core/utils/uuid.util';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';
import { perfilStyles } from './perfil.styles';

interface Props {
  emailAtual: string;
  aoAtualizar: (email: string) => void;
}

export function AlterarEmailPerfil({ emailAtual, aoAtualizar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [destino, setDestino] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  function reiniciar() {
    setDestino('');
    setSenhaAtual('');
    setCodigo('');
    setErro('');
  }

  function fechar() {
    reiniciar();
    setNovoEmail('');
    setAberto(false);
  }

  async function enviar() {
    if (ocupado) return;
    const email = novoEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.toLowerCase() === emailAtual.toLowerCase()) {
      setErro('Informe um novo e-mail válido, diferente do atual.');
      return;
    }
    if (!senhaAtual) {
      setErro('Informe sua senha atual.');
      return;
    }
    setErro('');
    setOcupado(true);
    try {
      const solicitacao = await iniciarAlteracaoEmail(email, senhaAtual);
      setDestino(solicitacao.email);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível enviar o código.');
    } finally {
      setSenhaAtual('');
      setOcupado(false);
    }
  }

  async function confirmar() {
    if (ocupado) return;
    const valor = codigo.trim();
    if (!isValidUuid(valor)) {
      setErro('Cole o código completo recebido no novo e-mail.');
      return;
    }
    setErro('');
    setOcupado(true);
    try {
      const email = await confirmarAlteracaoEmail(valor);
      aoAtualizar(email);
      fechar();
      toast.sucesso('E-mail atualizado com sucesso.');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível confirmar a alteração.');
    } finally {
      setOcupado(false);
    }
  }

  if (!aberto) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => setAberto(true)}
        style={({ pressed }) => [perfilStyles.botao, perfilStyles.secundario, pressed && perfilStyles.pressionado]}
      >
        <Feather name="mail" size={18} color={colors.brandDark} aria-hidden />
        <Text style={perfilStyles.rotuloBotao}>Alterar e-mail</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.formulario}>
      <Text style={perfilStyles.descricao} accessibilityLiveRegion="polite">
        {destino ? `Cole o código enviado para ${destino}. Ele expira em 30 minutos.`
          : 'Informe o novo endereço e confirme sua senha atual. Você usará o novo e-mail para entrar.'}
      </Text>
      {destino ? (
        <View style={styles.grupo}>
          <Text style={styles.rotulo}>Código de verificação</Text>
          <TextInput
            accessibilityLabel="Código de verificação"
            style={styles.campo}
            editable={!ocupado}
            autoComplete="one-time-code"
            autoCapitalize="none"
            autoCorrect={false}
            value={codigo}
            onChangeText={setCodigo}
          />
        </View>
      ) : (
        <>
          <View style={styles.grupo}>
            <Text style={styles.rotulo}>Novo e-mail</Text>
            <TextInput
              accessibilityLabel="Novo e-mail"
              style={styles.campo}
              editable={!ocupado}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={100}
              value={novoEmail}
              onChangeText={setNovoEmail}
            />
          </View>
          <View style={styles.grupo}>
            <Text style={styles.rotulo}>Senha atual</Text>
            <TextInput
              accessibilityLabel="Senha atual"
              style={styles.campo}
              editable={!ocupado}
              secureTextEntry
              autoComplete="current-password"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
            />
          </View>
        </>
      )}
      {erro ? <Text accessibilityRole="alert" style={perfilStyles.erro}>{erro}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: ocupado, disabled: ocupado }}
        disabled={ocupado}
        onPress={() => void (destino ? confirmar() : enviar())}
        style={({ pressed }) => [
          perfilStyles.botao, perfilStyles.primario, (pressed || ocupado) && perfilStyles.pressionado
        ]}
      >
        <Text style={perfilStyles.rotuloPrimario}>
          {destino ? (ocupado ? 'Confirmando…' : 'Confirmar novo e-mail') : (ocupado ? 'Enviando…' : 'Enviar código')}
        </Text>
      </Pressable>
      {destino ? (
        <Pressable
          accessibilityRole="button"
          disabled={ocupado}
          onPress={reiniciar}
          style={({ pressed }) => [perfilStyles.botao, perfilStyles.secundario, pressed && perfilStyles.pressionado]}
        >
          <Text style={perfilStyles.rotuloBotao}>Solicitar outro código</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={ocupado}
        onPress={fechar}
        style={({ pressed }) => [perfilStyles.botao, perfilStyles.secundario, pressed && perfilStyles.pressionado]}
      >
        <Text style={perfilStyles.rotuloBotao}>Cancelar alteração de e-mail</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: spacing.sm },
  grupo: { gap: spacing.xs },
  rotulo: { color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14 },
  campo: {
    minHeight: 48, paddingHorizontal: spacing.sm, borderRadius: radius.md,
    borderColor: colors.border, borderWidth: 1, color: colors.text, fontFamily: fontFamily.regular, fontSize: 16
  }
});
