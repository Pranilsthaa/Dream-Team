import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SectionListData,
} from 'react-native';
import { apiInstance } from '@/api/apiClient';
import { groupMatchesByDate } from '@/utils/matchesUtils';
import MatchCard from '@/components/Matches/MatchCard';
import { MatchesSkeletonLoader } from '@/components/Matches/MatchesSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type TmatchesItem = {
  id: string;
  matchNumber: number;
  date: string;
  status: string;
  team1: { name: string; logo: string; code: string };
  team2: { name: string; logo: string; code: string };
};

type TMatchesResponse = {
  success: boolean;
  message: string;
  data: TmatchesItem[];
};

type Section = { title: string; data: TmatchesItem[] };

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.emptyEmoji}>🏟️</Text>
    <Text style={styles.emptyTitle}>No matches scheduled</Text>
    <Text style={styles.emptySubtitle}>
      Check back later for upcoming fixtures
    </Text>
    <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
      <Text style={styles.retryBtnText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.emptyEmoji}>⚡</Text>
    <Text style={styles.emptyTitle}>Something went wrong</Text>
    <Text style={styles.emptySubtitle}>
      We couldn't load the matches. Please try again.
    </Text>
    <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
      <Text style={styles.retryBtnText}>Try again</Text>
    </TouchableOpacity>
  </View>
);

type FilterKey = 'all' | 'live' | 'upcoming' | 'completed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

const FilterPills = ({
  active,
  onChange,
}: {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
}) => (
  <View style={styles.filterRow}>
    {FILTERS.map(f => (
      <TouchableOpacity
        key={f.key}
        style={[styles.filterPill, active === f.key && styles.filterPillActive]}
        onPress={() => onChange(f.key)}
        activeOpacity={0.75}
      >
        <Text
          style={[
            styles.filterPillText,
            active === f.key && styles.filterPillTextActive,
          ]}
        >
          {f.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const MatchesTab = () => {
  const [matches, setMatches] = useState<TmatchesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchMatches = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(false);
        const res = await apiInstance.get<TMatchesResponse>('/api/matches');
        setMatches(res.data.data ?? []);

        // Fade in content
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } catch (err) {
        console.error('[MatchesTab]', err);
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fadeAnim],
  );

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const filteredMatches =
    activeFilter === 'all'
      ? matches
      : matches.filter(m => m.status.toLowerCase() === activeFilter);

  const sections: Section[] = groupMatchesByDate(filteredMatches);

  const renderItem = useCallback(
    ({ item }: { item: TmatchesItem }) => (
      <MatchCard
        match={item}
        onPress={match => {
          console.log('Pressed match', match.id);
        }}
      />
    ),
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<TmatchesItem, Section> }) => (
      <SectionHeader title={section.title} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: TmatchesItem) => item.id, []);

  // ── States ─────────────────────────────────────────────────────────────────

  if (loading) return <MatchesSkeletonLoader count={4} />;
  if (error) return <ErrorState onRetry={() => fetchMatches()} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <FilterPills active={activeFilter} onChange={setActiveFilter} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={10}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMatches(true)}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
          ListEmptyComponent={<EmptyState onRetry={() => fetchMatches()} />}
          ListFooterComponent={<View style={{ height: 32 }} />}
          // Sticky date headers
          stickySectionHeadersEnabled
        />
      </Animated.View>
    </View>
  );
};

export default MatchesTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Filter pills
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#F8FAFC',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  // Empty / error
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 24,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
