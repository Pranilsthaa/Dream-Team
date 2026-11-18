import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/api-error";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import { tournamentPath } from "./match-setup";

export const extras = [
  { id: "wide", name: "Wide" },
  { id: "no_ball", name: "No-ball" },
  { id: "bye", name: "Bye" },
  { id: "leg_bye", name: "Leg bye" },
  { id: "no_ball_bye", name: "No-ball + byes" },
  { id: "no_ball_leg_bye", name: "No-ball + leg byes" },
] as const;

export const dismissals = [
  { id: "bowled", name: "Bowled" },
  { id: "caught", name: "Caught" },
  { id: "lbw", name: "LBW" },
  { id: "stumped", name: "Stumped" },
  { id: "run_out", name: "Run out" },
  { id: "hit_wicket", name: "Hit wicket" },
  { id: "obstructing_field", name: "Obstructing the field" },
  { id: "hit_ball_twice", name: "Hit the ball twice" },
] as const;

export type Extra = (typeof extras)[number]["id"];
export type Dismissal = (typeof dismissals)[number]["id"];
export type Delivery = {
  batRuns: number;
  extra?: Extra;
  extraRuns?: number;
  boundary?: 4 | 6;
  dismissal?: Dismissal;
  dismissedPlayerId?: string;
  fielderIds?: string[];
};
type RecordedBall = Delivery & {
  sequence: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  legalBall: boolean;
  over: number;
  ballInOver: number;
};

export type Innings = {
  number: number;
  battingTeamId: string;
  bowlingTeamId: string;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  previousBowlerId: string | null;
  target: number | null;
  runs: number;
  wickets: number;
  extras: number;
  legalBalls: number;
  freeHit: boolean;
  closed: boolean;
  usedBatters: string[];
  balls: RecordedBall[];
};

export type PlayerStats = {
  id: string;
  name: string;
  teamId: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  balls_bowled: number;
  runs_conceded: number;
  wickets: number;
  catches: number;
  stumpings: number;
  run_outs: number;
};

type OfficialResult = {
  revision: number;
  publishedAt: string;
  outcome: "team_win" | "tie" | "no_result" | "draw";
  winnerTeamId: string | null;
};

export type StaffScorecard = {
  fixtureId: string;
  version: number;
  overs: number;
  status: string;
  correcting: boolean;
  official: OfficialResult | null;
  innings: Innings[];
  players: PlayerStats[];
};

export type ScoringAction =
  | { kind: "innings"; teamId: string; strikerId: string; nonStrikerId: string }
  | { kind: "bowler" | "batter"; playerId: string }
  | { kind: "deliveries"; delivery: Delivery }
  | { kind: "undo" };

export function scorecardPath(leagueId: string, tournamentId: string, fixtureId: string) {
  return `${tournamentPath(leagueId, tournamentId)}/schedule/fixtures/${fixtureId}/scorecard`;
}

export function useStaffScorecard(path: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["lineup-status", session.user?.id, path],
    enabled: session.status === "signed-in",
    staleTime: 0,
    networkMode: "always",
    queryFn: async ({ signal }) => {
      try {
        return (await apiClient.get<StaffScorecard>(path, { signal })).data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404 && error.message === "Scorecard has not been set up") {
          return null;
        }
        throw error;
      }
    },
  });
}

export async function recordScoringAction(path: string, version: number, action: ScoringAction) {
  const { kind, ...selection } = action;
  const body = { ...(action.kind === "deliveries" ? action.delivery : selection), version };
  const method = kind === "batter" || kind === "bowler" ? "put" : "post";
  const { data } = await apiClient.request<{ version: number }>({ url: `${path}/${kind}`, method, data: body });
  return data.version;
}

export function oversLabel(balls: number) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}
