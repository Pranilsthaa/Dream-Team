import { theme } from "@/constants/theme";
import {
  Bell,
  Clock3,
  House,
  Link,
  Plus,
  Shirt,
  Trophy,
  UserPlus,
} from "lucide-react-native";

const icons = {
  home: House,
  squad: Shirt,
  matches: Clock3,
  leagues: Trophy,
  bell: Bell,
  plus: Plus,
  link: Link,
  players: UserPlus,
};
export type IconName = keyof typeof icons;

export function DashboardIcon({
  name,
  color = theme.colors.accent,
  size = 24,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  const Icon = icons[name];
  return <Icon color={color} size={size} strokeWidth={2} accessible={false} />;
}
