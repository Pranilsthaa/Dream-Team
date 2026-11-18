import { Redirect, router } from "expo-router";
import { CalendarDays, ClipboardList } from "lucide-react-native";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { theme } from "@/constants/theme";
import type { League, Tournament } from "@/features/leagues/api";
import { useSelectedLeague, useTournaments } from "@/features/leagues/hooks";
import { tournamentPath } from "@/features/leagues/match-setup";
import { useStaffSchedule, type Fixture } from "@/features/leagues/schedule";
import { useAuth } from "@/providers/auth-provider";
import { QueryState } from "@/screens/dashboard/query-state";
import {
  Card,
  LeagueChips,
  SectionHeading,
  dashboardStyles as shared,
} from "@/screens/dashboard/ui";

import { LeagueForm } from "@/screens/dashboard/league-form";
import { FixtureSetup, type FixtureEditor } from "./fixture-setup";
import { RosterPanel } from "./roster-panel";
import { SetupForm, type SetupAction } from "./setup-form";

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

  const role =
    league && league.ownerId === session.user?.id
      ? "owner"
      : league?.viewerRole;
  const canManage = role === "owner" || role === "admin";

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
        <Text accessibilityRole="header" style={styles.title}>
          Match Centre
        </Text>
        <ActionButton
          variant="secondary"
          onPress={() => router.replace("/home")}
        >
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
            <LeagueChips
              items={leagues}
              selected={league.id}
              onSelect={select}
            />
            {query.hasNextPage ? (
              <ActionButton
                variant="secondary"
                loading={query.isFetchingNextPage}
                onPress={() => void query.fetchNextPage()}
              >
                More leagues
              </ActionButton>
            ) : null}
            <Text style={shared.body}>
              {role ? `League ${role}` : "League staff"}
            </Text>
            <TournamentSchedule
              key={league.id}
              league={league}
              canManage={canManage}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TournamentSchedule({
  league,
  canManage,
}: {
  league: League;
  canManage: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const query = useTournaments(league.id);
  const [selected, setSelected] = useState<string>();
  const tournaments = query.data?.pages.flatMap((page) => page.data) ?? [];
  const tournament =
    tournaments.find((item) => item.id === selected) ?? tournaments[0];

  return (
    <>
      <SectionHeading
        action={canManage ? "+ Tournament" : tournament ? "Refresh" : undefined}
        onPress={() => (canManage ? setCreating(true) : void query.refetch())}
      >
        Tournament
      </SectionHeading>
      {query.error || !tournament ? (
        <QueryState
          loading={!tournament && query.isFetching}
          error={query.error}
          empty={
            query.isSuccess
              ? "No tournaments in this league yet."
              : "Waiting for a connection."
          }
          retry={() => void query.refetch()}
        />
      ) : null}
      {tournament ? (
        <>
          <LeagueChips
            items={tournaments.map((item) => ({
              id: item.id,
              name: `${item.name} · ${item.season}`,
            }))}
            selected={tournament.id}
            onSelect={setSelected}
          />
          {query.hasNextPage ? (
            <ActionButton
              variant="secondary"
              loading={query.isFetchingNextPage}
              onPress={() => void query.fetchNextPage()}
            >
              More tournaments
            </ActionButton>
          ) : null}
          <FixtureList
            key={tournament.id}
            tournament={tournament}
            canManage={canManage}
          />
        </>
      ) : null}
      {canManage ? (
        <BottomSheet
          open={creating}
          onClose={() => setCreating(false)}
          title="Create tournament"
        >
          {creating ? (
            <LeagueForm
              editor={{ kind: "tournament", leagueId: league.id }}
              onDone={() => setCreating(false)}
            />
          ) : null}
        </BottomSheet>
      ) : null}
    </>
  );
}

function FixtureList({
  tournament,
  canManage,
}: {
  tournament: Tournament;
  canManage: boolean;
}) {
  const query = useStaffSchedule(tournament.leagueId, tournament.id);
  const path = tournamentPath(tournament.leagueId, tournament.id);
  const [editor, setEditor] = useState<SetupAction | FixtureEditor | null>(
    null,
  );
  const canEditSchedule =
    canManage &&
    tournament.status !== "completed" &&
    tournament.status !== "archived";
  const [filter, setFilter] = useState("all");
  const schedule = query.data?.pages[0];
  const fixtures = query.data?.pages.flatMap((page) => page.data) ?? [];
  const published = Boolean(schedule?.publishedAt);
  const showStatusAction = (fixture: Fixture, status: "live" | "cancelled") => {
    const title = status === "live" ? "Mark match live" : "Cancel match";
    setEditor({
      title,
      description: `Update the published status for match ${fixture.matchNumber}.`,
      method: "patch",
      path: `${path}/schedule/fixtures/${fixture.id}/status`,
      body: () => ({ status }),
      submitLabel: title,
    });
  };
  const editorTitle =
    editor &&
    ("title" in editor
      ? editor.title
      : editor.kind === "lineup"
        ? `Lineups · Match ${editor.fixture.matchNumber}`
        : editor.fixture
          ? "Edit fixture"
          : "New fixture");
  const closeAfterSave = () =>
    setEditor((current) => (current === editor ? null : current));
  const visible = fixtures.filter(
    ({ status }) =>
      filter === "all" ||
      status === filter ||
      (filter === "upcoming" && status === "locked"),
  );
  const dateFormat = schedule
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: schedule.timezone,
      })
    : null;

  return (
    <>
      <RosterPanel
        tournament={tournament}
        canManage={canManage}
        onAction={setEditor}
      />
      <SectionHeading action="Refresh" onPress={() => void query.refetch()}>
        Fixtures
      </SectionHeading>
      {canEditSchedule && schedule ? (
        <View style={styles.list}>
          <ActionButton onPress={() => setEditor({ kind: "fixture" })}>
            New fixture
          </ActionButton>
          {!published && fixtures.length ? (
            <ActionButton
              variant="secondary"
              onPress={() =>
                setEditor({
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
          <LeagueChips items={filters} selected={filter} onSelect={setFilter} />
        </>
      ) : null}
      {query.error || !visible.length ? (
        <QueryState
          loading={!schedule && query.isFetching}
          error={query.error}
          empty={
            schedule
              ? filter === "all"
                ? "No fixtures scheduled."
                : "No fixtures in this filter on the loaded pages."
              : "Waiting for a connection."
          }
          retry={() => void query.refetch()}
        />
      ) : null}
      <View style={styles.list}>
        {visible.map((fixture) => (
          <Card key={fixture.id} style={styles.fixture}>
            <View style={styles.fixtureHeader}>
              <Text style={shared.body}>Match {fixture.matchNumber}</Text>
              <Text
                style={[
                  styles.status,
                  fixture.status === "live" && styles.live,
                ]}
              >
                {fixture.status}
              </Text>
            </View>
            <Text style={shared.cardTitle}>
              {fixture.team1.name} v {fixture.team2.name}
            </Text>
            <View style={styles.header}>
              <CalendarDays size={16} color={theme.colors.textMuted} />
              <Text style={shared.body}>
                {dateFormat?.format(new Date(fixture.date))}
              </Text>
            </View>
            <Text style={shared.body}>{fixture.venue}</Text>
            {published &&
            (fixture.status === "upcoming" || fixture.status === "live") ? (
              <SectionHeading
                action="Lineups"
                onPress={() => setEditor({ kind: "lineup", fixture })}
              >
                Match setup
              </SectionHeading>
            ) : null}
            {published &&
            ["live", "completed", "cancelled"].includes(fixture.status) ? (
              <ActionButton
                onPress={() =>
                  router.push({
                    pathname: "/score-match",
                    params: {
                      leagueId: tournament.leagueId,
                      tournamentId: tournament.id,
                      fixtureId: fixture.id,
                      teamA: fixture.team1.id,
                      teamAName: fixture.team1.name,
                      teamB: fixture.team2.id,
                      teamBName: fixture.team2.name,
                    },
                  })
                }
              >
                {fixture.status === "live"
                  ? "Open live scoring"
                  : "Open scorecard"}
              </ActionButton>
            ) : null}
            {canEditSchedule && fixture.status === "upcoming" ? (
              <ActionButton
                variant="secondary"
                onPress={() => setEditor({ kind: "fixture", fixture })}
              >
                Edit fixture
              </ActionButton>
            ) : null}
            {canEditSchedule && !published && fixture.status === "upcoming" ? (
              <ActionButton
                variant="secondary"
                onPress={() =>
                  setEditor({
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
            {canEditSchedule && published && fixture.status === "upcoming" ? (
              <ActionButton onPress={() => showStatusAction(fixture, "live")}>
                Mark live
              </ActionButton>
            ) : null}
            {canEditSchedule &&
            published &&
            (fixture.status === "upcoming" || fixture.status === "live") ? (
              <ActionButton
                variant="secondary"
                onPress={() => showStatusAction(fixture, "cancelled")}
              >
                Cancel match
              </ActionButton>
            ) : null}
          </Card>
        ))}
      </View>
      {query.hasNextPage ? (
        <ActionButton
          variant="secondary"
          loading={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
        >
          More fixtures
        </ActionButton>
      ) : null}
      <BottomSheet
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editorTitle || ""}
        description={
          editor && "description" in editor ? editor.description : undefined
        }
      >
        {editor &&
          ("method" in editor ? (
            <SetupForm
              key={editor.path + editor.title}
              action={editor}
              onSaved={closeAfterSave}
            />
          ) : (
            <FixtureSetup
              key={editor.kind + editor.fixture?.id}
              tournament={tournament}
              editor={editor}
              onSaved={closeAfterSave}
            />
          ))}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", maxWidth: 640, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 40,
    marginBottom: 16,
  },
  label: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.label,
    fontSize: 13,
  },
  list: { gap: 12, marginBottom: 12 },
  fixture: { gap: 6 },
  fixtureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
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
