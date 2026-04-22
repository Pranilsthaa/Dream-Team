import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import playerStore from './store/playerStore';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Config from 'react-native-config';

type TPlayerItem = {
  id: string;
  name: string;
  age: string;
  price: number;
  role: string;
  isActive: boolean;
  team: {
    name: string;
    logo: string;
    code: string;
  };
};

type TplayerResponse = {
  success: boolean;
  message: string;
  data: TPlayerItem[];
};

// const dummyData: { id: string; name: string; price: number }[] = Array.from({
//   length: 30,
// }).map((_, index) => ({
//   id: String(index),
//   name: `Player ${index}`,
//   price: Number(((index + 1) * 1.25).toFixed()),
// }));

const PlayerSelect = ({ route }: { route: any }) => {
  const navigation = useNavigation();
  const [playersData, setPlayersData] = useState<TPlayerItem[]>([]);

  const { slotIndex } = route.params;
  const players = playerStore(state => state.players);
  const updateSlot = playerStore(state => state.updateSlot);

  const handlePlayerSelect = useCallback((item: any) => {
    updateSlot(slotIndex, item);
    navigation.goBack();
  }, []);

  const fetchPlayers = async () => {
    const BASE_URL = Config.BASE_URL;
    try {
      const players = await axios.get<TplayerResponse>(
        `${BASE_URL}/api/players`,
      );
      setPlayersData(players.data.data);
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    fetchPlayers();
  }, []);
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      {players[slotIndex].id ? (
        <View
          style={{
            backgroundColor: 'gray',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text>Outgoing Player</Text>
          <Text>{players[slotIndex].name}</Text>
        </View>
      ) : null}
      <FlatList
        data={playersData}
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
                {item.name} ({item.team.code})
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
