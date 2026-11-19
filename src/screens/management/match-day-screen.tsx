import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { tournamentPath } from "@/features/leagues/match-setup";
import { useStaffSchedule } from "@/features/leagues/schedule";
import { QueryState } from "@/screens/dashboard/query-state";
import {
  Card,
  dashboardStyles as shared,
} from "@/screens/dashboard/ui";
import {
  MatchCentreTabScroll,
  createStatusAction,
  useMatchCentre,
} from "./match-centre-screen";
import {
  EmptyCard,
  MatchTitle,
  PageHeader,
  StatusPill,
  fixtureStatusTone,
  formatFixtureDateTime,
} from "./match-centre-ui";

import { FixtureAction } from "./fixture-action";

export function MatchDayScreen() {
  const { league, tournament, canManage, wide, openEditor } = useMatchCentre();
  const scheduleQuery = useStaffSchedule(league.id, tournament?.id ?? "");

  const schedule = scheduleQuery.data?.pages[0];
  const fixtures = scheduleQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const published = Boolean(schedule?.publishedAt);
  const matchDayFixtures = fixtures
    .filter(
      ({ status }) =>
        status === "live" || status === "upcoming" || status === "locked",
    )
    .sort((a, b) => Number(b.status === "live") - Number(a.status === "live"));

  return (
    <MatchCentreTabScroll
      refreshing={scheduleQuery.isRefetching}
      onRefresh={() => void scheduleQuery.refetch()}
    >
      {(activeTournament) => {
        const path = tournamentPath(
          activeTournament.leagueId,
          activeTournament.id,
        );
        const canEditSchedule =
          canManage &&
          activeTournament.status !== "completed" &&
          activeTournament.status !== "archived";

        return (
          <>
            <PageHeader
              title="Match day"
              subtitle="Lineups, going live and scoring"
              action={
                published ? (
                  <ActionButton
                    variant="secondary"
                    size="compact"
                    onPress={() => void scheduleQuery.refetch()}
                  >
                    Refresh
                  </ActionButton>
                ) : undefined
              }
              wide={wide}
            />
            {scheduleQuery.error || !schedule ? (
              <QueryState
                loading={!schedule && scheduleQuery.isFetching}
                error={scheduleQuery.error}
                empty="Waiting for a connection."
                retry={() => void scheduleQuery.refetch()}
              />
            ) : !published ? (
              <EmptyCard
                title="Match day is locked"
                description="The schedule must be published before lineups and scoring open."
              >
                <ActionButton
                  onPress={() => router.navigate("/manage-matches/schedule")}
                >
                  Go to schedule
                </ActionButton>
              </EmptyCard>
            ) : !matchDayFixtures.length ? (
              <EmptyCard description={scheduleQuery.hasNextPage
                ? "No live or upcoming matches on the loaded pages."
                : "No live or upcoming matches."}
              />
            ) : (
              <View style={styles.list}>
                {matchDayFixtures.map((fixture) => (
                  <Card key={fixture.id} style={styles.fixture}>
                    <View style={styles.fixtureHeader}>
                      <Text style={shared.body}>
                        Match {fixture.matchNumber}
                      </Text>
                      <StatusPill
                        label={fixture.status}
                        tone={fixtureStatusTone(fixture.status)}
                      />
                    </View>
                    <MatchTitle
                      team1={fixture.team1}
                      team2={fixture.team2}
                      compact
                    />
                    <Text style={shared.body}>
                      {formatFixtureDateTime(fixture.date, schedule.timezone)} ·{" "}
                      {fixture.venue}
                    </Text>
                    <FixtureAction tournament={activeTournament} fixture={fixture} canEditSchedule={canEditSchedule} />
                    {canEditSchedule &&
                    (fixture.status === "upcoming" ||
                      fixture.status === "live") ? (
                      <ActionButton
                        variant="secondary"
                        onPress={() =>
                          openEditor(
                            createStatusAction(path, fixture, "cancelled"),
                          )
                        }
                      >
                        Cancel match
                      </ActionButton>
                    ) : null}
                  </Card>
                ))}
              </View>
            )}
            {published && scheduleQuery.hasNextPage ? (
              <ActionButton
                variant="secondary"
                loading={scheduleQuery.isFetchingNextPage}
                onPress={() => void scheduleQuery.fetchNextPage()}
              >
                More fixtures
              </ActionButton>
            ) : null}
          </>
        );
      }}
    </MatchCentreTabScroll>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, marginBottom: 12 },
  fixture: { gap: 8 },
  fixtureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
