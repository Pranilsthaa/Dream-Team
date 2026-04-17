import { create } from 'zustand';

interface Player {
  id: string;
  name: string;
}

interface PlayerStore {
  selectedPlayer: Player;
  players: Player[];
  setSelectedPlayer: (player: Player) => void;
  setPlayers: (players: Player[]) => void;
  updateSlot: (slotIndex: number, player: Player) => void;
}

const playerStore = create<PlayerStore>(set => {
  return {
    selectedPlayer: {id: '', name: ''},
    players: [],
    setSelectedPlayer: (player: any) => set({ selectedPlayer: player }),
    setPlayers: (players: any) => set({ players }),
    updateSlot: (slotIndex: number, player: any) => set(state=> {
      const newPlayers = [...state.players]
      newPlayers[slotIndex] = player
      return {players: newPlayers}
    }),
  };
});

export default playerStore;
