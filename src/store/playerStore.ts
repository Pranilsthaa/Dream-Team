import { create } from 'zustand';

interface Player {
  id: string;
  name: string;
  price: number
}

interface PlayerStore {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  updateSlot: (slotIndex: number, player: Player) => void;
}

const playerStore = create<PlayerStore>(set => {
  return {
    players: [],
    setPlayers: (players: any) => set({ players }),
    updateSlot: (slotIndex: number, player: any) => set(state=> {
      const newPlayers = [...state.players]
      newPlayers[slotIndex] = player
      return {players: newPlayers}
    }),
  };
});

export default playerStore;
