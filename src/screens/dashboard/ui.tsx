import { theme } from "@/constants/theme";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import { scoring, signed } from "./data";

export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}
export function SectionHeading({
  children,
  action,
  onPress,
}: {
  children: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        {children}
      </Text>
      {action ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={styles.headingAction}
        >
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
export function LeagueChips({
  selected,
  onSelect,
  items,
}: {
  selected?: string;
  onSelect: (id: string) => void;
  items: { id: string; name: string }[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {items.map((league) => (
        <Pressable
          key={league.id}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === league.id }}
          onPress={() => onSelect(league.id)}
          style={[styles.chip, selected === league.id && styles.selectedChip]}
        >
          <Text
            style={[
              styles.chipText,
              selected === league.id && styles.selectedText,
            ]}
          >
            {league.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export function Rules({ game }: { game: keyof typeof scoring }) {
  return (
    <View style={styles.rules}>
      {scoring[game].map(([label, points]) => (
        <View key={label} style={styles.rule}>
          <Text style={styles.ruleText}>
            {label}{" "}
            <Text
              style={{
                color: points < 0 ? theme.colors.warning : theme.colors.accent,
              }}
            >
              {signed(points)}
            </Text>
          </Text>
        </View>
      ))}
    </View>
  );
}
export const dashboardStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 6 },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  cardTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.text,
  },
});
const { colors, fonts } = theme;
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderRadius: 16,
    padding: 14,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 5,
    gap: 8,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
    flexShrink: 1,
  },
  headingAction: { minHeight: 44, justifyContent: "center" },
  action: { fontFamily: fonts.label, fontSize: 13, color: colors.accent },
  chips: { gap: 8, paddingBottom: 12, paddingTop: 4 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 4,
    justifyContent: "center",
    minHeight: 44,
  },
  selectedChip: {
    backgroundColor: colors.accent,
    borderBottomColor: colors.accentShadow,
  },
  chipText: { fontFamily: fonts.label, fontSize: 14, color: colors.textMuted },
  selectedText: { color: colors.ink },
  rules: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rule: {
    backgroundColor: colors.deep,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  ruleText: { fontFamily: fonts.label, fontSize: 13, color: colors.text },
});
