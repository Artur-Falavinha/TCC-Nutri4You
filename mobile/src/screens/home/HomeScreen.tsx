import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, StyleSheet, Text, View } from 'react-native';

import { logout } from '../../core/auth/auth.service';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Placeholder da tela inicial do paciente. A partir da Sprint 5, esta tela
 * dá lugar à dieta ativa, consultas, metas e atalhos definidos no protótipo.
 */
export function HomeScreen({ navigation }: Props) {
  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      })
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutri4You — Mobile</Text>
      <Text style={styles.subtitle}>Área do paciente</Text>
      <Button title="Ver status da API" onPress={() => navigation.navigate('Health')} />
      <Button title="Sair" onPress={handleLogout} />
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
