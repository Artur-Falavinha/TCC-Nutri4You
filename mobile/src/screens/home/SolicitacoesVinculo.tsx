import { DialogoConfirmacao } from '../../components/feedback/DialogoConfirmacao';
import { toast } from '../../components/feedback/toast';
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
  const [decisao, setDecisao] = useState<{ solicitacao: SolicitacaoVinculo; aceitar: boolean } | null>(null);
  const [erro, setErro] = useState('');

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
  }, []);

  const decidir = async (solicitacao: SolicitacaoVinculo, aceitar: boolean) => {
    setErro('');
    try {
      const vinculo = await decidirSolicitacaoVinculo(solicitacao, aceitar);
      setSolicitacoes((atuais) => atuais.filter((item) => item.id !== solicitacao.id));
      if (vinculo) onAceito(vinculo);
      toast.sucesso(aceitar ? 'Vínculo aceito.' : 'Solicitação recusada.');
    } catch (falha) {
      toast.erro(falha instanceof ApiError ? falha.message : 'Não foi possível responder à solicitação.');
    } finally {
      setDecisao(null);
    }
  };

  const ocupado = carregando || decisao !== null;
  return (
    <View style={sectionCardStyles.superficie}>
      <SectionCardHeader titulo="Solicitações de vínculo" icone="inbox" />
      {carregando && <ActivityIndicator accessibilityLabel="Carregando solicitações" color={colors.brand} />}
      {erro ? <Text style={perfilStyles.erro} accessibilityRole="alert">{erro}</Text> : null}
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
              onPress={() => setDecisao({ solicitacao, aceitar: false })}
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
              onPress={() => setDecisao({ solicitacao, aceitar: true })}
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
      {decisao && (
        <DialogoConfirmacao
          titulo={decisao.aceitar ? 'Aceitar vínculo?' : 'Recusar solicitação?'}
          descricao={decisao.aceitar
            ? `${decisao.solicitacao.nutricionistaNome} poderá acessar sua ficha clínica enquanto o vínculo estiver ativo.`
            : `O vínculo com ${decisao.solicitacao.nutricionistaNome} não será ativado.`}
          icone={decisao.aceitar ? 'user-check' : 'user-x'}
          fechar={() => setDecisao(null)}
          acoes={[
            { rotulo: 'Voltar', variante: 'secundaria', executar: () => setDecisao(null) },
            {
              rotulo: decisao.aceitar ? 'Aceitar vínculo' : 'Recusar solicitação',
              variante: decisao.aceitar ? undefined : 'perigo',
              executar: () => decidir(decisao.solicitacao, decisao.aceitar),
              rotuloOcupado: 'Enviando…'
            }
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  solicitacao: { backgroundColor: colors.page, borderRadius: radius.lg, padding: spacing.sm, gap: spacing.sm },
  nome: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }
});
