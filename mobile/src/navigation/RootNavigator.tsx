import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import {
  CommonActions,
  NavigationContainer,
  NavigationContainerRef
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { apiClient } from '../core/api/api-client';
import { getToken } from '../core/auth/token-storage';
import { extractResetTokenFromUrl } from '../core/utils/deep-link.util';
import { isValidUuid } from '../core/utils/uuid.util';
import LoginScreen from '../screens/LoginScreen';
import CriarContaScreen from '../screens/CriarContaScreen';
import TrocarSenhaScreen from '../screens/TrocarSenhaScreen';
import NovaSenhaScreen from '../screens/NovaSenhaScreen';
import { HealthScreen } from '../screens/health/HealthScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['nutri4you://', 'http://localhost:4200', 'https://localhost:4200'],
  config: {
    screens: {
      NovaSenha: {
        path: 'redefinir-senha',
        parse: {
          token: (token: string) => token
        }
      },
      Login: 'login',
      TrocarSenha: 'esqueci-senha',
      CriarConta: 'cadastro',
      Home: 'home',
      Health: 'health'
    }
  }
};

export function RootNavigator() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

  const goToLogin = useCallback(() => {
    navigationRef.current?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      })
    );
  }, []);

  useEffect(() => {
    apiClient.setUnauthorizedHandler(goToLogin);
    return () => apiClient.setUnauthorizedHandler(null);
  }, [goToLogin]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getToken();
      if (!cancelled) {
        setInitialRoute(token ? 'Home' : 'Login');
        setBootstrapped(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const token = extractResetTokenFromUrl(url);
      if (!token || !isValidUuid(token)) {
        return;
      }
      navigationRef.current?.navigate('NovaSenha', { token });
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, []);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#005414" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="TrocarSenha"
          component={TrocarSenhaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NovaSenha"
          component={NovaSenhaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CriarConta"
          component={CriarContaScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Nutri4You' }} />
        <Stack.Screen name="Health" component={HealthScreen} options={{ title: 'Status da API' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
