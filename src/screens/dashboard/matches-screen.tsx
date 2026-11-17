import { theme } from "@/constants/theme";
import { useMatches } from "@/features/leagues/hooks";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { QueryState } from "./query-state";
import { Card, SectionHeading, dashboardStyles as shared } from "./ui";

const filters = ["All", "Live", "Upcoming", "Completed"] as const;

export function MatchesScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const query = useMatches();
  const matches = (query.data ?? []).filter(
    (match) =>
      filter === "All" ||
      (filter === "Live" && match.status === "live") ||
      (filter === "Upcoming" &&
        ["upcoming", "locked"].includes(match.status)) ||
      (filter === "Completed" && match.status === "completed"),
  );
  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.scroll}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => {
            void query.refetch();
          }}
          tintColor={theme.colors.accent}
        />
      }
    >
      <SectionHeading>Matches</SectionHeading>
      <Text style={[shared.body, styles.intro]}>
        All fixtures. League-specific fixtures are not available yet.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === value }}
            onPress={() => setFilter(value)}
            style={[styles.chip, filter === value && styles.selected]}
          >
            <Text style={[styles.chipLabel, filter === value && styles.ink]}>
              {value}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {!query.data ? (
        <QueryState
          loading={query.isPending && query.fetchStatus !== "paused"}
          error={query.error}
          empty="Waiting for a connection."
          retry={() => {
            void query.refetch();
          }}
        />
      ) : null}
      {query.data && query.error ? (
        <QueryState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : null}
      {query.data && !matches.length ? (
        <QueryState
          empty={
            filter === "All"
              ? "No fixtures have been scheduled yet."
              : `No ${filter.toLowerCase()} matches.`
          }
        />
      ) : null}
      <View style={styles.list}>
        {matches.map((match) => (
          <Card key={match.id}>
            <View style={styles.match}>
              <View style={styles.team}>
                <View
                  style={[styles.teamBadge, { backgroundColor: "#2f6bff" }]}
                >
                  <Text style={styles.teamInitial}>
                    {match.team1.code || match.team1.name.slice(0, 1)}
                  </Text>
                </View>
                <Text style={styles.teamName}>{match.team1.name}</Text>
              </View>
              <View style={styles.middle}>
                <Text style={styles.versus}>v</Text>
                <Text
                  style={[
                    styles.status,
                    match.status === "live" && styles.live,
                  ]}
                >
                  {match.status === "live"
                    ? "LIVE"
                    : match.status === "completed"
                      ? "Full time"
                      : match.status}
                </Text>
              </View>
              <View style={styles.team}>
                <View
                  style={[styles.teamBadge, { backgroundColor: "#d96828" }]}
                >
                  <Text style={styles.teamInitial}>
                    {match.team2.code || match.team2.name.slice(0, 1)}
                  </Text>
                </View>
                <Text style={styles.teamName}>{match.team2.name}</Text>
              </View>
            </View>
            <View style={styles.footer}>
              <Text style={shared.body}>Match {match.matchNumber}</Text>
              <Text style={styles.date}>
                {new Date(match.date).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <Text style={shared.body}>{match.venue}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
const { colors, fonts } = theme;
const styles = StyleSheet.create({
  intro: { marginBottom: 12 },
  filters: { flexDirection: "row", gap: 8, paddingBottom: 16 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.accent,
    borderBottomWidth: 4,
    borderBottomColor: colors.accentShadow,
  },
  chipLabel: { fontFamily: fonts.label, fontSize: 14, color: colors.textMuted },
  ink: { color: colors.ink },
  list: { gap: 12 },
  match: { flexDirection: "row", alignItems: "center", gap: 8 },
  team: { flex: 1, alignItems: "center", gap: 6 },
  teamBadge: {
    width: 48,
    minHeight: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  teamInitial: { fontFamily: fonts.display, fontSize: 19, color: "#fff" },
  teamName: {
    fontFamily: fonts.label,
    fontSize: 13,
    color: colors.text,
    textAlign: "center",
  },
  middle: { alignItems: "center", gap: 6 },
  versus: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  status: {
    fontFamily: fonts.label,
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.deep,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    textTransform: "capitalize",
  },
  live: { color: colors.ink, backgroundColor: colors.accent },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 2,
    borderColor: colors.border,
    marginTop: 12,
    paddingTop: 10,
    marginBottom: 5,
  },
  date: {
    fontFamily: fonts.label,
    fontSize: 12,
    color: colors.accent,
    flexShrink: 1,
    textAlign: "right",
  },
});
