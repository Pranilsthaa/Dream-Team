import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import React, { useCallback } from 'react';
import playerStore from './store/playerStore';
import { useNavigation } from '@react-navigation/native';

const dummyData: { id: string; name: string; price: number }[] = Array.from({
  length: 30,
}).map((_, index) => ({
  id: String(index),
  name: `Player ${index}`,
  price: Number(((index + 1) * 1.25).toFixed()),
}));

const PlayerSelect = ({ route }: { route: any }) => {
  const navigation = useNavigation();
  const { slotIndex } = route.params;
  const players = playerStore(state => state.players);
  const selectedPlayer = playerStore(state => state.selectedPlayer);
  const updateSlot = playerStore(state => state.updateSlot);
  const handlePlayerSelect = useCallback((item: any) => {
    updateSlot(slotIndex, item);
    navigation.goBack();
  }, []);
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      {selectedPlayer.id ? (
        <View
          style={{
            backgroundColor: 'gray',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text>Outgoing Player</Text>
          <Text>{selectedPlayer.name}</Text>
        </View>
      ) : null}
      <FlatList
        data={dummyData}
        renderItem={({ item, index }) => {
          const disabled = players.some(player => player.id === item.id);
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handlePlayerSelect(item)}
              style={{
                borderRadius: 8,
                padding: 16,
                backgroundColor: index % 2 ? '#9a9a9aff' : '#fff',
                opacity: disabled ? 0.3 : 1,
              }}
              disabled={disabled}
            >
              <Text style={{ color: '#000', fontWeight: 'bold' }}>
                {`#${index + 1} `}
                {item.name}
              </Text>
              <Text style={{ color: '#000' }}>NRs. {item.price}</Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ rowGap: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default PlayerSelect;
