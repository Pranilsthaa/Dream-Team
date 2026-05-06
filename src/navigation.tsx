import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import Home from './home';
import PlayerSelect from './playerSelectScreen';
import PlayerTransferScreen from './transfer';

type RootStackParamList = {
  Home: undefined;
  player_transfer: undefined;
  player_select: { slotIndex: number };
};

export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: 'rgba(65, 64, 64, 1)' },
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="player_transfer" component={PlayerTransferScreen} />
        <Stack.Screen name="player_select" component={PlayerSelect} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
