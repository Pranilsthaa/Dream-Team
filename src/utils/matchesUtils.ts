export type MatchStatus = 'live' | 'upcoming' | 'completed' | 'postponed' | string;

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: boolean }
> = {
  live: { label: 'LIVE', color: '#EF4444', bg: '#FEF2F2', dot: true },
  upcoming: { label: 'UPCOMING', color: '#6366F1', bg: '#EEF2FF', dot: false },
  completed: { label: 'FULL TIME', color: '#6B7280', bg: '#F3F4F6', dot: false },
  postponed: { label: 'POSTPONED', color: '#F59E0B', bg: '#FFFBEB', dot: false },
};

export const getStatusConfig = (status: string) => {
  const key = status.toLowerCase();
  return STATUS_CONFIG[key] ?? { label: status.toUpperCase(), color: '#6B7280', bg: '#F3F4F6', dot: false };
};

export const formatMatchDate = (dateStr: string): { day: string; time: string; isToday: boolean; isTomorrow: boolean } => {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const day = isToday
    ? 'Today'
    : isTomorrow
    ? 'Tomorrow'
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return { day, time, isToday, isTomorrow };
};

export const groupMatchesByDate = (matches: any[]) => {
  const groups: Record<string, any[]> = {};
  for (const match of matches) {
    const { day } = formatMatchDate(match.date);
    if (!groups[day]) groups[day] = [];
    groups[day].push(match);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
};