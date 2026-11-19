import { CalendarDays } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { theme } from "@/constants/theme";
import { tournamentPath } from "@/features/leagues/match-setup";
import { useStaffSchedule } from "@/features/leagues/schedule";
import { QueryState } from "@/screens/dashboard/query-state";
import {
  Card,
  LeagueChips,
  dashboardStyles as shared,
} from "@/screens/dashboard/ui";
import {
  MatchCentreTabScroll,
  createStatusAction,
  useMatchCentre,
} from "./match-centre-screen";
import {
  PageHeader,
  StatusPill,
  fixtureStatusTone,
  formatFixtureDateTime,
} from "./match-centre-ui";

import { FixtureAction } from "./fixture-action";

const filters = [
  { id: "all", name: "All" },
  { id: "live", name: "Live" },
  { id: "upcoming", name: "Upcoming" },
  { id: "completed", name: "Completed" },
  { id: "cancelled", name: "Cancelled" },
];

export function ScheduleScreen() {
  const { league, tournament, canManage, wide, openEditor } = useMatchCentre();
  const scheduleQuery = useStaffSchedule(league.id, tournament?.id ?? "");
  const [filter, setFilter] = useState("all");

  const schedule = scheduleQuery.data?.pages[0];
  const fixtures = scheduleQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const published = Boolean(schedule?.publishedAt);
  const visible = fixtures.filter(
    ({ status }) =>
      filter === "all" ||
      status === filter ||
      (filter === "upcoming" && status === "locked"),
  );

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
              title="Schedule"
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
            {canEditSchedule && schedule ? (
              <View style={styles.list}>
                <ActionButton onPress={() => openEditor({ kind: "fixture" })}>
                  New fixture
                </ActionButton>
                {!published && fixtures.length ? (
                  <ActionButton
                    variant="secondary"
                    onPress={() =>
                      openEditor({
                        title: "Publish schedule",
                        description:
                          "Make this tournament’s fixture schedule publicly available.",
                        method: "put",
                        path: `${path}/schedule/publish`,
                        submitLabel: "Publish schedule",
                      })
                    }
                  >
                    Publish schedule
                  </ActionButton>
                ) : null}
              </View>
            ) : null}
            {schedule ? (
              <>
                <Text style={shared.body}>
                  {schedule.publishedAt
                    ? "Published schedule"
                    : "Unpublished schedule"}{" "}
                  · {schedule.timezone}
                </Text>
                <LeagueChips
                  items={filters}
                  selected={filter}
                  onSelect={setFilter}
                />
              </>
            ) : null}
            {scheduleQuery.error || !visible.length ? (
              <QueryState
                loading={!schedule && scheduleQuery.isFetching}
                error={scheduleQuery.error}
                empty={
                  schedule
                    ? filter === "all"
                      ? "No fixtures scheduled."
                      : "No fixtures in this filter on the loaded pages."
                    : "Waiting for a connection."
                }
                retry={() => void scheduleQuery.refetch()}
              />
            ) : null}
            <View style={styles.list}>
              {visible.map((fixture) => (
                <Card key={fixture.id} style={styles.fixture}>
                  <View style={styles.fixtureHeader}>
                    <Text style={shared.body}>Match {fixture.matchNumber}</Text>
                    <StatusPill
                      label={fixture.status}
                      tone={fixtureStatusTone(fixture.status)}
                    />
                  </View>
                  <Text style={shared.cardTitle}>
                    {fixture.team1.name} v {fixture.team2.name}
                  </Text>
                  <View style={styles.row}>
                    <CalendarDays size={16} color={theme.colors.textMuted} />
                    <Text style={shared.body}>
                      {formatFixtureDateTime(fixture.date, schedule?.timezone)}
                    </Text>
                  </View>
                  <Text style={shared.body}>{fixture.venue}</Text>
                  {published ? <FixtureAction tournament={activeTournament} fixture={fixture} canEditSchedule={canEditSchedule} /> : null}
                  {canEditSchedule && fixture.status === "upcoming" && fixture.hasScorecard !== true ? (
                    <ActionButton
                      variant="secondary"
                      onPress={() => openEditor({ kind: "fixture", fixture })}
                    >
                      Edit fixture
                    </ActionButton>
                  ) : null}
                  {canEditSchedule &&
                  !published &&
                  fixture.status === "upcoming" ? (
                    <ActionButton
                      variant="secondary"
                      onPress={() =>
                        openEditor({
                          title: "Delete fixture",
                          description: `Delete match ${fixture.matchNumber} from the unpublished schedule.`,
                          method: "delete",
                          path: `${path}/schedule/fixtures/${fixture.id}`,
                          submitLabel: "Delete fixture",
                        })
                      }
                    >
                      Delete fixture
                    </ActionButton>
                  ) : null}
                  {canEditSchedule &&
                  published &&
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
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
