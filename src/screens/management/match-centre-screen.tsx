import { useState } from "react";
import { Redirect, router } from "expo-router";
import { CalendarDays, ClipboardList } from "lucide-react-native";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { theme } from "@/constants/theme";
import type { League } from "@/features/leagues/api";
import { useSelectedLeague, useTournaments } from "@/features/leagues/hooks";
import { useStaffSchedule } from "@/features/leagues/schedule";
import { useAuth } from "@/providers/auth-provider";
import { QueryState } from "@/screens/dashboard/query-state";
import { Card, dashboardStyles as shared, LeagueChips, SectionHeading } from "@/screens/dashboard/ui";

const filters = [
  { id: "all", name: "All" },
  { id: "live", name: "Live" },
  { id: "upcoming", name: "Upcoming" },
  { id: "completed", name: "Completed" },
  { id: "cancelled", name: "Cancelled" },
];

export function MatchCentreScreen() {
  const { session } = useAuth();
  const { league, leagues, query, select } = useSelectedLeague();

  if (query.isSuccess && !league) return <Redirect href="/home" />;

  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={shared.scroll}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={theme.colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <ClipboardList size={22} color={theme.colors.accent} />
          <Text style={styles.label}>MATCH MANAGER</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>Match Centre</Text>
        <ActionButton variant="secondary" onPress={() => router.replace("/home")}>
          Switch to fantasy
        </ActionButton>

        {query.error || !league ? (
          <QueryState
            loading={!league && query.isFetching}
            error={query.error}
            empty="Waiting for a connection."
            retry={() => void query.refetch()}
          />
        ) : null}

        {league ? (
          <>
            <SectionHeading>League</SectionHeading>
            <LeagueChips items={leagues} selected={league.id} onSelect={select} />
            {query.hasNextPage ? (
              <ActionButton variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()}>
                More leagues
              </ActionButton>
            ) : null}
            <Text style={shared.body}>
              {league.ownerId === session.user?.id ? "League owner" : "League staff"}
            </Text>
            <TournamentSchedule key={league.id} league={league} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TournamentSchedule({ league }: { league: League }) {
  const query = useTournaments(league.id);
  const [selected, setSelected] = useState<string>();
  const tournaments = query.data?.pages.flatMap((page) => page.data) ?? [];
  const tournament = tournaments.find((item) => item.id === selected) ?? tournaments[0];

  return (
    <>
      <SectionHeading
        action={tournament ? "Refresh" : undefined}
        onPress={() => void query.refetch()}
      >
        Tournament
      </SectionHeading>
      {query.error || !tournament ? (
        <QueryState
          loading={!tournament && query.isFetching}
          error={query.error}
          empty={query.isSuccess ? "No tournaments in this league yet." : "Waiting for a connection."}
          retry={() => void query.refetch()}
        />
      ) : null}
      {tournament ? (
        <>
          <LeagueChips
            items={tournaments.map((item) => ({ id: item.id, name: `${item.name} · ${item.season}` }))}
            selected={tournament.id}
            onSelect={setSelected}
          />
          {query.hasNextPage ? (
            <ActionButton variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()}>
              More tournaments
            </ActionButton>
          ) : null}
          <FixtureList key={tournament.id} leagueId={league.id} tournamentId={tournament.id} />
        </>
      ) : null}
    </>
  );
}

function FixtureList({ leagueId, tournamentId }: { leagueId: string; tournamentId: string }) {
  const query = useStaffSchedule(leagueId, tournamentId);
  const [filter, setFilter] = useState("all");
  const schedule = query.data?.pages[0];
  const fixtures = query.data?.pages.flatMap((page) => page.data) ?? [];
  const visible = fixtures.filter(({ status }) =>
    filter === "all" || status === filter || (filter === "upcoming" && status === "locked"),
  );
  const dateFormat = schedule ? new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: schedule.timezone,
  }) : null;

  return (
    <>
      <SectionHeading action="Refresh" onPress={() => void query.refetch()}>Fixtures</SectionHeading>
      {schedule ? (
        <>
          <Text style={shared.body}>
            {schedule.publishedAt ? "Published schedule" : "Unpublished schedule"} · {schedule.timezone}
          </Text>
          <LeagueChips items={filters} selected={filter} onSelect={setFilter} />
        </>
      ) : null}
      {query.error || !visible.length ? (
        <QueryState
          loading={!schedule && query.isFetching}
          error={query.error}
          empty={schedule ? (filter === "all" ? "No fixtures scheduled." : "No fixtures in this filter on the loaded pages.") : "Waiting for a connection."}
          retry={() => void query.refetch()}
        />
      ) : null}
      <View style={styles.list}>
        {visible.map((fixture) => (
          <Card key={fixture.id} style={styles.fixture}>
            <View style={styles.fixtureHeader}>
              <Text style={shared.body}>Match {fixture.matchNumber}</Text>
              <Text style={[styles.status, fixture.status === "live" && styles.live]}>{fixture.status}</Text>
            </View>
            <Text style={shared.cardTitle}>{fixture.team1.name} v {fixture.team2.name}</Text>
            <View style={styles.header}>
              <CalendarDays size={16} color={theme.colors.textMuted} />
              <Text style={shared.body}>{dateFormat?.format(new Date(fixture.date))}</Text>
            </View>
            <Text style={shared.body}>{fixture.venue}</Text>
          </Card>
        ))}
      </View>
      {query.hasNextPage ? (
        <ActionButton variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()}>
          More fixtures
        </ActionButton>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", maxWidth: 640, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: theme.colors.text, fontFamily: theme.fonts.display, fontSize: 40, marginBottom: 16 },
  label: { color: theme.colors.accent, fontFamily: theme.fonts.label, fontSize: 13 },
  list: { gap: 12, marginBottom: 12 },
  fixture: { gap: 6 },
  fixtureHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  status: {
    backgroundColor: theme.colors.deep,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.label,
    textTransform: "capitalize",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  live: { backgroundColor: theme.colors.accent, color: theme.colors.ink },
});
