import { DrawerScreenProps } from '@react-navigation/drawer';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/types';

type Props = DrawerScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.titulo}>Em breve</Text>
        <Text style={styles.subtitulo}>
          Vamos implementar o conteúdo do dashboard nesta tela em breve.
        </Text>
        <Pressable
          style={styles.botao}
          onPress={() => navigation.navigate('DadosPessoais')}
          accessibilityRole="button"
        >
          <Text style={styles.botaoTexto}>Dados pessoais</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9f9' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: '#14532d', marginBottom: 8 },
  subtitulo: { fontSize: 14, color: '#475569', marginBottom: 24 },
  botao: {
    backgroundColor: '#006f1e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  botaoTexto: { color: '#fff', fontWeight: '700', fontSize: 15 }
});

