import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { theme } from "@/constants/theme";
import {
  tournamentPath,
  useSetupList,
  type Registration,
  type Team,
} from "@/features/leagues/match-setup";
import { useStaffSchedule } from "@/features/leagues/schedule";
import { QueryState } from "@/screens/dashboard/query-state";
import { Card, dashboardStyles as shared } from "@/screens/dashboard/ui";
import { MatchCentreTabScroll, useMatchCentre } from "./match-centre-screen";
import {
  MatchTitle,
  NoticeBanner,
  PageHeader,
  StatTile,
  StatusPill,
  fixtureStatusTone,
  formatFixtureDateTime,
} from "./match-centre-ui";

export function OverviewScreen() {
  const { league, tournament, canManage, wide } = useMatchCentre();
  const path = tournament ? tournamentPath(league.id, tournament.id) : "";
  const scheduleQuery = useStaffSchedule(league.id, tournament?.id ?? "");
  const enrolledQuery = useSetupList<Team>(
    `${path}/teams`,
    Boolean(tournament),
  );
  const rosterQuery = useSetupList<Registration>(
    `${path}/players`,
    Boolean(tournament),
  );

  const schedule = scheduleQuery.data?.pages[0];
  const fixtures = scheduleQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const enrolledTeams =
    enrolledQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const roster = rosterQuery.data?.pages.flatMap((page) => page.data) ?? [];

  const published = Boolean(schedule?.publishedAt);
  const activePlayers = roster.filter((player) => player.isActive);
  const activeFixtures = fixtures.filter(
    (fixture) =>
      fixture.status === "live" ||
      fixture.status === "upcoming" ||
      fixture.status === "locked",
  );
  const nextFixture =
    activeFixtures.find((fixture) => fixture.status === "live") ??
    activeFixtures[0];
  const liveCount = fixtures.filter(
    (fixture) => fixture.status === "live",
  ).length;

  const overviewError = scheduleQuery.error ?? enrolledQuery.error ?? rosterQuery.error;
  const count = (query: { data: unknown; error: Error | null; hasNextPage: boolean }, total: number) => {
    if (!query.data || query.error) return "—";
    return query.hasNextPage ? `${total}+` : total;
  };
  const tiles = [
    { key: "teams", value: count(enrolledQuery, enrolledTeams.length), label: "Teams" },
    { key: "players", value: count(rosterQuery, activePlayers.length), label: "Players" },
    { key: "fixtures", value: count(scheduleQuery, fixtures.length), label: "Fixtures" },
    { key: "live", value: count(scheduleQuery, liveCount), label: "Live" },
  ];
  const hasPartialCounts = tiles.some((tile) => typeof tile.value === "string" && tile.value.endsWith("+"));

  const refreshing =
    scheduleQuery.isRefetching ||
    enrolledQuery.isRefetching ||
    rosterQuery.isRefetching;

  const refreshAll = () => {
    void scheduleQuery.refetch();
    void enrolledQuery.refetch();
    void rosterQuery.refetch();
  };

  return (
    <MatchCentreTabScroll refreshing={refreshing} onRefresh={refreshAll}>
      {(activeTournament) => {
        const timezone = schedule?.timezone ?? activeTournament.timezone;
        return (
          <>
            <PageHeader
              title="Overview"
              subtitle={`${activeTournament.name} · ${activeTournament.season} · ${league.name}`}
              wide={wide}
            />

            {!canManage ? (
              <NoticeBanner title="You are league staff.">
                You can set lineups and score matches. Owners and admins manage
                teams and the schedule.
              </NoticeBanner>
            ) : null}

            {overviewError ? <QueryState error={overviewError} retry={refreshAll} /> : null}
            <View style={[styles.grid, wide && styles.gridWide]}>
              <View style={[styles.tilesWrap, wide && styles.column]}>
                {(wide ? [tiles] : [tiles.slice(0, 2), tiles.slice(2)]).map((row) => (
                  <View key={row[0].key} style={styles.tileRow}>
                    {row.map((tile) => (
                      <StatTile key={tile.key} value={tile.value} label={tile.label} style={styles.tileFlex} />
                    ))}
                  </View>
                ))}
                {hasPartialCounts ? (
                  <Text style={styles.partialNote}>
                    Counts with + cover the loaded pages.
                  </Text>
                ) : null}
              </View>

              <Card style={[styles.card, wide && styles.column]}>
                <Text style={styles.cardHeading}>{scheduleQuery.hasNextPage ? "From loaded fixtures" : "Next up"}</Text>
                {!schedule || scheduleQuery.error ? (
                  <Text style={shared.body}>{scheduleQuery.isFetching ? "Loading schedule…" : "Schedule unavailable."}</Text>
                ) : nextFixture && published ? (
                  <View style={styles.nextBody}>
                    <MatchTitle
                      team1={nextFixture.team1}
                      team2={nextFixture.team2}
                    />
                    <View style={styles.metaRow}>
                      <Text style={shared.body}>
                        {formatFixtureDateTime(nextFixture.date, timezone)} ·{" "}
                        {nextFixture.venue}
                      </Text>
                      <StatusPill
                        label={nextFixture.status}
                        tone={fixtureStatusTone(nextFixture.status)}
                      />
                    </View>
                    <ActionButton
                      onPress={() =>
                        router.navigate("/manage-matches/match-day")
                      }
                    >
                      Go to match day
                    </ActionButton>
                  </View>
                ) : (
                  <View style={styles.nextBody}>
                    <Text style={shared.body}>
                      {published
                        ? scheduleQuery.hasNextPage
                          ? "No live or upcoming matches on the loaded pages."
                          : "No live or upcoming matches."
                        : "Publish the schedule to unlock match day."}
                    </Text>
                    <ActionButton
                      variant="secondary"
                      onPress={() =>
                        router.navigate("/manage-matches/schedule")
                      }
                    >
                      Open schedule
                    </ActionButton>
                  </View>
                )}
                {published && scheduleQuery.hasNextPage && !scheduleQuery.error ? (
                  <ActionButton
                    variant="secondary"
                    loading={scheduleQuery.isFetchingNextPage}
                    onPress={() => void scheduleQuery.fetchNextPage()}
                  >
                    More fixtures
                  </ActionButton>
                ) : null}
              </Card>
            </View>
          </>
        );
      }}
    </MatchCentreTabScroll>
  );
}

const { colors, fonts } = theme;
const styles = StyleSheet.create({
  grid: { gap: 14 },
  gridWide: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  column: { flex: 1, minWidth: 0 },
  card: { gap: 4 },
  cardHeading: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 25,
    color: colors.text,
  },
  tilesWrap: { gap: 12 },
  tileRow: { flexDirection: "row", gap: 12 },
  tileFlex: { flex: 1 },
  partialNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  nextBody: { gap: 14, marginTop: 8 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
});
