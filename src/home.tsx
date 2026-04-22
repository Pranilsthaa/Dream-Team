import { View, Text, Button } from 'react-native';
import React from 'react';
import { RootStackNavigationProp } from './navigation';
import { useNavigation } from '@react-navigation/native';

const Dashboard = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  return (
    <View>
      <Text>Dashboard</Text>
      <Button
        title="Player Transfer"
        onPress={() => navigation.navigate('player_transfer')}
      />
    </View>
  );
};

export default Dashboard;
