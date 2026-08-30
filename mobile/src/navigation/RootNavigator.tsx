import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HealthScreen } from '../screens/health/HealthScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Stack base da Sprint 1. A partir da Sprint 2, este navegador deve ganhar
 * um fluxo de autenticação (autocadastro, validação de e-mail, login) que
 * antecede o acesso às telas autenticadas — hoje Home e Health ficam
 * acessíveis diretamente só para validar o fluxo técnico cliente -> API.
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Nutri4You' }} />
        <Stack.Screen name="Health" component={HealthScreen} options={{ title: 'Status da API' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
