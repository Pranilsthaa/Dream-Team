
export const SQUAD_RULES = {
  TOTAL_PLAYERS:  11,
  BUDGET:         100.0,
  MAX_PER_TEAM:   4,
  ROLE_LIMITS: {
    WK:  { min: 1, max: 2 },
    BAT: { min: 3, max: 5 },
    BWL: { min: 3, max: 5 },
    AR:  { min: 1, max: 3 },
  },
} as const;

export type RoleKey = keyof typeof SQUAD_RULES.ROLE_LIMITS;

export type TPlayerItem = {
  id:       string;
  name:     string;
  age:      string;
  price:    number;
  role:     RoleKey;
  isActive: boolean;
  team: {
    name: string;
    logo: string;
    code: string;
  };
};

export function getBudgetSpent(selected: TPlayerItem[]): number {
  return selected.reduce((sum, p) => sum + p.price, 0);
}

export function getBudgetLeft(selected: TPlayerItem[]): number {
  return Math.round((SQUAD_RULES.BUDGET - getBudgetSpent(selected)) * 10) / 10;
}

export function getRoleCounts(selected: TPlayerItem[]): Record<RoleKey, number> {
  const counts: Record<RoleKey, number> = { WK: 0, BAT: 0, BWL: 0, AR: 0 };
  selected.forEach(p => { counts[p.role] = (counts[p.role] || 0) + 1; });
  return counts;
}

export function getTeamCounts(selected: TPlayerItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  selected.forEach(p => { counts[p.team.code] = (counts[p.team.code] || 0) + 1; });
  return counts;
}

export function isSquadComplete(selected: TPlayerItem[]): boolean {
  if (selected.length !== SQUAD_RULES.TOTAL_PLAYERS) return false;
  const rc = getRoleCounts(selected);
  return (Object.keys(SQUAD_RULES.ROLE_LIMITS) as RoleKey[]).every(
    r => rc[r] >= SQUAD_RULES.ROLE_LIMITS[r].min
  );
}

// Returns a human-readable reason why a player can't be added, or null if they can.
export function cannotAddReason(
  player: TPlayerItem,
  selected: TPlayerItem[],
): string | null {
  if (selected.length >= SQUAD_RULES.TOTAL_PLAYERS)
    return 'Squad is full (11 players max)';

  const budgetLeft = getBudgetLeft(selected);
  if (player.price > budgetLeft)
    return `Not enough budget — need ${player.price}, have ${budgetLeft.toFixed(1)}`;

  const rc = getRoleCounts(selected);
  if (rc[player.role] >= SQUAD_RULES.ROLE_LIMITS[player.role].max)
    return `Max ${SQUAD_RULES.ROLE_LIMITS[player.role].max} ${player.role}s allowed`;

  const tc = getTeamCounts(selected);
  if ((tc[player.team.code] || 0) >= SQUAD_RULES.MAX_PER_TEAM)
    return `Max ${SQUAD_RULES.MAX_PER_TEAM} players from ${player.team.name}`;

  return null;
}