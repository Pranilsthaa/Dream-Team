import { useState, useCallback, useMemo, useRef } from 'react';
import {
  cannotAddReason,
  getRoleCounts,
  type TPlayerItem,
} from '../constants/squadRules';
import type { RoleTab } from '../theme';

type SortMode = 'pts_desc' | 'price_desc' | 'price_asc';

const SORT_LABELS: Record<SortMode, string> = {
  pts_desc: 'Points ↓',
  price_desc: 'Price ↓',
  price_asc: 'Price ↑',
};

const SORT_CYCLE: SortMode[] = ['pts_desc', 'price_desc', 'price_asc'];

export function usePlayerSelect(allPlayers: TPlayerItem[]) {
  const [selected, setSelected] = useState<TPlayerItem[]>([]);
  const [activeRole, setActiveRole] = useState<RoleTab>('ALL');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('pts_desc');
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(
    null,
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, isError = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, isError });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const togglePlayer = useCallback(
    (item: TPlayerItem) => {
      setSelected(prev => {
        const isSelected = prev.some(p => p.id === item.id);
        if (isSelected) {
          return prev.filter(p => p.id !== item.id);
        }
        const reason = cannotAddReason(item, prev);
        if (reason) {
          showToast(reason, true);
          return prev;
        }
        return [...prev, item];
      });
    },
    [showToast],
  );

  const cycleSort = useCallback(() => {
    setSortMode(prev => {
      const idx = SORT_CYCLE.indexOf(prev);
      return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
    });
  }, []);

  // Memoised — only recomputes when players/filter/sort/search changes
  const filteredPlayers = useMemo(() => {
    let list = allPlayers.filter(p => {
      if (activeRole !== 'ALL' && p.role !== activeRole) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.team.code.toLowerCase().includes(q)
        );
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortMode === 'pts_desc') return (b as any).pts - (a as any).pts;
      if (sortMode === 'price_desc') return b.price - a.price;
      return a.price - b.price;
    });

    return list;
  }, [allPlayers, activeRole, search, sortMode]);

  const selectedIds = useMemo(
    () => new Set(selected.map(p => p.id)),
    [selected],
  );
  const roleCounts = useMemo(() => getRoleCounts(selected), [selected]);
  const sortLabel = SORT_LABELS[sortMode];

  return {
    selected,
    activeRole,
    setActiveRole,
    search,
    setSearch,
    sortLabel,
    cycleSort,
    filteredPlayers,
    selectedIds,
    roleCounts,
    toast,
    togglePlayer,
  };
}
