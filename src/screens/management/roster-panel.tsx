import { useState } from "react";
import { Text, View } from "react-native";

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
  LeagueChips,
  SectionHeading,
  dashboardStyles as shared,
} from "@/screens/dashboard/ui";
import { integerBetween, type SetupAction } from "./setup-form";

export function RosterPanel({
  tournament,
  canManage,
  onAction,
  defaultExpanded = false,
}: {
  tournament: Tournament;
  canManage: boolean;
  onAction: (action: SetupAction) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <>
      <SectionHeading
        action={expanded ? "Hide" : "Open"}
        onPress={() => setExpanded(!expanded)}
      >
        Teams and players
      </SectionHeading>
      {expanded ? (
        <RosterContents
          tournament={tournament}
          canManage={canManage}
          onAction={onAction}
        />
      ) : null}
    </>
  );
}

function RosterContents({
  tournament,
  canManage,
  onAction,
}: {
  tournament: Tournament;
  canManage: boolean;
  onAction: (action: SetupAction) => void;
}) {
  const base = `/leagues/${tournament.leagueId}`;
  const path = tournamentPath(tournament.leagueId, tournament.id);
  const teamsQuery = useSetupList<Team>(`${base}/teams`, canManage);
  const playersQuery = useSetupList<Player>(`${base}/players`, canManage);
  const enrolledQuery = useSetupList<Team>(`${path}/teams`);
  const rosterQuery = useSetupList<Registration>(`${path}/players`);
  const teams = teamsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const players = playersQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const enrolled = enrolledQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const roster = rosterQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const [teamId, selectTeam] = useState<string>();
  const [playerId, selectPlayer] = useState<string>();
  const [enrolledId, selectEnrolled] = useState<string>();
  const team = teams.find((item) => item.id === teamId);
  const player = players.find((item) => item.id === playerId);
  const currentTeam =
    enrolled.find((item) => item.id === enrolledId) ?? enrolled[0];
  const draft = canManage && tournament.status === "draft";

  const editTeam = (item?: Team) =>
    onAction({
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

  const editPlayer = (item?: Player) =>
    onAction({
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

  const register = (id: string, existing?: Registration) =>
    onAction({
      title: existing ? "Change tournament assignment" : "Register player",
      method: "put",
      path: `${path}/players/${id}`,
      fields: [
        {
          key: "teamId",
          label: "Enrolled team",
          choices: enrolled,
          initial: existing?.teamId,
        },
      ],
      body: ({ teamId }) => ({ teamId }),
    });

  return (
    <Card style={{ gap: 12 }}>
      {canManage ? (
        <>
          <SectionHeading action="+ Team" onPress={() => editTeam()}>
            League teams
          </SectionHeading>
          <PageState
            query={teamsQuery}
            empty="No league teams."
            more="More teams"
          />
          <LeagueChips items={teams} selected={teamId} onSelect={selectTeam} />
          {team ? (
            <View style={{ gap: 8 }}>
              <ActionButton variant="secondary" onPress={() => editTeam(team)}>
                Edit team
              </ActionButton>
              {draft && !enrolled.some((item) => item.id === team.id) ? (
                <ActionButton
                  onPress={() =>
                    onAction({
                      title: "Enroll team",
                      description: `Add ${team.name} to ${tournament.name}.`,
                      method: "put",
                      path: `${path}/teams/${team.id}`,
                      submitLabel: "Enroll team",
                    })
                  }
                >
                  Enroll team
                </ActionButton>
              ) : null}
            </View>
          ) : null}
          <SectionHeading action="+ Player" onPress={() => editPlayer()}>
            League players
          </SectionHeading>
          <PageState
            query={playersQuery}
            empty="No league players."
            more="More players"
          />
          <LeagueChips
            items={players}
            selected={playerId}
            onSelect={selectPlayer}
          />
          {player ? (
            <View style={{ gap: 8 }}>
              <ActionButton
                variant="secondary"
                onPress={() => editPlayer(player)}
              >
                Edit player
              </ActionButton>
              {draft && enrolled.length ? (
                <ActionButton
                  onPress={() =>
                    register(
                      player.id,
                      roster.find((item) => item.playerId === player.id),
                    )
                  }
                >
                  Assign to tournament team
                </ActionButton>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}

      <SectionHeading>Tournament roster</SectionHeading>
      <PageState
        query={enrolledQuery}
        empty="No teams enrolled."
        more="More enrolled teams"
      />
      <LeagueChips
        items={enrolled}
        selected={currentTeam?.id}
        onSelect={selectEnrolled}
      />
      <PageState
        query={rosterQuery}
        empty="No players registered."
        more="More registrations"
      />
      {currentTeam && draft ? (
        <SectionHeading
          action="Remove team"
          onPress={() =>
            onAction({
              title: "Remove tournament team",
              description: `Remove ${currentTeam.name} from ${tournament.name}. Teams with match or player records cannot be removed.`,
              method: "delete",
              path: `${path}/teams/${currentTeam.id}`,
              submitLabel: "Remove team",
            })
          }
        >
          {currentTeam.name}
        </SectionHeading>
      ) : null}
      {roster
        .filter((item) => item.teamId === currentTeam?.id)
        .map((item) => (
          <View key={item.id}>
            <Text style={shared.body}>
              {item.name} · {item.role}
              {item.isActive ? "" : " · Inactive"}
            </Text>
            {draft ? (
              <SectionHeading
                action="Remove"
                onPress={() =>
                  onAction({
                    title: "Remove player registration",
                    description: `Remove ${item.name} from this tournament. The league player profile will still be available.`,
                    method: "delete",
                    path: `${path}/players/${item.playerId}`,
                    submitLabel: "Remove registration",
                  })
                }
              >
                Registration
              </SectionHeading>
            ) : null}
          </View>
        ))}
      {canManage && !draft ? (
        <Text style={shared.body}>
          Tournament roster changes are available in draft tournaments.
        </Text>
      ) : null}
    </Card>
  );
}

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
  empty: string;
  more: string;
}) {
  return (
    <>
      {query.error || !query.data?.pages.some((page) => page.data.length) ? (
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
