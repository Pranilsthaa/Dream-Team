import { Text } from "react-native";

import { ActionButton } from "@/components/action-button";
import type { Tournament } from "@/features/leagues/api";
import {
  tournamentPath,
  useLineupStatus,
  useSetupList,
  type Registration,
  type Team,
} from "@/features/leagues/match-setup";
import type { Fixture } from "@/features/leagues/schedule";
import { QueryState } from "@/screens/dashboard/query-state";
import { dashboardStyles as shared } from "@/screens/dashboard/ui";
import { PageState } from "./roster-panel";
import { integerBetween, SetupForm, type SetupAction } from "./setup-form";

export type FixtureEditor =
  | { kind: "fixture"; fixture?: Fixture }
  | { kind: "lineup"; fixture: Fixture };

export function FixtureSetup({
  tournament,
  editor,
  onSaved,
}: {
  tournament: Tournament;
  editor: FixtureEditor;
  onSaved: () => void;
}) {
  const path = tournamentPath(tournament.leagueId, tournament.id);
  if (editor.kind === "lineup") {
    return (
      <LineupSetup path={path} fixture={editor.fixture} onSaved={onSaved} />
    );
  }
  return (
    <FixtureForm
      path={path}
      fixture={editor.fixture}
      timezone={tournament.timezone}
      onSaved={onSaved}
    />
  );
}

function FixtureForm({
  path,
  fixture,
  timezone,
  onSaved,
}: {
  path: string;
  fixture?: Fixture;
  timezone: string;
  onSaved: () => void;
}) {
  const query = useSetupList<Team>(`${path}/teams`);
  const teams = query.data?.pages.flatMap((page) => page.data) ?? [];
  const action: SetupAction = {
    title: fixture ? "Edit fixture" : "New fixture",
    method: fixture ? "patch" : "post",
    path: fixture
      ? `${path}/schedule/fixtures/${fixture.id}`
      : `${path}/schedule/fixtures`,
    fields: [
      {
        key: "team1Id",
        label: "Team A",
        choices: teams,
        initial: fixture?.team1.id,
      },
      {
        key: "team2Id",
        label: "Team B",
        choices: teams,
        initial: fixture?.team2.id,
      },
      {
        key: "matchNumber",
        label: "Match number",
        initial: fixture ? String(fixture.matchNumber) : "",
        number: true,
        validate: integerBetween(1, 2147483647),
      },
      { key: "venue", label: "Venue", initial: fixture?.venue, maxLength: 50 },
      {
        key: "date",
        label: "Start date and time",
        initial: fixture?.date,
        dateTime: { displayTimezone: timezone },
      },
    ],
    body: ({ team1Id, team2Id, matchNumber, venue, date }) => ({
      team1Id,
      team2Id,
      matchNumber: Number(matchNumber),
      venue: String(venue).trim(),
      date: String(date),
    }),
  };
  return (
    <>
      <PageState
        query={query}
        empty="Enroll teams in the tournament first."
        more="More enrolled teams"
      />
      {teams.length >= 2 ? (
        <SetupForm
          action={action}
          validate={({ team1Id, team2Id }) =>
            team1Id === team2Id ? "Select two different teams." : undefined
          }
          onSaved={onSaved}
        />
      ) : query.data && teams.length === 1 ? (
        <Text style={shared.body}>
          Enroll a second team to create a fixture.
        </Text>
      ) : null}
    </>
  );
}

function LineupSetup({
  path,
  fixture,
  onSaved,
}: {
  path: string;
  fixture: Fixture;
  onSaved: () => void;
}) {
  const scorecard = `${path}/schedule/fixtures/${fixture.id}/scorecard`;
  const status = useLineupStatus(scorecard, true);
  const rosterQuery = useSetupList<Registration>(
    `${path}/players`,
    status.data === null,
  );
  if (status.error || status.data === undefined) {
    return (
      <QueryState
        loading={status.isFetching}
        error={status.error}
        empty="Waiting for a connection."
        retry={() => void status.refetch()}
      />
    );
  }
  if (status.data) {
    return (
      <Text style={shared.body}>
        Lineups are already confirmed for this {status.data.overs}-over match.
      </Text>
    );
  }
  const roster = rosterQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const team1 = roster.filter(
    (player) => player.isActive && player.teamId === fixture.team1.id,
  );
  const team2 = roster.filter(
    (player) => player.isActive && player.teamId === fixture.team2.id,
  );
  return (
    <>
      <PageState
        query={rosterQuery}
        empty="No tournament players registered."
        more="More registrations"
      />
      {team1.length >= 2 && team2.length >= 2 ? (
        <>
          <Text style={shared.body}>
            Choose 2-11 players per team. Confirming lineups locks the fixture
            details.
          </Text>
          <SetupForm
            action={{
              title: "Set lineups",
              method: "put",
              path: `${scorecard}/lineups`,
              submitLabel: "Confirm lineups",
              fields: [
                {
                  key: "overs",
                  label: "Overs per side",
                  initial: "20",
                  number: true,
                  validate: integerBetween(1, 50),
                },
                {
                  key: "team1",
                  label: fixture.team1.name,
                  choices: team1,
                  multiple: { min: 2, max: 11 },
                },
                {
                  key: "team2",
                  label: fixture.team2.name,
                  choices: team2,
                  multiple: { min: 2, max: 11 },
                },
              ],
              body: ({ overs, team1, team2 }) => ({
                overs: Number(overs),
                team1,
                team2,
              }),
            }}
            onSaved={onSaved}
          />
        </>
      ) : rosterQuery.data ? (
        <Text style={shared.body}>
          Each team needs at least two active tournament registrations. Load
          more registrations if available.
        </Text>
      ) : null}
      <ActionButton variant="secondary" onPress={() => void status.refetch()}>
        Refresh lineup status
      </ActionButton>
    </>
  );
}
