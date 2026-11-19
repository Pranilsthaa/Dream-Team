import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { ActionButton } from "@/components/action-button";
import type { Tournament } from "@/features/leagues/api";
import {
  cricketRoles,
  tournamentPath,
  useSetupList,
  type Player,
  type Registration,
  type Team,
} from "@/features/leagues/match-setup";
import { QueryState } from "@/screens/dashboard/query-state";
import {
  Card,
  SectionHeading,
  dashboardStyles as shared,
} from "@/screens/dashboard/ui";
import { EmptyCard, TeamBadge } from "./match-centre-ui";
import { integerBetween, type SetupAction } from "./setup-form";

type Props = {
  tournament: Tournament;
  canManage: boolean;
  onAction: (action: SetupAction) => void;
};

export type RosterView = "roster" | "teams" | "players";

export function RosterPanel({ view, onNavigate, ...props }: Props & {
  view: RosterView;
  onNavigate: () => void;
}) {
  if (view === "teams" && props.canManage) return <LeagueTeams {...props} />;
  if (view === "players" && props.canManage) return <LeaguePlayers {...props} />;
  return <TournamentRoster {...props} onNavigate={onNavigate} />;
}

function LeagueTeams({ tournament, canManage, onAction }: Props) {
  const base = `/leagues/${tournament.leagueId}`;
  const path = tournamentPath(tournament.leagueId, tournament.id);
  const draft = canManage && tournament.status === "draft";
  const query = useSetupList<Team>(`${base}/teams`);
  const enrolledQuery = useSetupList<Team>(`${path}/teams`, draft);
  const teams = query.data?.pages.flatMap((page) => page.data) ?? [];
  const enrolled = new Set(enrolledQuery.data?.pages.flatMap((page) => page.data.map(({ id }) => id)));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const editTeam = (item?: Team) =>
    onAction({
      description: item?.name,
      title: item ? "Edit team" : "Create team",
      method: item ? "patch" : "post",
      path: item ? `${base}/teams/${item.id}` : `${base}/teams`,
      fields: [
        {
          key: "name",
          label: "Team name",
          initial: item?.name,
          maxLength: 100,
        },
        {
          key: "code",
          label: "Team code",
          initial: item?.code,
          maxLength: 5,
          validate: (value) =>
            /^[a-z0-9]{1,5}$/i.test(value) ||
            "Use one to five letters or numbers.",
        },
      ],
      body: (values) => ({
        name: String(values.name).trim(),
        code: String(values.code).trim().toUpperCase(),
      }),
    });

  return (
    <View style={styles.list}>
      <SectionHeading action="+ Add team" onPress={() => editTeam()}>League teams</SectionHeading>
      {teams.map((team) => {
        const expanded = expandedId === team.id;
        const isEnrolled = enrolled.has(team.id);
        return (
          <Card key={team.id} style={styles.item}>
            <DirectoryRow
              name={team.name}
              detail={isEnrolled ? `${team.code} · Enrolled` : team.code}
              badge={<TeamBadge label={team.name} seed={team.id} />}
              expanded={expanded}
              onPress={() => setExpandedId(expanded ? null : team.id)}
            />
            {expanded ? (
              <View style={styles.actions}>
                {draft && !isEnrolled ? (
                  <ActionButton size="compact" onPress={() => onAction({
                    title: "Enroll team",
                    description: `Add ${team.name} to ${tournament.name}.`,
                    method: "put",
                    path: `${path}/teams/${team.id}`,
                    submitLabel: "Enroll team",
                  })}>Enroll team</ActionButton>
                ) : null}
                <ActionButton size="compact" variant="secondary" onPress={() => editTeam(team)}>Edit team</ActionButton>
              </View>
            ) : null}
          </Card>
        );
      })}
      <PageState query={query} empty="No league teams yet." more="More teams" />
    </View>
  );
}

function LeaguePlayers({ tournament, canManage, onAction }: Props) {
  const base = `/leagues/${tournament.leagueId}`;
  const path = tournamentPath(tournament.leagueId, tournament.id);
  const draft = canManage && tournament.status === "draft";
  const query = useSetupList<Player>(`${base}/players`);
  const enrolledQuery = useSetupList<Team>(`${path}/teams`, draft);
  const players = query.data?.pages.flatMap((page) => page.data) ?? [];
  const enrolled = enrolledQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const editPlayer = (item?: Player) =>
    onAction({
      description: item?.name,
      title: item ? "Edit player" : "Create player",
      method: item ? "patch" : "post",
      path: item ? `${base}/players/${item.id}` : `${base}/players`,
      fields: [
        {
          key: "name",
          label: "Player name",
          initial: item?.name,
          maxLength: 50,
        },
        {
          key: "role",
          label: "Playing role",
          choices: cricketRoles,
          initial: item?.role,
        },
        {
          key: "age",
          label: "Age (optional)",
          initial: item?.age == null ? "" : String(item.age),
          optional: true,
          number: true,
          validate: integerBetween(1, 99),
        },
      ],
      body: (values) => ({
        name: String(values.name).trim(),
        role: values.role,
        age: String(values.age).trim() ? Number(values.age) : null,
      }),
    });

  return (
    <View style={styles.list}>
      <SectionHeading action="+ Add player" onPress={() => editPlayer()}>League players</SectionHeading>
      {draft && enrolledQuery.error ? (
        <QueryState error={enrolledQuery.error} retry={() => void enrolledQuery.refetch()} />
      ) : null}
      {players.map((player) => {
        const expanded = expandedId === player.id;
        return (
          <Card key={player.id} style={styles.item}>
            <DirectoryRow
              name={player.name}
              detail={`${roleLabel(player.role)}${player.age ? ` · Age ${player.age}` : ""}`}
              expanded={expanded}
              onPress={() => setExpandedId(expanded ? null : player.id)}
            />
            {expanded ? (
              <View style={styles.actions}>
                {draft && enrolled.length ? (
                  <ActionButton size="compact" onPress={() => onAction(assignment(path, player, enrolled))}>
                    Set tournament team
                  </ActionButton>
                ) : null}
                <ActionButton size="compact" variant="secondary" onPress={() => editPlayer(player)}>Edit player</ActionButton>
              </View>
            ) : null}
          </Card>
        );
      })}
      <PageState query={query} empty="No league players yet." more="More players" />
      {draft && enrolledQuery.hasNextPage ? (
        <ActionButton variant="secondary" loading={enrolledQuery.isFetchingNextPage} onPress={() => void enrolledQuery.fetchNextPage()}>
          Load more team choices
        </ActionButton>
      ) : null}
    </View>
  );
}

function assignment(path: string, player: Player, teams: Team[], current?: Registration): SetupAction {
  return {
    title: current ? "Change tournament assignment" : "Set tournament team",
    description: current ? player.name : `Choose a team for ${player.name}. This replaces any existing assignment in this tournament.`,
    method: "put",
    path: `${path}/players/${current?.playerId ?? player.id}`,
    fields: [{ key: "teamId", label: "Enrolled team", choices: teams, initial: current?.teamId }],
    body: ({ teamId }) => ({ teamId }),
  };
}

function TournamentRoster({ tournament, canManage, onAction, onNavigate }: Props & { onNavigate: () => void }) {
  const path = tournamentPath(tournament.leagueId, tournament.id);
  const teamsQuery = useSetupList<Team>(`${path}/teams`);
  const teams = teamsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const [teamId, selectTeam] = useState<string | null>(null);
  const openTeam = (id: string | null) => {
    selectTeam(id);
    onNavigate();
  };
  const current = teams.find((team) => team.id === teamId);
  const editable = canManage && tournament.status === "draft";

  if (current) {
    return (
      <TeamRoster
        key={current.id}
        path={path}
        tournamentName={tournament.name}
        team={current}
        teams={teams}
        editable={editable}
        onAction={onAction}
        onBack={() => openTeam(null)}
        hasMoreTeams={teamsQuery.hasNextPage}
        loadingTeams={teamsQuery.isFetchingNextPage}
        onMoreTeams={() => void teamsQuery.fetchNextPage()}
      />
    );
  }

  return (
    <View style={styles.list}>
      <SectionHeading>Tournament teams</SectionHeading>
      {teams.map((team) => (
        <Card key={team.id} style={styles.item}>
          <DirectoryRow name={team.name} detail={team.code} badge={<TeamBadge label={team.name} seed={team.id} />} onPress={() => openTeam(team.id)} />
        </Card>
      ))}
      <PageState
        query={teamsQuery}
        empty={editable ? "No teams enrolled. Enroll a team from League teams." : "No teams enrolled."}
        more="More enrolled teams"
      />
    </View>
  );
}

function TeamRoster({ path, tournamentName, team, teams, editable, onAction, onBack, hasMoreTeams, loadingTeams, onMoreTeams }: {
  path: string;
  tournamentName: string;
  team: Team;
  teams: Team[];
  editable: boolean;
  onAction: (action: SetupAction) => void;
  onBack: () => void;
  hasMoreTeams: boolean;
  loadingTeams: boolean;
  onMoreTeams: () => void;
}) {
  const query = useSetupList<Registration>(`${path}/players`);
  const roster = query.data?.pages.flatMap((page) => page.data).filter((player) => player.teamId === team.id) ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <View style={styles.list}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <ArrowLeft size={18} color={theme.colors.accent} />
        <Text style={styles.backText}>Tournament teams</Text>
      </Pressable>
      <Card style={styles.teamHeader}>
        <TeamBadge label={team.name} seed={team.id} />
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={shared.cardTitle}>{team.name}</Text>
          <Text style={shared.body}>{team.code} · {tournamentName}</Text>
        </View>
      </Card>
      <SectionHeading>Registered players</SectionHeading>
      {query.data && !roster.length && !query.error ? (
        <EmptyCard description={query.hasNextPage ? "No players for this team on the loaded pages." : editable ? "No players registered. Assign a player from Players." : "No players registered for this team."} />
      ) : null}
      {roster.map((player) => {
        const expanded = player.id === expandedId;
        return (
          <Card key={player.id} style={styles.item}>
            <DirectoryRow
              name={player.name}
              detail={`${roleLabel(player.role)}${player.isActive ? "" : " · Inactive"}`}
              expanded={editable ? expanded : undefined}
              onPress={editable ? () => setExpandedId(expanded ? null : player.id) : undefined}
            />
            {editable && expanded ? (
              <View style={styles.actions}>
                {teams.length > 1 ? (
                  <ActionButton size="compact" variant="secondary" onPress={() => onAction(assignment(path, player, teams, player))}>
                    Change team
                  </ActionButton>
                ) : null}
                <ActionButton size="compact" variant="danger" onPress={() => onAction({
                  title: "Remove player registration",
                  description: `Remove ${player.name} from this tournament. The league player profile will still be available.`,
                  method: "delete",
                  path: `${path}/players/${player.playerId}`,
                  submitLabel: "Remove registration",
                })}>Remove registration</ActionButton>
              </View>
            ) : null}
          </Card>
        );
      })}
      <PageState query={query} more="More registrations" />
      {editable && hasMoreTeams ? (
        <ActionButton variant="secondary" loading={loadingTeams} onPress={onMoreTeams}>Load more team choices</ActionButton>
      ) : null}
      {editable ? (
        <ActionButton variant="danger" size="compact" onPress={() => onAction({
          title: "Remove tournament team",
          description: `Remove ${team.name} from ${tournamentName}. Teams with match or player records cannot be removed.`,
          method: "delete",
          path: `${path}/teams/${team.id}`,
          submitLabel: "Remove team",
        })}>Remove team from tournament</ActionButton>
      ) : null}
    </View>
  );
}

function roleLabel(role: string) {
  return cricketRoles.find((item) => item.id === role)?.name ?? role;
}

function DirectoryRow({ name, detail, badge, expanded, onPress }: {
  name: string;
  detail: string;
  badge?: ReactNode;
  expanded?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      {badge}
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={shared.body}>{detail}</Text>
      </View>
      {onPress ? expanded === undefined
        ? <ChevronRight size={18} color={theme.colors.textMuted} />
        : <ChevronDown size={18} color={theme.colors.textMuted} style={expanded ? styles.flipped : undefined} />
        : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  item: { padding: 0 },
  row: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  name: { color: theme.colors.text, fontFamily: theme.fonts.label, fontSize: 17 },
  pressed: { opacity: 0.85 },
  flipped: { transform: [{ rotate: "180deg" }] },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  teamHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", minHeight: 44, gap: 8 },
  backText: { color: theme.colors.accent, fontFamily: theme.fonts.label, fontSize: 15 },
});

export function PageState({
  query,
  empty,
  more,
}: {
  query: {
    data?: { pages: { data: readonly unknown[] }[] };
    error: Error | null;
    isFetching: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
    refetch: () => Promise<unknown>;
  };
  empty?: string;
  more: string;
}) {
  return (
    <>
      {query.error || !query.data || (empty && !query.data.pages.some((page) => page.data.length)) ? (
        <QueryState
          loading={!query.data && query.isFetching}
          error={query.error}
          empty={query.data ? empty : "Waiting for a connection."}
          retry={() => void query.refetch()}
        />
      ) : null}
      {query.hasNextPage ? (
        <ActionButton
          variant="secondary"
          loading={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
        >
          {more}
        </ActionButton>
      ) : null}
    </>
  );
}
