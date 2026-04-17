import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import playerStore from './store/playerStore';
import { RootStackNavigationProp } from './navigation';
const width = Dimensions.get('window').width;

const Home = () => {
  const cardWidth = (width - 80) / 4;
  const navigation = useNavigation<RootStackNavigationProp>();
  const players = playerStore(state => state.players);
  const setSelectedPlayer = playerStore(state => state.setSelectedPlayer);
  const setPlayers = playerStore(state => state.setPlayers);

  useEffect(() => {
    setPlayers(Array(11).fill({ id: '', name: '' }));
  }, []);

  const handleNavigation = useCallback((item: any, index: number) => {
    setSelectedPlayer(item);
    navigation.navigate('player_select', { slotIndex: index });
  }, []);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        {players &&
          players.length > 0 &&
          players.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.6}
              onPress={() => handleNavigation(item, index)}
              style={{
                height: 100,
                width: cardWidth,
                backgroundColor: 'gray',
                borderRadius: 16,
              }}
            >
              <Text>{index}</Text>
              {item.id ? <Text>{item.name}</Text> : null}
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

export default Home;
