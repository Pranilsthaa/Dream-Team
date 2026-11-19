import { Text } from "react-native";

import { ActionButton } from "@/components/action-button";
import type { Tournament } from "@/features/leagues/api";
import { tournamentPath } from "@/features/leagues/match-setup";
import type { Fixture } from "@/features/leagues/schedule";
import { scorecardPath, useStaffScorecard } from "@/features/leagues/scoring";
import { dashboardStyles as shared } from "@/screens/dashboard/ui";
import { createStatusAction, openScoreMatch, useMatchCentre } from "./match-centre-screen";

export function FixtureAction({ tournament, fixture, canEditSchedule }: {
  tournament: Tournament;
  fixture: Fixture;
  canEditSchedule: boolean;
}) {
  const { openEditor } = useMatchCentre();
  const { leagueId, id: tournamentId } = tournament;
  const upcoming = fixture.status === "upcoming";
  const live = fixture.status === "live";
  const cancelled = fixture.status === "cancelled";
  const hasAction = upcoming || live || cancelled || fixture.status === "completed";
  const legacy = fixture.hasScorecard === undefined && hasAction;
  const scorecard = useStaffScorecard(scorecardPath(leagueId, tournamentId, fixture.id), legacy);

  if (!hasAction) return null;
  if (legacy && scorecard.error) {
    return (
      <ActionButton variant="secondary" size="compact" onPress={() => void scorecard.refetch()}>
        Retry scorecard check
      </ActionButton>
    );
  }
  const ready = fixture.hasScorecard ?? (scorecard.data === undefined ? undefined : scorecard.data !== null);
  if (ready === undefined) return <Text style={shared.body}>Checking lineups…</Text>;

  if ((upcoming || live) && !ready) {
    return <ActionButton onPress={() => openEditor({ kind: "lineup", fixture })}>Set lineups</ActionButton>;
  }
  if (upcoming) {
    if (!canEditSchedule) return <Text style={shared.body}>Lineups confirmed. Waiting for an owner or admin to mark the match live.</Text>;
    return (
      <ActionButton onPress={() => openEditor(createStatusAction(tournamentPath(leagueId, tournamentId), fixture, "live"))}>
        Mark live
      </ActionButton>
    );
  }
  if (!ready) {
    return <Text style={shared.body}>{cancelled ? "Cancelled before lineups were confirmed." : "No scorecard available."}</Text>;
  }
  return (
    <ActionButton variant={live ? "primary" : "secondary"} onPress={() => openScoreMatch(tournament, fixture)}>
      {live ? "Open scoring" : "Open scorecard"}
    </ActionButton>
  );
}
