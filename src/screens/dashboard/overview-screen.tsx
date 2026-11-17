import { ScrollView, Text, View } from 'react-native';
import { leagues } from './data';
import { DashboardIcon, type IconName } from './icon';
import { Card, dashboardStyles as styles, SectionHeading } from './ui';

export function OverviewScreen({ section }: { section: 'squad' | 'matches' | 'leagues' }) {
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.scroll, { gap: 12 }]}>
    <SectionHeading>{section === 'squad' ? 'My squad' : section === 'matches' ? 'Matches' : 'My leagues'}</SectionHeading>
    {section === 'leagues' ? leagues.map(league => <Card key={league.code}><Text style={styles.cardTitle}>{league.name}</Text><Text style={styles.body}>{league.game} · Rank #{league.rank} of {league.members} · {league.points} pts</Text><Text style={styles.body}>{league.code}</Text></Card>) : <Card>
      <View style={{ gap: 12 }}>
        <DashboardIcon name={section as IconName} size={32} />
        <Text style={styles.cardTitle}>{section === 'squad' ? 'Midnight Wolves' : 'Hawks 2 - 1 Titans'}</Text>
        <Text style={styles.body}>{section === 'squad' ? '7 players selected · Captain S. Khan\n65.0 squad budget' : 'LIVE · Round 5\n3 of your players are playing'}</Text>
      </View>
    </Card>}
  </ScrollView>;
}
