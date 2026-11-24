import { toast } from '../../../components/feedback/toast';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { dataIsoDaClinica, formatarDataCivil } from '../../../core/utils/date-mask.util';
import { DailyConsumption, getConsumption, markMeal } from '../../../features/dieta/consumo.service';
import { SectionCardHeader, sectionCardStyles } from '../../../components/layout/SectionCardHeader';
import { colors, fontFamily, radius, spacing } from '../../../theme/tokens';

export function DailyMealsCard({ onChanged }: { onChanged: () => Promise<void> }) {
  const [registro, setRegistro] = useState<DailyConsumption | null>(null);
  const [selecao, setSelecao] = useState<{ data?: string }>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useFocusEffect(useCallback(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    void getConsumption(selecao.data)
      .then(resposta => { if (ativo) setRegistro(resposta); })
      .catch((falha: unknown) => {
        if (!ativo) return;
        setRegistro(null);
        setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar as refeições.');
      })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [selecao]));

  const dataExibida = selecao.data ?? registro?.data ?? dataIsoDaClinica();
  const total = registro?.refeicoes.length ?? 0;
  const consumidas = registro?.refeicoes.filter(refeicao => refeicao.consumida).length ?? 0;
  const ocupado = carregando || salvando;
  const anteriorDesabilitado = ocupado || !registro;

  function voltarUmDia() {
    if (!registro) return;
    const data = new Date(`${registro.data}T12:00:00`);
    data.setDate(data.getDate() - 1);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    setSelecao({ data: `${ano}-${mes}-${dia}` });
  }

  async function alternarConsumo(id: number, consumida: boolean) {
    if (!registro?.editavel || ocupado) return;
    setSalvando(true);
    setErro('');
    try {
      setRegistro(await markMeal(id, registro.data, !consumida));
      await onChanged();
    } catch (falha) {
      toast.erro(falha instanceof Error ? falha.message : 'Não foi possível salvar o consumo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={sectionCardStyles.superficie} testID="daily-meals-card" aria-busy={ocupado}>
      <SectionCardHeader titulo="Refeições consumidas" icone="check-square" />

      <View style={styles.navegacao}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Consumo do dia anterior"
          disabled={anteriorDesabilitado}
          onPress={voltarUmDia}
          style={({ pressed }) => [styles.botaoData, pressed && styles.botaoPressionado, anteriorDesabilitado && styles.desabilitado]}
        >
          <Feather name="chevron-left" size={18} color={colors.brandDark} aria-hidden />
          <Text style={styles.textoBotao}>Anterior</Text>
        </Pressable>
        <Text style={styles.data} aria-live="polite" accessibilityLiveRegion="polite">
          {formatarDataCivil(dataExibida)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar ao consumo de hoje"
          disabled={ocupado}
          onPress={() => setSelecao({})}
          style={({ pressed }) => [styles.botaoData, styles.botaoHoje, pressed && styles.botaoPressionado, ocupado && styles.desabilitado]}
        >
          <Text style={styles.textoBotao}>Hoje</Text>
        </Pressable>
      </View>

      {carregando ? (
        <View style={styles.estado} accessibilityRole="progressbar" accessibilityLabel="Carregando refeições">
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.textoSecundario}>Carregando refeições…</Text>
        </View>
      ) : registro && total === 0 ? (
        <View style={styles.estado}>
          <View style={styles.iconeEstado}>
            <Feather name="inbox" size={20} color={colors.brandDeep} aria-hidden />
          </View>
          <Text style={styles.textoEstado}>Nenhuma refeição prevista para esta data.</Text>
        </View>
      ) : registro && (
        <View style={styles.conteudo}>
          <View style={styles.resumo}>
            <Text style={styles.progressoTexto} aria-live="polite" accessibilityLiveRegion="polite">
              {consumidas} de {total} {total === 1 ? 'refeição consumida' : 'refeições consumidas'}
            </Text>
            <View style={styles.trilho} aria-hidden>
              <View style={[styles.barra, { width: `${consumidas / total * 100}%` }]} />
            </View>
            <Text style={styles.textoSecundario}>
              {registro.editavel ? 'Marque as refeições que você consumiu.' : 'Histórico de consumo · somente leitura'}
            </Text>
          </View>
          {registro.refeicoes.map(refeicao => (
            <Pressable
              key={refeicao.id}
              accessibilityRole="checkbox"
              accessibilityLabel={`${refeicao.nome} ${refeicao.horario.slice(0, 5)}, ${Math.round(refeicao.totais.kcal)} kcal`}
              aria-checked={refeicao.consumida}
              accessibilityState={{ checked: refeicao.consumida, disabled: !registro.editavel || ocupado }}
              disabled={!registro.editavel || ocupado}
              onPress={() => void alternarConsumo(refeicao.id, refeicao.consumida)}
              onKeyDown={Platform.OS === 'web' ? evento => {
                if (evento.nativeEvent.key !== ' ') return;
                evento.preventDefault();
                if (!evento.nativeEvent.repeat) void alternarConsumo(refeicao.id, refeicao.consumida);
              } : undefined}
              style={({ pressed }) => [
                styles.refeicao,
                refeicao.consumida && styles.refeicaoConsumida,
                pressed && styles.botaoPressionado
              ]}
            >
              <View style={styles.dadosRefeicao}>
                <Text style={styles.nomeRefeicao}>{refeicao.nome}</Text>
                <Text style={styles.textoSecundario}>
                  {refeicao.horario.slice(0, 5)} · {Math.round(refeicao.totais.kcal)} kcal
                </Text>
              </View>
              <View style={[styles.marcador, refeicao.consumida && styles.marcadorAtivo]} aria-hidden>
                {refeicao.consumida && <Feather name="check" size={16} color={colors.white} aria-hidden />}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {!!erro && (
        <View style={styles.erro}>
          <Text accessibilityRole="alert" style={styles.textoErro}>{erro}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={ocupado}
            onPress={() => setSelecao(atual => ({ ...atual }))}
            style={({ pressed }) => [styles.botaoData, styles.tentarNovamente, pressed && styles.botaoPressionado]}
          >
            <Text style={styles.textoBotao}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navegacao: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.subtle,
    padding: spacing.xxs
  },
  data: {
    flexGrow: 1,
    textAlign: 'center',
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    lineHeight: 22
  },
  botaoData: {
    minHeight: 48,
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm
  },
  botaoHoje: { paddingHorizontal: spacing.sm, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  textoBotao: { color: colors.brandDark, fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 19 },
  botaoPressionado: { backgroundColor: colors.brandSoft },
  desabilitado: { opacity: 0.55 },
  estado: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm
  },
  iconeEstado: {
    backgroundColor: colors.subtle,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textoEstado: { flex: 1, color: colors.textSecondary, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21 },
  conteudo: { gap: spacing.xs },
  resumo: { gap: spacing.xs, marginBottom: spacing.xxs },
  progressoTexto: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 21 },
  trilho: { height: 4, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  barra: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.pill },
  refeicao: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm
  },
  refeicaoConsumida: { backgroundColor: colors.confirmedBackground, borderColor: colors.brandSoft },
  dadosRefeicao: { flex: 1, minWidth: 0, gap: spacing.xxs },
  nomeRefeicao: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 21 },
  textoSecundario: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  marcador: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  marcadorAtivo: { backgroundColor: colors.brand, borderColor: colors.brand },
  erro: { backgroundColor: colors.dangerButtonBackground, borderRadius: radius.md, padding: spacing.sm },
  textoErro: { color: colors.dangerText, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21 },
  tentarNovamente: { alignSelf: 'flex-start', paddingHorizontal: 0 }
});
