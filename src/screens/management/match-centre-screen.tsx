import { Redirect, router } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { StatusBar } from "expo-status-bar";
import {
  Calendar,
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  Radio,
  Trophy,
  Users,
} from "lucide-react-native";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { theme } from "@/constants/theme";
import type { League, Tournament } from "@/features/leagues/api";
import {
  useSelectedLeague,
  useSelectedTournament,
} from "@/features/leagues/hooks";
import { useStaffSchedule, type Fixture } from "@/features/leagues/schedule";
import { useAuth } from "@/providers/auth-provider";
import { LeagueForm } from "@/screens/dashboard/league-form";
import { QueryState } from "@/screens/dashboard/query-state";
import { dashboardStyles as shared } from "@/screens/dashboard/ui";

import { FixtureSetup, type FixtureEditor } from "./fixture-setup";
import {
  ChecklistRow,
  EmptyCard,
  LivePulseDot,
  PageHeader,
  RoleBadge,
  ToastBanner,
} from "./match-centre-ui";
import { SetupForm, type SetupAction } from "./setup-form";

export type EditorState = SetupAction | FixtureEditor;
type ShellSheet = "context" | "create-tournament" | null;

type TabDefinition = {
  route: string;
  label: string;
  Icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
};

const tabs: TabDefinition[] = [
  { route: "index", label: "Overview", Icon: LayoutGrid },
  { route: "teams", label: "Teams", Icon: Users },
  { route: "schedule", label: "Schedule", Icon: Calendar },
  { route: "match-day", label: "Match day", Icon: Radio },
  { route: "results", label: "Results", Icon: Trophy },
];

const SAVED_TOASTS: Record<string, string> = {
  "Publish schedule": "Schedule published",
  "Mark match live": "Match is live",
  "Cancel match": "Match cancelled",
  "Delete fixture": "Fixture deleted",
  "Create team": "Team added",
  "Edit team": "Team updated",
  "Enroll team": "Team enrolled",
  "Remove tournament team": "Team removed from tournament",
  "Create player": "Player added",
  "Edit player": "Player updated",
  "Register player": "Player assigned",
  "Change tournament assignment": "Player assigned",
  "Remove player registration": "Registration removed",
};

function savedToastFor(editor: EditorState): string {
  if ("title" in editor) return SAVED_TOASTS[editor.title] ?? "Changes saved";
  if (editor.kind === "lineup") return "Lineups confirmed";
  return editor.fixture ? "Fixture updated" : "Fixture created";
}

function getEditorTitle(editor: EditorState | null): string {
  if (!editor) return "";
  if ("title" in editor) return editor.title;
  if (editor.kind === "lineup") {
    return `Lineups · Match ${editor.fixture.matchNumber}`;
  }
  return editor.fixture ? "Edit fixture" : "New fixture";
}

function capitalize(value: string): string {
  return value ? value.slice(0, 1).toUpperCase() + value.slice(1) : value;
}

export function openScoreMatch(tournament: Tournament, fixture: Fixture) {
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
  });
}

export function createStatusAction(
  path: string,
  fixture: Fixture,
  status: "live" | "cancelled",
): SetupAction {
  const title = status === "live" ? "Mark match live" : "Cancel match";
  return {
    title,
    description: `Update the published status for match ${fixture.matchNumber}.`,
    method: "patch",
    path: `${path}/schedule/fixtures/${fixture.id}/status`,
    body: () => ({ status }),
    submitLabel: title,
  };
}

type MatchCentreContextValue = {
  league: League;
  tournament?: Tournament;
  tournamentsLoading: boolean;
  tournamentsError: Error | null;
  refetchTournaments: () => void;
  role?: "owner" | "admin" | "scorer";
  canManage: boolean;
  wide: boolean;
  openEditor: (editor: EditorState) => void;
  openCreateTournament: () => void;
  showToast: (message: string) => void;
};

const MatchCentreContext = createContext<MatchCentreContextValue | null>(null);

export function useMatchCentre(): MatchCentreContextValue {
  const value = useContext(MatchCentreContext);
  if (!value) {
    throw new Error("useMatchCentre must be used inside MatchCentreLayout");
  }
  return value;
}

export function MatchCentreTabScroll({
  refreshing = false,
  onRefresh,
  children,
}: {
  refreshing?: boolean;
  onRefresh?: () => void;
  children: (tournament: Tournament) => ReactNode;
}) {
  const {
    league,
    tournament,
    tournamentsLoading,
    tournamentsError,
    refetchTournaments,
    canManage,
    wide,
    openCreateTournament,
  } = useMatchCentre();

  if (!tournament) {
    return (
      <ScrollView
        style={shared.screen}
        contentContainerStyle={[
          styles.scrollContent,
          wide && styles.scrollContentWide,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={tournamentsLoading}
            onRefresh={refetchTournaments}
            tintColor={theme.colors.accent}
          />
        }
      >
        <View style={styles.container}>
          <PageHeader
            title="Match Centre"
            subtitle={league.name}
            wide={wide}
          />
          {tournamentsError || tournamentsLoading ? (
            <QueryState
              loading={tournamentsLoading}
              error={tournamentsError}
              empty="Waiting for a connection."
              retry={refetchTournaments}
            />
          ) : (
            <EmptyCard
              title="No tournaments yet"
              description={
                canManage
                  ? "Create a tournament in this league to manage teams, schedules, and live scoring."
                  : "Ask a league owner or admin to create a tournament."
              }
            >
              {canManage ? (
                <ActionButton onPress={openCreateTournament}>
                  + Create tournament
                </ActionButton>
              ) : null}
            </EmptyCard>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={[
        styles.scrollContent,
        wide && styles.scrollContentWide,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        ) : undefined
      }
    >
      <View style={styles.container}>{children(tournament)}</View>
    </ScrollView>
  );
}

export function MatchCentreLayout() {
  const { session } = useAuth();
  const { league, leagues, query, select } = useSelectedLeague();

  if (query.isSuccess && !league) return <Redirect href="/home" />;

  if (!league) {
    return (
      <SafeAreaView style={shared.screen}>
        <ScrollView
          style={styles.fallbackPage}
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
          <PageHeader title="Match Centre" />
          <QueryState
            loading={query.isFetching}
            error={query.error}
            empty="Waiting for a connection."
            retry={() => void query.refetch()}
          />
          <ActionButton
            variant="secondary"
            onPress={() => router.replace("/home")}
          >
            Switch to fantasy
          </ActionButton>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <LeagueTabsLayout
      userId={session.user?.id}
      league={league}
      leagues={leagues}
      hasMoreLeagues={Boolean(query.hasNextPage)}
      loadingMoreLeagues={query.isFetchingNextPage}
      onMoreLeagues={() => void query.fetchNextPage()}
      onSelectLeague={select}
    />
  );
}

export const MatchCentreScreen = MatchCentreLayout;

function LeagueTabsLayout({
  userId,
  league,
  leagues,
  hasMoreLeagues,
  loadingMoreLeagues,
  onMoreLeagues,
  onSelectLeague,
}: {
  userId?: string;
  league: League;
  leagues: League[];
  hasMoreLeagues: boolean;
  loadingMoreLeagues: boolean;
  onMoreLeagues: () => void;
  onSelectLeague: (id: string) => void;
}) {
  const { top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 860;

  const {
    query: tournamentsQuery,
    tournaments,
    tournament,
    select: selectTournament,
  } = useSelectedTournament(league.id);

  const scheduleQuery = useStaffSchedule(league.id, tournament?.id ?? "");
  const fixtures = scheduleQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const hasLiveMatch = fixtures.some((fixture) => fixture.status === "live");

  const role = league.ownerId === userId ? "owner" : league.viewerRole;
  const canManage = role === "owner" || role === "admin";

  const [shellSheet, setShellSheet] = useState<ShellSheet>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => {
      toastTimer.current = null;
      setToast(null);
    }, 2400);
  };

  const handleOpenContext = () => {
    setEditor(null);
    setShellSheet("context");
  };

  const handleOpenCreateTournament = () => {
    setEditor(null);
    setShellSheet("create-tournament");
  };

  const handleOpenEditor = (next: EditorState) => {
    setShellSheet(null);
    setEditor(next);
  };

  const handleSelectLeague = (id: string) => {
    onSelectLeague(id);
    selectTournament(null);
    setEditor(null);
    setShellSheet(null);
    router.navigate("/manage-matches");
  };

  const handleSelectTournament = (id: string) => {
    selectTournament(id);
    setEditor(null);
    setShellSheet(null);
  };

  const handleSwitchToFantasy = () => {
    setEditor(null);
    setShellSheet(null);
    router.replace("/home");
  };

  const tournamentLabel = tournament
    ? `${tournament.name} · ${tournament.season}`
    : tournamentsQuery.isFetching
      ? "Loading tournaments…"
      : "No tournaments";

  const contextValue: MatchCentreContextValue = {
    league,
    tournament,
    tournamentsLoading: tournamentsQuery.isFetching,
    tournamentsError: tournamentsQuery.error,
    refetchTournaments: () => void tournamentsQuery.refetch(),
    role,
    canManage,
    wide,
    openEditor: handleOpenEditor,
    openCreateTournament: handleOpenCreateTournament,
    showToast,
  };

  return (
    <MatchCentreContext.Provider value={contextValue}>
      <View style={[styles.outer, { paddingTop: top }]}>
        <StatusBar style="light" hidden={false} />
        <View style={styles.topBar}>
          <View style={styles.topBarInner}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch league or tournament"
              onPress={handleOpenContext}
              style={({ pressed }) => [
                styles.contextButton,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.contextCopy}>
                <Text numberOfLines={1} style={styles.contextLeague}>
                  {league.name}
                </Text>
                <Text numberOfLines={1} style={styles.contextTournament}>
                  {tournamentLabel}
                </Text>
              </View>
              <RoleBadge role={role} />
              <ChevronDown size={20} color={theme.colors.textMuted} />
            </Pressable>
            <ActionButton size="compact" variant="secondary" onPress={handleSwitchToFantasy}>
              Fantasy
            </ActionButton>
          </View>
        </View>

        <Tabs
          screenOptions={{
            headerShown: false,
            animation: "none",
            sceneStyle: { backgroundColor: theme.colors.background },
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.textMuted,
            tabBarActiveBackgroundColor: theme.colors.surface,
            tabBarStyle: {
              backgroundColor: theme.colors.deep,
              borderTopWidth: 2,
              borderTopColor: theme.colors.border,
              paddingHorizontal: 6,
              paddingTop: 6,
            },
            tabBarLabelStyle: {
              fontFamily: theme.fonts.label,
              fontSize: 11,
            },
            tabBarItemStyle: {
              borderRadius: 12,
              paddingTop: 4,
              paddingBottom: 4,
            },
          }}
        >
          {tabs.map(({ route, label, Icon }) => (
            <Tabs.Screen
              key={route}
              name={route}
              options={{
                title: label,
                tabBarIcon: ({ color }) => {
                  const tint =
                    typeof color === "string"
                      ? color
                      : theme.colors.textMuted;
                  if (route === "match-day") {
                    return (
                      <View style={styles.iconWrap}>
                        <Icon size={21} color={tint} />
                        {hasLiveMatch ? (
                          <LivePulseDot style={styles.pulseOverlay} />
                        ) : null}
                      </View>
                    );
                  }
                  return <Icon size={21} color={tint} />;
                },
              }}
            />
          ))}
        </Tabs>

        <BottomSheet
          open={shellSheet !== null}
          onClose={() => setShellSheet(null)}
          title={
            shellSheet === "create-tournament"
              ? "Create tournament"
              : "Switch context"
          }
          description={
            shellSheet === "context"
              ? "Your role changes with the league."
              : undefined
          }
        >
          {shellSheet === "context" ? (
            <View style={styles.sheetStack}>
              <Text style={styles.sheetLabel}>League</Text>
              <View style={styles.rowList}>
                {leagues.map((item) => {
                  const itemRole =
                    item.ownerId === userId ? "owner" : item.viewerRole;
                  return (
                    <ChecklistRow
                      key={item.id}
                      done={item.id === league.id}
                      title={item.name}
                      subtitle={item.location ?? undefined}
                      right={<RoleBadge role={itemRole} />}
                      onPress={() => handleSelectLeague(item.id)}
                    />
                  );
                })}
              </View>
              {hasMoreLeagues ? (
                <ActionButton
                  variant="secondary"
                  size="compact"
                  loading={loadingMoreLeagues}
                  onPress={onMoreLeagues}
                >
                  More leagues
                </ActionButton>
              ) : null}

              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetLabel}>Tournament</Text>
                {canManage ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleOpenCreateTournament}
                    style={styles.sheetHeaderAction}
                  >
                    <Text style={styles.sheetHeaderActionText}>
                      + Tournament
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {tournamentsQuery.error || !tournaments.length ? (
                <QueryState
                  loading={tournamentsQuery.isFetching && !tournaments.length}
                  error={tournamentsQuery.error}
                  empty="No tournaments in this league yet."
                  retry={() => void tournamentsQuery.refetch()}
                />
              ) : (
                <View style={styles.rowList}>
                  {tournaments.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      done={item.id === tournament?.id}
                      title={`${item.name} · ${item.season}`}
                      subtitle={capitalize(item.status)}
                      onPress={() => handleSelectTournament(item.id)}
                    />
                  ))}
                </View>
              )}

              {tournamentsQuery.hasNextPage ? (
                <ActionButton
                  variant="secondary"
                  size="compact"
                  loading={tournamentsQuery.isFetchingNextPage}
                  onPress={() => void tournamentsQuery.fetchNextPage()}
                >
                  More tournaments
                </ActionButton>
              ) : null}

            </View>
          ) : shellSheet === "create-tournament" ? (
            <LeagueForm
              editor={{ kind: "tournament", leagueId: league.id }}
              onDone={() => {
                setShellSheet(null);
                showToast("Tournament created");
              }}
            />
          ) : null}
        </BottomSheet>

        <BottomSheet
          open={editor !== null && shellSheet === null}
          onClose={() => setEditor(null)}
          title={getEditorTitle(editor)}
          description={
            editor && "description" in editor ? editor.description : undefined
          }
        >
          {editor && tournament ? (
            "method" in editor ? (
              <SetupForm
                key={editor.path + editor.title}
                action={editor}
                onSaved={() => {
                  const currentEditor = editor;
                  setEditor((current) =>
                    current === currentEditor ? null : current,
                  );
                  showToast(savedToastFor(currentEditor));
                }}
              />
            ) : (
              <FixtureSetup
                key={editor.kind + editor.fixture?.id}
                tournament={tournament}
                editor={editor}
                onSaved={() => {
                  const currentEditor = editor;
                  setEditor((current) =>
                    current === currentEditor ? null : current,
                  );
                  showToast(savedToastFor(currentEditor));
                }}
              />
            )
          ) : null}
        </BottomSheet>

        <ToastBanner message={toast} bottomOffset={92} />
      </View>
    </MatchCentreContext.Provider>
  );
}

const { colors, fonts } = theme;
const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.background },
  fallbackPage: { width: "100%", maxWidth: 640, alignSelf: "center" },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 40 },
  scrollContentWide: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 60,
  },
  container: { width: "100%", maxWidth: 1040, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: {
    color: colors.accent,
    fontFamily: fonts.label,
    fontSize: 13,
  },
  topBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  topBarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
  },
  contextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.secondaryBorder,
    backgroundColor: colors.secondary,
  },
  contextCopy: { flex: 1, minWidth: 0 },
  contextLeague: {
    fontFamily: fonts.label,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  contextTournament: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.88 },
  iconWrap: { position: "relative" },
  pulseOverlay: { position: "absolute", top: -2, right: -4 },
  sheetStack: { gap: 12 },
  sheetLabel: {
    fontFamily: fonts.label,
    fontSize: 13,
    color: colors.textMuted,
  },
  rowList: { gap: 10 },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sheetHeaderAction: {
    minHeight: 44,
    justifyContent: "center",
    paddingLeft: 12,
  },
  sheetHeaderActionText: {
    fontFamily: fonts.label,
    fontSize: 13,
    color: colors.accent,
  },
});
