import { createDrawerNavigator } from '@react-navigation/drawer';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { EvolucaoScreen } from '../screens/evolucao/EvolucaoScreen';
import { RootStackParamList } from './types';

const Drawer = createDrawerNavigator<RootStackParamList>();

export function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerTintColor: '#006f1e',
        headerTitleStyle: { fontWeight: '700' },
        drawerActiveTintColor: '#006f1e'
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Início' }}
      />
      <Drawer.Screen
        name="Evolucao"
        component={EvolucaoScreen}
        options={{ title: 'Evolução', headerShown: false }}
      />
    </Drawer.Navigator>
  );
}

