import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { useStaffSchedule } from "@/features/leagues/schedule";
import { QueryState } from "@/screens/dashboard/query-state";
import { Card, dashboardStyles as shared } from "@/screens/dashboard/ui";
import {
  MatchCentreTabScroll,
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

export function ResultsScreen() {
  const { league, tournament, wide } = useMatchCentre();
  const scheduleQuery = useStaffSchedule(league.id, tournament?.id ?? "");

  const schedule = scheduleQuery.data?.pages[0];
  const fixtures = scheduleQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const published = Boolean(schedule?.publishedAt);
  const resultFixtures = fixtures.filter(
    ({ status }) => status === "completed" || status === "cancelled",
  );

  return (
    <MatchCentreTabScroll
      refreshing={scheduleQuery.isRefetching}
      onRefresh={() => void scheduleQuery.refetch()}
    >
      {(activeTournament) => (
        <>
          <PageHeader
            title="Results"
            subtitle={`${activeTournament.name} · ${activeTournament.season}`}
            action={
              <ActionButton
                variant="secondary"
                size="compact"
                onPress={() => void scheduleQuery.refetch()}
              >
                Refresh
              </ActionButton>
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
          ) : !resultFixtures.length ? (
            <EmptyCard description={scheduleQuery.hasNextPage
              ? "No completed or cancelled fixtures on the loaded pages."
              : "No completed or cancelled fixtures yet."}
            />
          ) : (
            <View style={styles.list}>
              {resultFixtures.map((fixture) => (
                <Card key={fixture.id} style={styles.fixture}>
                  <View style={styles.fixtureHeader}>
                    <Text style={shared.body}>Match {fixture.matchNumber}</Text>
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
                  {published ? <FixtureAction tournament={activeTournament} fixture={fixture} canEditSchedule={false} /> : null}
                </Card>
              ))}
            </View>
          )}
          {scheduleQuery.hasNextPage ? (
            <ActionButton
              variant="secondary"
              loading={scheduleQuery.isFetchingNextPage}
              onPress={() => void scheduleQuery.fetchNextPage()}
            >
              More fixtures
            </ActionButton>
          ) : null}
        </>
      )}
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
