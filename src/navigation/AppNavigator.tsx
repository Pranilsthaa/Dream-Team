import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FantasyTab from '@/screens/fantasy';
import MatchesTab from '@/screens/matches';

const BottomTab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <BottomTab.Navigator screenOptions={{ headerShown: false }}>
      <BottomTab.Screen name="Fantasy" component={FantasyTab} />
      <BottomTab.Screen name="Matches" component={MatchesTab} />
    </BottomTab.Navigator>
  );
};

export default AppNavigator;
