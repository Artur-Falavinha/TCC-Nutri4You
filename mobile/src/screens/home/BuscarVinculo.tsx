import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';
import { NutricionistaEncontrado, pesquisarNutricionistas, solicitarVinculo } from '../../core/perfil/perfil.service';

export function BuscarVinculo({ temVinculo }: { temVinculo: boolean }) {
  const [nome, setNome] = useState('');
  const [resultados, setResultados] = useState<NutricionistaEncontrado[]>([]);
  const [enviados, setEnviados] = useState<number[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function buscar() {
    setOcupado(true);
    setResultados([]);
    setMensagem('');
    try {
      const encontrados = await pesquisarNutricionistas(nome.trim());
      setResultados(encontrados);
      if (!encontrados.length) setMensagem('Nenhum profissional encontrado.');
    } catch {
      setMensagem('Não foi possível buscar nutricionistas.');
    } finally {
      setOcupado(false);
    }
  }

  async function enviar(id: number) {
    setOcupado(true);
    setMensagem('');
    try {
      await solicitarVinculo(id);
      setEnviados(atuais => [...atuais, id]);
      setMensagem('Solicitação enviada. Aguarde a decisão do nutricionista.');
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : 'Não foi possível enviar a solicitação.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">Buscar nutricionista</Text>
      <Text style={styles.description}>Você só pode manter um vínculo ativo por vez. Ao aceitar a solicitação, o nutricionista poderá acessar sua ficha clínica para acompanhar você.</Text>
      {temVinculo ? <Text style={styles.description}>Encerre o vínculo atual para solicitar outro.</Text> : (
        <>
          <TextInput style={styles.input} placeholderTextColor={colors.textSubtle} accessibilityLabel="Nome do nutricionista" placeholder="Nome do nutricionista" value={nome}
            onChangeText={setNome} editable={!ocupado} maxLength={150} />
          <Pressable style={[styles.primary, (ocupado || nome.trim().length < 2) && styles.disabled]} accessibilityRole="button"
            disabled={ocupado || nome.trim().length < 2} onPress={() => void buscar()}>
            {ocupado ? <ActivityIndicator color={colors.white} /> : <Feather name="search" size={17} color={colors.white} />}
            <Text style={styles.primaryText}>Pesquisar</Text>
          </Pressable>
          {resultados.map(item => (
            <View key={item.id} style={styles.result}>
              <Text style={styles.name}>{item.nome}</Text>
              <Pressable style={[styles.secondary, (ocupado || enviados.includes(item.id)) && styles.disabled]} accessibilityRole="button"
                accessibilityLabel={`Solicitar vínculo com ${item.nome}`}
                disabled={ocupado || enviados.includes(item.id)} onPress={() => void enviar(item.id)}>
                <Text style={styles.secondaryText}>{enviados.includes(item.id) ? 'Solicitação enviada' : 'Solicitar vínculo'}</Text>
              </Pressable>
            </View>
          ))}
          {mensagem ? <Text style={styles.description} accessibilityLiveRegion="polite">{mensagem}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.text },
  description: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  input: { minHeight: 48, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.white, color: colors.text, fontFamily: fontFamily.regular },
  primary: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.brand },
  primaryText: { color: colors.white, fontFamily: fontFamily.bold, fontSize: 14 },
  result: { padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.white },
  name: { color: colors.text, fontFamily: fontFamily.bold },
  secondary: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.brand, borderRadius: radius.sm },
  secondaryText: { color: colors.brand, fontFamily: fontFamily.bold },
  disabled: { opacity: 0.5 }
});
