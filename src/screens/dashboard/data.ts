export const scoring = {
  Cricket: [
    ["Runs", 1],
    ["Wickets", 20],
    ["Catches", 8],
  ],
  Football: [
    ["Goals", 6],
    ["Assists", 3],
    ["Clean sheets", 4],
  ],
  Esports: [
    ["Kills", 2],
    ["Assists", 1],
    ["Deaths", -1],
  ],
} as const;
export const signed = (value: number) =>
  value > 0 ? `+${value}` : String(value);
