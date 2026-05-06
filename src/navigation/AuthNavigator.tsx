import { View, Text } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppText } from '@/components/common/AppText';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="SignIn"
        component={() => <AppText> SignIn</AppText>}
      />
      <Stack.Screen
        name="SignUp"
        component={() => <AppText> SignUp</AppText>}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
