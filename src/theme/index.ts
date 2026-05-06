export const Colors = {
  bg:       '#0a0e1a',
  surface:  '#111827',
  surface2: '#1a2235',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.14)',

  accent:   '#00e5a0',
  accentDim:'rgba(0,229,160,0.12)',
  info:     '#0ea5e9',
  warn:     '#f59e0b',
  warnDim:  'rgba(245,158,11,0.15)',
  danger:   '#ef4444',
  dangerDim:'rgba(239,68,68,0.12)',

  text:     '#f1f5f9',
  muted:    '#64748b',
  muted2:   '#94a3b8',

  role: {
    WK:  '#a78bfa',
    BAT: '#34d399',
    BWL: '#60a5fa',
    AR:  '#fb923c',
  },
  roleDim: {
    WK:  'rgba(167,139,250,0.15)',
    BAT: 'rgba(52,211,153,0.15)',
    BWL: 'rgba(96,165,250,0.15)',
    AR:  'rgba(251,146,60,0.15)',
  },
  roleBorder: {
    WK:  'rgba(167,139,250,0.30)',
    BAT: 'rgba(52,211,153,0.30)',
    BWL: 'rgba(96,165,250,0.30)',
    AR:  'rgba(251,146,60,0.30)',
  },
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
} as const;

export const Radius = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  full: 999,
} as const;

export const FontSize = {
  xs:   10,
  sm:   12,
  md:   14,
  lg:   16,
  xl:   18,
  xxl:  22,
} as const;

// Role display helpers
export const ROLE_LABEL: Record<string, string> = {
  WK:  'Wicket-keeper',
  BAT: 'Batter',
  BWL: 'Bowler',
  AR:  'All-rounder',
};

export const ROLE_TABS = ['ALL', 'WK', 'BAT', 'BWL', 'AR'] as const;
export type RoleTab = (typeof ROLE_TABS)[number];