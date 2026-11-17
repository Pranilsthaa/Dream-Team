import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/action-button';
import { theme } from '@/constants/theme';
import { leagues, signed } from './data';
import { DashboardIcon, type IconName } from './icon';
import { ReferenceSheet } from './reference-sheet';
import { Card, dashboardStyles as shared, LeagueChips, Rules, SectionHeading } from './ui';

const actions: { label: string; icon: IconName }[] = [
  { label: 'Create league', icon: 'plus' }, { label: 'Join with code', icon: 'link' }, { label: 'Add players', icon: 'players' },
];

export function HomeScreen() {
  const [selected, setSelected] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const league = leagues[selected];
  const rows = [
    { rank: league.rank - 1, name: 'Gold Rush', points: league.points + 17 },
    { rank: league.rank, name: 'Midnight Wolves', points: league.points, me: true },
    { rank: league.rank + 1, name: 'Iron Owls', points: league.points - 23 },
  ];
  return <View style={shared.screen}>
    <ScrollView contentContainerStyle={shared.scroll}>
      <LeagueChips selected={selected} onSelect={setSelected} />
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.stripes}>{Array.from({ length: 12 }, (_, index) => <View key={index} style={[styles.stripe, index % 2 === 0 && styles.stripeAlt]} />)}</View>
        <Text style={styles.tag}>{league.game} league</Text>
        <Text accessibilityRole="header" style={styles.leagueName}>{league.name}</Text>
        <View style={styles.stats}>
          {[[`#${league.rank}`, `of ${league.members}`], [String(league.points), 'Total pts'], [signed(league.round), 'This round']].map(([value, label]) => <View key={label} style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}
        </View>
        <View style={styles.deadline}><View style={styles.dot} /><Text style={styles.deadlineText}>Squad deadline in <Text style={styles.timer}>02:14:09</Text></Text></View>
        <ActionButton onPress={() => router.navigate('/squad')}>Edit squad</ActionButton>
      </View>
      <SectionHeading action="How points work" onPress={() => setShowRules(true)}>Scoring rules</SectionHeading>
      <Rules game={league.game} />
      <SectionHeading>Quick actions</SectionHeading>
      <View style={styles.actions}>{actions.map(action => <Pressable key={action.label} accessibilityRole="button" onPress={() => router.navigate('/leagues')} style={styles.action}><DashboardIcon name={action.icon} size={26} /><Text style={styles.actionLabel}>{action.label}</Text></Pressable>)}</View>
      <SectionHeading action="All matches" onPress={() => router.navigate('/matches')}>Live now</SectionHeading>
      <Card style={styles.live}><View style={styles.dot} /><View style={styles.liveText}><Text style={shared.cardTitle}>Hawks 2 - 1 Titans</Text><Text style={shared.body}>3 of your players are playing</Text></View><Text style={styles.points}>+24</Text></Card>
      <SectionHeading action="Full table" onPress={() => router.navigate('/leagues')}>Around you</SectionHeading>
      <View style={styles.leaderboard}>{rows.map(row => <View key={row.name} style={[styles.row, row.me && styles.me]}><Text style={[styles.rank, row.me && styles.ink]}>{row.rank}</Text><Text style={[styles.team, row.me && styles.ink]}>{row.name}</Text><Text style={[styles.rowPoints, row.me && styles.ink]}>{row.points}</Text></View>)}</View>
    </ScrollView>
    <ReferenceSheet open={showRules} onClose={() => setShowRules(false)} title="How points work" description="Each league sets its own rules. Points come from the stats recorded in every match, and your captain scores double.">
      <Rules game={league.game} />
      <ActionButton onPress={() => { setShowRules(false); router.navigate('/squad'); }}>See my squad</ActionButton>
    </ReferenceSheet>
  </View>;
}
const { colors, fonts } = theme;
const styles = StyleSheet.create({
  hero: { borderRadius: 20, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.border, overflow: 'hidden', padding: 16, backgroundColor: colors.pitch, gap: 12 },
  stripes: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  stripe: { flex: 1, backgroundColor: colors.pitch },
  stripeAlt: { backgroundColor: colors.pitchAlternate },
  tag: { backgroundColor: '#08180ECC', fontFamily: fonts.label, fontSize: 12, color: colors.text, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' },
  leagueName: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: '#08180EC7', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: fonts.display, fontSize: 32, color: colors.accent },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  deadline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent },
  deadlineText: { fontFamily: fonts.label, fontSize: 14, color: colors.text },
  timer: { fontFamily: fonts.display, fontSize: 19, color: colors.accent },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 8, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2, borderBottomWidth: 5, borderRadius: 14, minHeight: 90 },
  actionLabel: { fontFamily: fonts.label, fontSize: 13, lineHeight: 17, textAlign: 'center', color: colors.text },
  live: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveText: { flex: 1 },
  points: { fontFamily: fonts.display, fontSize: 24, color: colors.accent },
  leaderboard: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 },
  me: { backgroundColor: colors.accent, borderBottomWidth: 4, borderBottomColor: colors.accentShadow },
  rank: { width: 28, fontFamily: fonts.display, fontSize: 22, color: colors.text },
  team: { flex: 1, fontFamily: fonts.label, fontSize: 15, color: colors.text },
  rowPoints: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  ink: { color: colors.ink },
});
