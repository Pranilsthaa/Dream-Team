export const leagues = [
  { name: 'IPL Office Cup', game: 'Cricket', rank: 4, members: 24, points: 412, round: 68, code: 'IPL-7XK2', admin: true },
  { name: 'Futsal Fridays', game: 'Football', rank: 2, members: 12, points: 190, round: 41, code: 'FUT-9QM4', admin: false },
  { name: 'Campus Valorant', game: 'Esports', rank: 7, members: 30, points: 256, round: 35, code: 'VAL-3TR8', admin: true },
] as const;
export const scoring = {
  Cricket: [['Runs', 1], ['Wickets', 20], ['Catches', 8]],
  Football: [['Goals', 6], ['Assists', 3], ['Clean sheets', 4]],
  Esports: [['Kills', 2], ['Assists', 1], ['Deaths', -1]],
} as const;
export const signed = (value: number) => value > 0 ? `+${value}` : String(value);
