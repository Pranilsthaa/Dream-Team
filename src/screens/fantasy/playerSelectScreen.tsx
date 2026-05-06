import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Animated,
  InteractionManager,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { RoleTabBar } from '@/components/PlayerSelect/RoleTabBar';
import { SquadTray } from '@/components/PlayerSelect/SquadTray';
import { AppText } from '@/components/common/AppText';
import { apiInstance } from '@/api/apiClient';
import { usePlayerSelect } from '@/hooks/usePlayerSelect';
import {
  cannotAddReason,
  isSquadComplete,
  TPlayerItem,
} from '@/constants/squadRules';
import { PlayerRow } from '@/components/PlayerSelect/PlayerRow';
import { Colors, FontSize, Radius, Spacing } from '@/theme';
import { StatsHeader } from '@/components/PlayerSelect/StatsHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TPlayerResponse = {
  success: boolean;
  message: string;
  data: TPlayerItem[];
};

// ── List header row ────────────────────────────────────────────────────────
const ListColumnHeader = () => (
  <View style={styles.listHeader}>
    <AppText style={[styles.colLabel, { flex: 1 }]}>Player</AppText>
    <AppText style={styles.colLabel}>Price</AppText>
    <View style={{ width: 46 }} />
  </View>
);

// ── Empty state ────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.empty}>
    <AppText style={styles.emptyIcon}>🔍</AppText>
    <AppText style={styles.emptyText}>No players found</AppText>
    <AppText style={styles.emptyMuted}>
      Try a different filter or search term
    </AppText>
  </View>
);

// ── Main screen ────────────────────────────────────────────────────────────
const PlayerSelectScreen = ({ route }: { route: any }) => {
  const navigation = useNavigation();
  const [allPlayers, setAllPlayers] = useState<TPlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    // Fetch players
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiInstance.get<TPlayerResponse>('/api/players');
        setAllPlayers(res.data.data);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load players. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    setTimeout(() => {
      fetchPlayers();
      setIsReady(true);
    }, 400);
  }, []);

  // All logic lives in the hook
  const {
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
  } = usePlayerSelect(allPlayers);

  // Toast animation
  const toastAnim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(toastAnim, {
      toValue: toast ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [toast]);

  const handleConfirm = useCallback(() => {
    if (!isSquadComplete(selected)) return;
    // TODO: dispatch to playerStore or navigate to captain pick screen
    // playerStore.getState().setSquad(selected);
    // navigation.navigate('CaptainPick');
  }, [selected]);

  const renderItem = useCallback(
    ({ item, index }: { item: TPlayerItem; index: number }) => {
      const isSelected = selectedIds.has(item.id);
      // A player is disabled if they can't be added and aren't already selected
      const isDisabled =
        !isSelected && cannotAddReason(item, selected) !== null;
      return (
        <PlayerRow
          item={item}
          index={index}
          isSelected={isSelected}
          isDisabled={isDisabled}
          onPress={togglePlayer}
        />
      );
    },
    [selectedIds, selected, togglePlayer],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <AppText style={styles.loadingText}>Loading players…</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AppText style={styles.errorIcon}>⚡</AppText>
        <AppText style={styles.errorText}>{error}</AppText>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => setLoading(true)}
        >
          <AppText style={styles.retryText}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── Sticky header block ── */}
      <View style={styles.stickyHeader}>
        {/* Nav row */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppText style={styles.backArrow}>←</AppText>
          </TouchableOpacity>
          <AppText style={styles.screenTitle}>Pick Your Squad</AppText>
          {/* Deadline badge */}
          <View style={styles.deadlineBadge}>
            <View style={styles.deadlineDot} />
            <AppText style={styles.deadlineText}>2h 14m</AppText>
          </View>
        </View>

        {/* Budget / count / team stats */}
        <StatsHeader selected={selected} />

        {/* Role filter tabs */}
        <RoleTabBar
          active={activeRole}
          roleCounts={roleCounts}
          onChange={setActiveRole}
        />

        {/* Search + sort row */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <AppText style={styles.searchIcon}>⌕</AppText>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search player or team…"
              placeholderTextColor={Colors.muted}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={styles.clearBtn}>✕</AppText>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={cycleSort}
            activeOpacity={0.75}
          >
            <AppText style={styles.sortText}>{sortLabel}</AppText>
          </TouchableOpacity>
        </View>

        {/* Column labels */}
        <ListColumnHeader />
      </View>

      <FlatList
        data={filteredPlayers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={12}
        windowSize={8}
        initialNumToRender={14}
        getItemLayout={(_, index) => ({
          length: 68,
          offset: 68 * index,
          index,
        })}
      />

      {/* ── Bottom tray ── */}
      <SquadTray selected={selected} onConfirm={handleConfirm} />

      {/* ── Toast ── */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.isError && styles.toastError,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <AppText
            style={[
              styles.toastText,
              toast.isError && { color: Colors.danger },
            ]}
          >
            {toast.msg}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
};

export default PlayerSelectScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },

  stickyHeader: {
    backgroundColor: Colors.bg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    width: 32,
    height: 32,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: Colors.muted2,
    fontSize: FontSize.lg,
    lineHeight: 20,
  },
  screenTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.warnDim,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: `${Colors.warn}40`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  deadlineDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.warn,
  },
  deadlineText: {
    color: Colors.warn,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchIcon: {
    color: Colors.muted,
    fontSize: FontSize.lg,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md - 2,
  },
  clearBtn: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    padding: Spacing.xs,
  },
  sortBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  sortText: {
    color: Colors.muted2,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  colLabel: {
    color: Colors.muted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    minWidth: 44,
    textAlign: 'center',
  },

  loadingText: {
    color: Colors.muted2,
    fontSize: FontSize.md,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorText: {
    color: Colors.muted2,
    fontSize: FontSize.md,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  retryBtn: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  retryText: {
    color: Colors.accent,
    fontWeight: '600',
    fontSize: FontSize.md,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  emptyMuted: { color: Colors.muted, fontSize: FontSize.sm },

  toast: {
    position: 'absolute',
    bottom: 180, // sits above SquadTray
    alignSelf: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastError: {
    borderColor: `${Colors.danger}50`,
    backgroundColor: `${Colors.danger}18`,
  },
  toastText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
});
