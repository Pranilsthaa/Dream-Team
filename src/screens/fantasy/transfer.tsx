import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import playerStore from '../../store/playerStore';
const width = Dimensions.get('window').width;

const TOTAL_BUDGET = 100;
const TRANSFER_LIMIT = 11;

const PlayerTransferScreen = () => {
  const cardWidth = (width - 80) / 4;
  const navigation = useNavigation() as any;
  const players = playerStore(state => state.players);
  const setPlayers = playerStore(state => state.setPlayers);
  const [oldPlayers, setOldPlayers] = useState(new Set());

  const dummyPlayers = Array(11).fill({ id: '', name: '', price: 0 });

  useEffect(() => {
    setPlayers(dummyPlayers);
    setOldPlayers(new Set(dummyPlayers.map(p => p.id)));
  }, []);

  const handleNavigation = useCallback((item: any, index: number) => {
    navigation.navigate('player_select', { slotIndex: index });
  }, []);

  const budget_rem =
    TOTAL_BUDGET -
    players.reduce((acc, player) => acc + (player.price ?? 0), 0);

  const transferCount = useMemo(() => {
    return players.filter(player => !oldPlayers.has(player.id)).length;
  }, [players]);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: '#fff' }}>
        Budget:
        <Text style={{ color: budget_rem < 0 ? 'red' : 'green' }}>
          {' '}
          {budget_rem}
        </Text>
      </Text>
      <Text style={{ color: '#fff' }}>
        Transfer:
        <Text style={{ color: 'white' }}>
          {' '}
          {TRANSFER_LIMIT - transferCount}
        </Text>
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 16,
          marginTop: 16,
        }}
      >
        {players &&
          players.length > 0 &&
          players.map((item, index) => {
            const disabled = transferCount >= TRANSFER_LIMIT && !item.id;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.6}
                onPress={() => handleNavigation(item, index)}
                disabled={disabled}
                style={{
                  height: 100,
                  width: cardWidth,
                  backgroundColor: 'gray',
                  borderRadius: 16,
                }}
              >
                <Text>{index}</Text>
                {item.id ? (
                  <>
                    <Text>{item.name}</Text>
                    <Text>NRs. {item.price}</Text>
                  </>
                ) : null}
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
};

export default PlayerTransferScreen;
