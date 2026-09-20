import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import CriarContaScreen from '../screens/CriarContaScreen';
import TrocarSenhaScreen from '../screens/TrocarSenhaScreen';
import NovaSenhaScreen from '../screens/NovaSenhaScreen';
import { HealthScreen } from '../screens/health/HealthScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TrocarSenha" component={TrocarSenhaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NovaSenha" component={NovaSenhaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CriarConta" component={CriarContaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Nutri4You' }} />
        <Stack.Screen name="Health" component={HealthScreen} options={{ title: 'Status da API' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
