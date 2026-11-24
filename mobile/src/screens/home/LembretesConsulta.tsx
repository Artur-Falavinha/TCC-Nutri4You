import { toast } from '../../components/feedback/toast';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { carregarLembretesConsulta, salvarLembretesConsulta } from '../../core/perfil/perfil.service';
import { SectionCardHeader, sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { colors, radius, spacing } from '../../theme/tokens';
import { perfilStyles } from './perfil.styles';

export function LembretesConsulta() {
  const [ativa, setAtiva] = useState<boolean | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vigente = true;
    void carregarLembretesConsulta()
      .then(preferencia => { if (vigente) setAtiva(preferencia.ativa); })
      .catch(() => { if (vigente) setErro('Não foi possível carregar sua preferência.'); })
      .finally(() => { if (vigente) setCarregando(false); });
    return () => { vigente = false; };
  }, [tentativa]);

  const tentarNovamente = () => {
    setErro('');
    setCarregando(true);
    setTentativa(atual => atual + 1);
  };

  const salvar = async (novoValor: boolean) => {
    if (salvando) return;
    setErro('');
    setSalvando(true);
    try {
      const preferencia = await salvarLembretesConsulta(novoValor);
      setAtiva(preferencia.ativa);
      toast.sucesso(preferencia.ativa ? 'Lembretes ativados.' : 'Lembretes desativados.');
    } catch {
      toast.erro('Não foi possível salvar a preferência. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={sectionCardStyles.superficie}>
      <SectionCardHeader titulo="Lembretes de consulta" icone="bell" />
      <Text style={perfilStyles.descricao}>
        Receba um lembrete no app e por e-mail 24 horas antes de uma consulta confirmada.
      </Text>

      {carregando ? (
        <ActivityIndicator color={colors.brand} accessibilityLabel="Carregando preferência de lembretes" />
      ) : null}

      {ativa !== null ? (
        <View style={styles.controle}>
          <Text style={perfilStyles.rotuloBotao} accessibilityLiveRegion="polite">
            {salvando ? 'Salvando…' : ativa ? 'Ativados' : 'Desativados'}
          </Text>
          <Switch
            accessibilityLabel="Lembretes de consulta"
            accessibilityState={{ checked: ativa, disabled: salvando, busy: salvando }}
            disabled={salvando}
            value={ativa}
            onValueChange={valor => void salvar(valor)}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor={colors.white}
          />
        </View>
      ) : null}

      {erro ? <Text style={perfilStyles.erro} accessibilityRole="alert">{erro}</Text> : null}
      {!carregando && ativa === null ? (
        <Pressable
          accessibilityRole="button"
          onPress={tentarNovamente}
          style={({ pressed }) => [perfilStyles.botao, perfilStyles.secundario, pressed && perfilStyles.pressionado]}
        >
          <Text style={perfilStyles.rotuloBotao}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  controle: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.page
  }
});
