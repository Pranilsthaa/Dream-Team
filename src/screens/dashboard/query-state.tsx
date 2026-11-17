import { ActionButton } from '@/components/action-button';
import { HashLoader } from '@/components/hash-loader';
import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export function QueryState({ loading, error, empty, retry }: { loading?: boolean; error?: Error | null; empty?: string; retry?: () => void }) {
  return <View style={styles.box}>
    {loading ? <HashLoader size={28} color={theme.colors.accent} /> : null}
    <Text accessibilityLiveRegion="polite" style={styles.text}>{loading ? 'Loading…' : error?.message ?? empty}</Text>
    {error && retry ? <ActionButton variant="secondary" onPress={retry}>Try again</ActionButton> : null}
  </View>;
}
const styles = StyleSheet.create({ box: { paddingVertical: 20, gap: 14 }, text: { fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 20, color: theme.colors.textMuted } });
