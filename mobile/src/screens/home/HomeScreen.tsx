import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import {
  atualizarPerfil,
  carregarPerfil,
  desvincularNutricionista,
  listarNutricionistas,
  NutricionistaVinculo
} from '../../core/perfil/perfil.service';
import { formatDateDisplay, toIsoDate } from '../../core/utils/date-mask.util';
import { formatPhoneDisplay, normalizePhone } from '../../core/utils/phone-mask.util';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const SEXO_OPTIONS = ['Masculino', 'Feminino', 'Prefiro não informar'] as const;

function isoParaExibicao(valor: string | null): string {
  if (!valor) {
    return '';
  }
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!partes) {
    return formatDateDisplay(valor);
  }
  return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

function mensagemErro(erro: unknown, fallback: string): string {
  return erro instanceof ApiError ? erro.message : fallback;
}

export function HomeScreen({ navigation }: Props) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [sexo, setSexo] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [vinculos, setVinculos] = useState<NutricionistaVinculo[]>([]);
  const [pendente, setPendente] = useState<NutricionistaVinculo | null>(null);

  useEffect(() => {
    void Promise.all([carregarPerfil(), listarNutricionistas()])
      .then(([perfil, nutricionistas]) => {
        setNome(perfil.nome ?? '');
        setEmail(perfil.email ?? '');
        setTelefone(formatPhoneDisplay(perfil.telefone ?? ''));
        setSexo(perfil.sexo ?? '');
        setDataNascimento(isoParaExibicao(perfil.dataNascimento));
        setVinculos(nutricionistas ?? []);
      })
      .catch((falha: unknown) => {
        setErro(mensagemErro(falha, 'Não foi possível carregar seus dados.'));
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  const salvar = async () => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro('Informe o nome.');
      return;
    }
    const nascimento = dataNascimento.trim() ? toIsoDate(dataNascimento) : undefined;
    if (dataNascimento.trim() && !nascimento) {
      setErro('Data de nascimento inválida. Use DD/MM/AAAA.');
      return;
    }
    setSalvando(true);
    setErro('');
    setAviso('');
    try {
      const perfil = await atualizarPerfil({
        nome: nomeLimpo,
        telefone: normalizePhone(telefone),
        sexo: sexo.trim() || undefined,
        dataNascimento: nascimento
      });
      setNome(perfil.nome ?? nomeLimpo);
      setAviso('Dados pessoais atualizados.');
    } catch (falha) {
      setErro(mensagemErro(falha, 'Não foi possível salvar os dados.'));
    } finally {
      setSalvando(false);
    }
  };

  const executarDesvinculo = async (vinculo: NutricionistaVinculo) => {
    setErro('');
    setAviso('');
    try {
      await desvincularNutricionista(vinculo.id);
      setVinculos((atual) => atual.filter((item) => item.id !== vinculo.id));
      setPendente(null);
      setAviso(`Relação com ${vinculo.nome} encerrada.`);
    } catch (falha) {
      setErro(mensagemErro(falha, 'Não foi possível desvincular.'));
    }
  };

  const sair = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      })
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.titulo}>Dados pessoais</Text>
          <Text style={styles.subtitulo}>Altere nome, telefone, sexo e data de nascimento.</Text>

          {carregando ? <ActivityIndicator color="#006f1e" /> : null}
          {erro ? (
            <Text style={styles.erro} accessibilityRole="alert">
              {erro}
            </Text>
          ) : null}
          {aviso ? (
            <Text style={styles.aviso} accessibilityRole="text">
              {aviso}
            </Text>
          ) : null}

          <Text style={styles.rotulo}>Nome</Text>
          <TextInput
            style={styles.campo}
            value={nome}
            onChangeText={setNome}
            editable={!carregando && !salvando}
            accessibilityLabel="Nome"
          />

          <Text style={styles.rotulo}>E-mail</Text>
          <TextInput
            style={[styles.campo, styles.campoBloqueado]}
            value={email}
            editable={false}
            accessibilityLabel="E-mail"
          />

          <Text style={styles.rotulo}>Telefone</Text>
          <TextInput
            style={styles.campo}
            value={telefone}
            onChangeText={(valor) => setTelefone(formatPhoneDisplay(valor))}
            keyboardType="phone-pad"
            editable={!carregando && !salvando}
            accessibilityLabel="Telefone"
          />

          <Text style={styles.rotulo}>Sexo</Text>
          <View style={styles.opcoes}>
            {SEXO_OPTIONS.map((opcao) => {
              const ativo = sexo === opcao;
              return (
                <Pressable
                  key={opcao}
                  style={[styles.opcao, ativo && styles.opcaoAtiva]}
                  onPress={() => setSexo(opcao)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                >
                  <Text style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtivo]}>{opcao}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.rotulo}>Data de nascimento</Text>
          <TextInput
            style={styles.campo}
            value={dataNascimento}
            onChangeText={(valor) => setDataNascimento(formatDateDisplay(valor))}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            editable={!carregando && !salvando}
            accessibilityLabel="Data de nascimento"
          />

          <Pressable
            style={[styles.botao, (carregando || salvando) && styles.botaoDesabilitado]}
            onPress={() => {
              void salvar();
            }}
            disabled={carregando || salvando}
            accessibilityRole="button"
          >
            <Text style={styles.botaoTexto}>{salvando ? 'Salvando...' : 'Salvar dados'}</Text>
          </Pressable>

          <Text style={styles.secao}>Nutricionistas vinculados</Text>
          {vinculos.length === 0 ? (
            <Text style={styles.vazio}>Nenhum nutricionista vinculado.</Text>
          ) : (
            vinculos.map((vinculo) => (
              <View key={vinculo.id} style={styles.vinculo}>
                <View style={styles.vinculoTexto}>
                  <Text style={styles.vinculoNome}>{vinculo.nome}</Text>
                  <Text style={styles.vinculoEmail}>{vinculo.email}</Text>
                </View>
                <Pressable
                  onPress={() => setPendente(vinculo)}
                  accessibilityRole="button"
                  accessibilityLabel={`Desvincular ${vinculo.nome}`}
                >
                  <Text style={styles.desvincular}>Desvincular</Text>
                </Pressable>
              </View>
            ))
          )}

          <Pressable onPress={() => void sair()} accessibilityRole="button">
            <Text style={styles.sair}>Sair</Text>
          </Pressable>
        </ScrollView>
        {pendente ? (
          <View style={styles.confirma} accessibilityRole="alert">
            <Text style={styles.confirmaTexto}>
              Encerrar a relação com {pendente.nome}? A conta permanece ativa.
            </Text>
            <View style={styles.confirmaAcoes}>
              <Pressable onPress={() => setPendente(null)} accessibilityRole="button">
                <Text style={styles.cancelar}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void executarDesvinculo(pendente);
                }}
                accessibilityRole="button"
                accessibilityLabel="Confirmar desvínculo"
              >
                <Text style={styles.desvincular}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8faf8' },
  flex: { flex: 1 },
  content: { padding: 24, gap: 8 },
  titulo: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  subtitulo: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  rotulo: { marginTop: 8, fontSize: 12, fontWeight: '700', color: '#334155', textTransform: 'uppercase' },
  campo: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    color: '#0f172a'
  },
  campoBloqueado: { backgroundColor: '#f1f5f9', color: '#64748b' },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff'
  },
  opcaoAtiva: { borderColor: '#006f1e', backgroundColor: '#e8f5e9' },
  opcaoTexto: { color: '#334155', fontSize: 13 },
  opcaoTextoAtivo: { color: '#006f1e', fontWeight: '700' },
  botao: {
    marginTop: 16,
    backgroundColor: '#006f1e',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: '#ffffff', fontWeight: '700' },
  secao: { marginTop: 24, fontSize: 16, fontWeight: '700', color: '#0f172a' },
  vazio: { color: '#64748b' },
  vinculo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  vinculoTexto: { flex: 1 },
  vinculoNome: { fontWeight: '700', color: '#0f172a' },
  vinculoEmail: { color: '#64748b', fontSize: 13 },
  desvincular: { color: '#b42318', fontWeight: '700' },
  sair: { marginTop: 24, color: '#64748b', textAlign: 'center' },
  erro: { color: '#b42318', backgroundColor: '#fef3f2', padding: 8, borderRadius: 8 },
  aviso: { color: '#006f1e', backgroundColor: '#e8f5e9', padding: 8, borderRadius: 8 },
  confirma: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12
  },
  confirmaTexto: { color: '#0f172a' },
  confirmaAcoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  cancelar: { color: '#64748b', fontWeight: '700' }
});
