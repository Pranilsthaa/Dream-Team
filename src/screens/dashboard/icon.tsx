import { Image } from 'expo-image';
import { theme } from '@/constants/theme';

const paths = {
  home: '<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/>',
  squad: '<path d="M8 4l4 2 4-2 5 4-3 4-2-1v9H8v-9l-2 1-3-4z"/>',
  matches: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  leagues: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 20h8"/>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  players: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 11h4M19 9v4"/>',
};
export type IconName = keyof typeof paths;

export function DashboardIcon({ name, color = theme.colors.accent, size = 24 }: { name: IconName; color?: string; size?: number }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  return <Image accessible={false} source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }} style={{ width: size, height: size }} />;
}
