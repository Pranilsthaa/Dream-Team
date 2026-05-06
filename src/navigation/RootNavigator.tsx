import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import { NavigationContainer } from '@react-navigation/native';
import PlayerTransferScreen from '@/screens/fantasy/transfer';
import PlayerSelectScreen from '@/screens/fantasy/playerSelectScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const auth = true;
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'default' }}
      >
        {auth ? (
          <>
            <Stack.Screen name="App" component={AppNavigator} />
            <Stack.Screen
              name="player_transfer"
              component={PlayerTransferScreen}
            />
            <Stack.Screen name="player_select" component={PlayerSelectScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
