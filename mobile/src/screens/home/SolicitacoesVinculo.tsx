import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../core/api/api-response.types';
import {
  decidirSolicitacaoVinculo,
  listarSolicitacoesVinculo,
  NutricionistaVinculo,
  SolicitacaoVinculo
} from '../../core/perfil/perfil.service';

interface Props {
  onAceito: (vinculo: NutricionistaVinculo) => void;
}

export function SolicitacoesVinculo({ onAceito }: Props) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoVinculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [decidindo, setDecidindo] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    let vigente = true;
    void listarSolicitacoesVinculo()
      .then((pedidos) => {
        if (vigente) setSolicitacoes(pedidos);
      })
      .catch(() => {
        if (vigente) setErro('Não foi possível carregar as solicitações de vínculo.');
      })
      .finally(() => {
        if (vigente) setCarregando(false);
      });
    return () => { vigente = false; };
  }, [revisao]);

  const atualizar = () => {
    setCarregando(true);
    setErro('');
    setRevisao((atual) => atual + 1);
  };

  const decidir = async (solicitacao: SolicitacaoVinculo, aceitar: boolean) => {
    setDecidindo(true);
    setErro('');
    setAviso('');
    try {
      const vinculo = await decidirSolicitacaoVinculo(solicitacao, aceitar);
      setSolicitacoes((atuais) => atuais.filter((item) => item.id !== solicitacao.id));
      if (vinculo) onAceito(vinculo);
      setAviso(aceitar ? 'Vínculo aceito.' : 'Solicitação recusada.');
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : 'Não foi possível responder à solicitação.');
    } finally {
      setDecidindo(false);
    }
  };

  const ocupado = carregando || decidindo;
  return (
    <View style={styles.secao}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo} accessibilityRole="header">Solicitações de vínculo</Text>
        <Pressable onPress={atualizar} accessibilityRole="button"
          accessibilityLabel="Atualizar solicitações de vínculo" disabled={ocupado}
          style={[styles.acao, ocupado && styles.desabilitada]}>
          <Text style={styles.atualizar}>Atualizar</Text>
        </Pressable>
      </View>
      {carregando && <ActivityIndicator accessibilityLabel="Carregando solicitações" />}
      {erro ? <Text style={styles.erro} accessibilityRole="alert">{erro}</Text> : null}
      {aviso ? <Text style={styles.atualizar} accessibilityLiveRegion="polite">{aviso}</Text> : null}
      {!carregando && !erro && solicitacoes.length === 0 &&
        <Text style={styles.texto}>Nenhuma solicitação pendente.</Text>}
      {solicitacoes.length > 0 &&
        <Text style={styles.texto}>
          Ao aceitar, o nutricionista poderá acessar sua ficha clínica para acompanhar você.
          Você pode encerrar o vínculo quando quiser.
        </Text>}
      {solicitacoes.map((solicitacao) => (
        <View key={solicitacao.id} style={styles.solicitacao}>
          <Text style={styles.nome}>{solicitacao.nutricionistaNome}</Text>
          <View style={styles.acoes}>
            <Pressable
              onPress={() => void decidir(solicitacao, false)}
              accessibilityRole="button"
              accessibilityLabel={'Recusar vínculo com ' + solicitacao.nutricionistaNome}
              disabled={ocupado}
              style={[styles.acao, styles.recusa, ocupado && styles.desabilitada]}
            >
              <Text style={styles.recusaTexto}>Recusar</Text>
            </Pressable>
            <Pressable
              onPress={() => void decidir(solicitacao, true)}
              accessibilityRole="button"
              accessibilityLabel={'Aceitar vínculo com ' + solicitacao.nutricionistaNome}
              disabled={ocupado}
              style={[styles.acao, styles.aceite, ocupado && styles.desabilitada]}
            >
              <Text style={styles.aceiteTexto}>Aceitar</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginTop: 24, gap: 8 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  titulo: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a' },
  atualizar: { color: '#006f1e', fontWeight: '700' },
  texto: { color: '#475569' },
  erro: { color: '#b42318' },
  solicitacao: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, gap: 12 },
  nome: { fontWeight: '700', color: '#0f172a' },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  acao: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8 },
  recusa: { borderWidth: 1, borderColor: '#cbd5e1' },
  recusaTexto: { color: '#334155', fontWeight: '700' },
  aceite: { backgroundColor: '#006f1e' },
  aceiteTexto: { color: '#ffffff', fontWeight: '700' },
  desabilitada: { opacity: 0.6 }
});
