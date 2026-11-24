import { Feather } from '@expo/vector-icons';
import { SectionCardHeader, sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';
import { perfilStyles } from './perfil.styles';
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
    <View style={sectionCardStyles.superficie}>
      <View style={styles.cabecalho}>
        <View style={styles.titulo}>
          <SectionCardHeader titulo="Solicitações de vínculo" icone="inbox" />
        </View>
        <Pressable
          onPress={atualizar}
          accessibilityRole="button"
          accessibilityLabel="Atualizar solicitações de vínculo"
          disabled={ocupado}
          style={({ pressed }) => [
            perfilStyles.botao, perfilStyles.secundario, (pressed || ocupado) && perfilStyles.pressionado
          ]}
        >
          <Feather name="refresh-cw" size={16} color={colors.brandDark} aria-hidden />
          <Text style={perfilStyles.rotuloBotao}>Atualizar</Text>
        </Pressable>
      </View>
      {carregando && <ActivityIndicator accessibilityLabel="Carregando solicitações" color={colors.brand} />}
      {erro ? <Text style={perfilStyles.erro} accessibilityRole="alert">{erro}</Text> : null}
      {aviso ? <Text style={perfilStyles.aviso} accessibilityLiveRegion="polite">{aviso}</Text> : null}
      {!carregando && !erro && solicitacoes.length === 0 &&
        <Text style={perfilStyles.estadoVazio}>Nenhuma solicitação pendente.</Text>}
      {solicitacoes.length > 0 &&
        <Text style={perfilStyles.descricao}>
          Ao aceitar, o nutricionista poderá acessar sua ficha clínica para acompanhar você.
          Você pode encerrar o vínculo quando quiser.
          Você só pode manter um vínculo ativo por vez.
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
              style={({ pressed }) => [
                perfilStyles.botao, perfilStyles.perigoSuave, (pressed || ocupado) && perfilStyles.pressionado
              ]}
            >
              <Text style={perfilStyles.rotuloPerigo}>Recusar</Text>
            </Pressable>
            <Pressable
              onPress={() => void decidir(solicitacao, true)}
              accessibilityRole="button"
              accessibilityLabel={'Aceitar vínculo com ' + solicitacao.nutricionistaNome}
              disabled={ocupado}
              style={({ pressed }) => [
                perfilStyles.botao, perfilStyles.primario, (pressed || ocupado) && perfilStyles.pressionado
              ]}
            >
              <Text style={perfilStyles.rotuloPrimario}>Aceitar</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  titulo: { flexGrow: 1, flexBasis: 215 },
  solicitacao: { backgroundColor: colors.page, borderRadius: radius.lg, padding: spacing.sm, gap: spacing.sm },
  nome: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }
});
