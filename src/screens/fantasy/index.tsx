import { View, Text, Button } from 'react-native';
import React from 'react';

const FantasyTab = ({ navigation }: any) => {
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

export default FantasyTab;
