import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Placeholder da tela inicial do paciente. A partir da Sprint 5, esta tela
 * dá lugar à dieta ativa, consultas, metas e atalhos definidos no protótipo.
 */
export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutri4You — Mobile</Text>
      <Text style={styles.subtitle}>Baseline da Sprint 1.</Text>
      <Button title="Ver status da API" onPress={() => navigation.navigate('Health')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24
  },
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b'
  }
});
