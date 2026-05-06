import React, { memo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { getStatusConfig, formatMatchDate } from '@/utils/matchesUtils';

type TmatchesItem = {
  id: string;
  matchNumber: number;
  date: string;
  status: string;
  team1: { name: string; logo: string; code: string };
  team2: { name: string; logo: string; code: string };
};

type Props = {
  match: TmatchesItem;
  onPress?: (match: TmatchesItem) => void;
};

const TeamDisplay = memo(({ team }: { team: TmatchesItem['team1'] }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <View style={styles.teamContainer}>
      <View style={styles.logoWrapper}>
        {!imgError && team.logo ? (
          <Image
            source={{ uri: team.logo }}
            style={styles.teamLogo}
            onError={() => setImgError(true)}
            resizeMode="contain"
          />
        ) : (
          // Fallback: show team code initials
          <View style={styles.logoFallback}>
            <Text style={styles.logoFallbackText}>
              {team.code?.slice(0, 3) ?? '?'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.teamCode} numberOfLines={1}>
        {team.code}
      </Text>
      <Text style={styles.teamName} numberOfLines={2}>
        {team.name}
      </Text>
    </View>
  );
});

const StatusBadge = memo(({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      {config.dot && (
        <View style={[styles.liveDot, { backgroundColor: config.color }]} />
      )}
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
});

const MatchCard = memo(({ match, onPress }: Props) => {
  const scale = new Animated.Value(1);
  const { day, time } = formatMatchDate(match.date);

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress?.(match)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Header: match number + date/time */}
        <View style={styles.cardHeader}>
          <Text style={styles.matchNumber}>Match #{match.matchNumber}</Text>
          <View style={styles.dateChip}>
            <Text style={styles.dateText}>{day}</Text>
            <View style={styles.dateDot} />
            <Text style={styles.dateText}>{time}</Text>
          </View>
        </View>

        {/* Teams row */}
        <View style={styles.teamsRow}>
          <TeamDisplay team={match.team1} />

          {/* VS divider */}
          <View style={styles.vsContainer}>
            <View style={styles.vsDividerLeft} />
            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.vsDividerRight} />
          </View>

          <TeamDisplay team={match.team2} />
        </View>

        {/* Footer: status badge */}
        <View style={styles.cardFooter}>
          <StatusBadge status={match.status} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default MatchCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  matchNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  dateDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teamLogo: {
    width: 44,
    height: 44,
  },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  teamCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  teamName: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 15,
    maxWidth: 100,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    flexDirection: 'row',
  },
  vsDividerLeft: {
    width: 16,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  vsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  vsDividerRight: {
    width: 16,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  cardFooter: {
    alignItems: 'center',
    paddingBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
