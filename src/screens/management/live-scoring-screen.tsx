import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CircleDot } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/action-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { theme } from "@/constants/theme";
import {
  dismissals,
  extras,
  oversLabel,
  recordScoringAction,
  scorecardPath,
  useStaffScorecard,
  type Innings,
  type ScoringAction,
  type StaffScorecard,
} from "@/features/leagues/scoring";
import { ApiError } from "@/lib/api/api-error";
import { QueryState } from "@/screens/dashboard/query-state";
import {
  Card,
  LeagueChips,
  SectionHeading,
  dashboardStyles as shared,
} from "@/screens/dashboard/ui";
import { ScoringForm, type ScoringEditor } from "./scoring-form";

type Params = {
  leagueId?: string;
  tournamentId?: string;
  fixtureId?: string;
  teamA?: string;
  teamAName?: string;
  teamB?: string;
  teamBName?: string;
};

const titles: Record<ScoringEditor, string> = {
  innings: "Start innings",
  bowler: "Choose bowler",
  batter: "Choose incoming batter",
  delivery: "Delivery details",
  undo: "Undo scoring action",
};

function exitScoring() {
  if (router.canGoBack()) router.back();
  else router.replace("/manage-matches");
}

function isId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value)
  );
}

export function LiveScoringScreen() {
  const params = useLocalSearchParams<Params>();
  const { leagueId, tournamentId, fixtureId } = params;
  return (
    <SafeAreaView style={shared.screen}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={[shared.scroll, styles.content]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={exitScoring}
          style={styles.back}
        >
          <ArrowLeft size={18} color={theme.colors.accent} />
          <Text style={styles.label}>Match Centre</Text>
        </Pressable>
        {isId(leagueId) && isId(tournamentId) && isId(fixtureId) ? (
          <ScoringWorkspace
            key={fixtureId}
            path={scorecardPath(leagueId, tournamentId, fixtureId)}
            params={params}
          />
        ) : (
          <QueryState empty="Choose a fixture in Match Centre." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoringWorkspace({ path, params }: { path: string; params: Params }) {
  const query = useStaffScorecard(path);
  const client = useQueryClient();
  const inFlight = useRef(false);
  const [minimumVersion, setMinimumVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{
    editor: ScoringEditor;
    version: number;
  } | null>(null);
  const [view, setView] = useState("live");
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [needsReview, setNeedsReview] = useState(false);
  const mutation = useMutation({
    mutationFn: ({
      version,
      action,
    }: {
      version: number;
      action: ScoringAction;
    }) => recordScoringAction(path, version, action),
    networkMode: "always",
    retry: false,
  });
  const card = query.data;
  const editor =
    draft?.version === card?.version ? (draft?.editor ?? null) : null;
  const canWrite = Boolean(
    card &&
    (card.status === "live" || card.correcting) &&
    !query.error &&
    !needsReview,
  );
  const blocked = busy || query.isFetching || !canWrite;

  async function reload(expected = minimumVersion) {
    const refreshed = await query.refetch();
    return (
      refreshed.isSuccess &&
      !!refreshed.data &&
      refreshed.data.version >= expected
    );
  }

  async function submit(action: ScoringAction) {
    if (!card || blocked || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFormError("");
    setNotice("");
    try {
      let savedVersion: number;
      try {
        savedVersion = await mutation.mutateAsync({
          version: card.version,
          action,
        });
        setMinimumVersion(savedVersion);
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          const message = error.message;
          if (editor) setFormError(message);
          setNotice(message);
          return;
        }
        setDraft(null);
        setNeedsReview(true);
        const refreshed = await reload();
        const message =
          error instanceof Error ? error.message : "The scoring action failed.";
        const instruction = refreshed
          ? "Review the refreshed scorecard before continuing."
          : "Refresh the scorecard before continuing.";
        setNotice(`${message} ${instruction}`);
        return;
      }
      setDraft(null);
      if (!(await reload(savedVersion))) {
        setNeedsReview(true);
        setNotice(
          "Action saved. Refresh and review the scorecard before recording another action.",
        );
      }
      void client.invalidateQueries({
        queryKey: ["staff-schedule"],
        refetchType: "none",
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function refresh() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const refreshed = await reload();
      if (refreshed && needsReview)
        setNotice(
          "Scorecard refreshed. Review the latest action before continuing.",
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  if (!card) {
    return (
      <>
        <SectionHeading>Scorecard</SectionHeading>
        <QueryState
          loading={query.isFetching}
          empty={
            card === null
              ? "Set the match lineups in Match Centre before scoring."
              : "Waiting for a connection."
          }
          error={query.error}
          retry={() => void refresh()}
        />
      </>
    );
  }

  const teams = [...new Set(card.players.map(({ teamId }) => teamId))].map(
    (id, index) => ({
      id,
      name:
        (id === params.teamA &&
          typeof params.teamAName === "string" &&
          params.teamAName) ||
        (id === params.teamB &&
          typeof params.teamBName === "string" &&
          params.teamBName) ||
        `Team ${index + 1}`,
    }),
  );
  const teamName = (id: string) =>
    teams.find((item) => item.id === id)?.name ?? "Team";
  const playerName = (id: string | null) =>
    card.players.find((item) => item.id === id)?.name ?? "To select";
  const innings = card.innings.at(-1);
  const matchFinished = Boolean(innings?.closed && innings.number === 2);
  const editable = card.status === "live" || card.correcting;
  const nextEditor = nextScoringStep(innings);
  const open = (kind: ScoringEditor) => {
    setFormError("");
    setDraft({ editor: kind, version: card.version });
  };
  const title = card.status === "live" ? "Live scoring" : "Scorecard";
  const canAcknowledge =
    needsReview && !query.error && card.version >= minimumVersion;

  return (
    <>
      <View style={styles.row}>
        <CircleDot size={16} color={theme.colors.accent} />
        <Text style={styles.label}>
          {card.correcting
            ? "CORRECTION IN PROGRESS"
            : card.status.toUpperCase()}
        </Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={shared.body}>
        {teams.map((team) => team.name).join(" v ")} · {card.overs} overs per
        side
      </Text>
      <LeagueChips
        items={[
          { id: "live", name: "Match" },
          { id: "card", name: "Scorecard" },
        ]}
        selected={view}
        onSelect={setView}
      />
      {query.error ? (
        <QueryState error={query.error} retry={() => void refresh()} />
      ) : null}
      {notice ? (
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          {notice}
        </Text>
      ) : null}
      {canAcknowledge ? (
        <ActionButton
          variant="secondary"
          disabled={busy || query.isFetching}
          onPress={() => {
            setNeedsReview(false);
            setNotice("");
          }}
        >
          I reviewed the scorecard
        </ActionButton>
      ) : null}
      {view === "card" ? (
        <Scorecard card={card} teamName={teamName} playerName={playerName} />
      ) : (
        <>
          {innings ? (
            <InningsSummary innings={innings} teamName={teamName} />
          ) : (
            <Text style={shared.body}>
              Lineups confirmed. No innings started.
            </Text>
          )}
          {innings && !innings.closed ? (
            <>
              <Card style={styles.card}>
                <Text style={shared.body}>
                  Striker · {playerName(innings.strikerId)}
                </Text>
                <Text style={shared.body}>
                  Non-striker · {playerName(innings.nonStrikerId)}
                </Text>
                <Text style={shared.body}>
                  Bowler · {playerName(innings.bowlerId)}
                </Text>
                {innings.freeHit ? (
                  <Text style={styles.label}>FREE HIT</Text>
                ) : null}
              </Card>
              <OverStrip innings={innings} />
            </>
          ) : null}
          {matchFinished && !card.official ? (
            <Text style={styles.label}>
              Both innings complete · result awaiting publication
            </Text>
          ) : null}
          {editable && nextEditor && nextEditor !== "delivery" ? (
            <ActionButton onPress={() => open(nextEditor)} disabled={blocked}>
              {nextEditor === "innings" && innings
                ? "Start second innings"
                : titles[nextEditor]}
            </ActionButton>
          ) : null}
          {editable && nextEditor === "delivery" ? (
            <>
              <SectionHeading>Score delivery</SectionHeading>
              <View style={styles.runPad}>
                {[0, 1, 2, 3, 4, 6].map((runs) => (
                  <View style={styles.run} key={runs}>
                    <ActionButton
                      disabled={blocked}
                      onPress={() =>
                        void submit({
                          kind: "deliveries",
                          delivery: {
                            batRuns: runs,
                            ...(runs === 4 || runs === 6
                              ? { boundary: runs }
                              : {}),
                          },
                        })
                      }
                    >
                      {String(runs)}
                    </ActionButton>
                  </View>
                ))}
              </View>
              <ActionButton
                variant="secondary"
                disabled={blocked}
                onPress={() => open("delivery")}
              >
                Extras or wicket
              </ActionButton>
            </>
          ) : null}
          {editable && card.innings.length > 0 ? (
            <ActionButton
              variant="secondary"
              disabled={blocked}
              onPress={() => open("undo")}
            >
              Undo last action
            </ActionButton>
          ) : null}
          {innings ? (
            <RecentDeliveries innings={innings} playerName={playerName} />
          ) : null}
        </>
      )}
      <ActionButton
        variant="secondary"
        disabled={busy || query.isFetching}
        onPress={() => void refresh()}
      >
        Refresh scorecard
      </ActionButton>
      <BottomSheet
        open={editor !== null}
        onClose={() => setDraft(null)}
        title={editor ? titles[editor] : ""}
        description={
          editor === "undo"
            ? "Reverse the latest saved scoring action, including a delivery or player selection."
            : undefined
        }
      >
        {editor ? (
          <>
            {formError ? (
              <Text accessibilityRole="alert" style={styles.notice}>
                {formError}
              </Text>
            ) : null}
            <ScoringForm
              key={`${editor}-${card.version}`}
              editor={editor}
              card={card}
              innings={innings}
              teams={teams}
              busy={blocked}
              submit={submit}
            />
          </>
        ) : null}
      </BottomSheet>
    </>
  );
}

function nextScoringStep(innings?: Innings): ScoringEditor | null {
  if (!innings) return "innings";
  if (innings.closed) return innings.number === 1 ? "innings" : null;
  if (!innings.strikerId || !innings.nonStrikerId) return "batter";
  if (!innings.bowlerId) return "bowler";
  return "delivery";
}

function InningsSummary({
  innings,
  teamName,
}: {
  innings: Innings;
  teamName: (id: string) => string;
}) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>
        {teamName(innings.battingTeamId)} · Innings {innings.number}
      </Text>
      <Text style={styles.score}>
        {innings.runs}/{innings.wickets}
      </Text>
      <Text style={shared.body}>
        {oversLabel(innings.legalBalls)} overs · {innings.extras} extras
        {innings.target === null ? "" : ` · Target ${innings.target}`}
      </Text>
      {innings.closed ? (
        <Text style={shared.body}>Innings complete</Text>
      ) : null}
    </Card>
  );
}

function OverStrip({ innings }: { innings: Innings }) {
  const over = Math.floor(innings.legalBalls / 6);
  const current = innings.balls.filter((item) => item.over === over);
  const balls = current.length
    ? current
    : innings.balls.filter((item) => item.over === over - 1);
  return (
    <Card style={styles.card}>
      <Text style={shared.cardTitle}>
        {current.length || !balls.length ? "This over" : "Last over"}
      </Text>
      <View style={styles.runPad}>
        {balls.map((ball) => (
          <Text
            key={ball.sequence}
            style={styles.ball}
            accessibilityLabel={
              ball.dismissal
                ? "Wicket"
                : ball.extra
                  ? `${ball.runs} runs with extras`
                  : `${ball.runs} runs`
            }
          >
            {ball.dismissal ? "W" : ball.extra ? `${ball.runs}*` : ball.runs}
          </Text>
        ))}
        {!balls.length ? (
          <Text style={shared.body}>No deliveries yet</Text>
        ) : null}
      </View>
    </Card>
  );
}

function RecentDeliveries({
  innings,
  playerName,
}: {
  innings: Innings;
  playerName: (id: string | null) => string;
}) {
  if (!innings.balls.length) return null;
  return (
    <>
      <SectionHeading>Recent deliveries</SectionHeading>
      <Card style={styles.card}>
        {innings.balls
          .slice(-12)
          .reverse()
          .map((ball) => (
            <Text key={ball.sequence} style={shared.body}>
              {ball.over}.{ball.ballInOver} · {playerName(ball.bowlerId)} to{" "}
              {playerName(ball.strikerId)} · {ball.runs}{" "}
              {ball.runs === 1 ? "run" : "runs"}
              {ball.extra
                ? ` · ${extras.find((item) => item.id === ball.extra)?.name}`
                : ""}
              {ball.dismissal
                ? ` · ${playerName(ball.dismissedPlayerId ?? null)} · ${dismissals.find((item) => item.id === ball.dismissal)?.name}`
                : ""}
            </Text>
          ))}
      </Card>
    </>
  );
}

function Scorecard({
  card,
  teamName,
  playerName,
}: {
  card: StaffScorecard;
  teamName: (id: string) => string;
  playerName: (id: string | null) => string;
}) {
  const [selected, select] = useState("1");
  const innings =
    card.innings.find((item) => String(item.number) === selected) ??
    card.innings[0];
  if (!innings)
    return (
      <QueryState empty="The scorecard will populate when an innings starts." />
    );
  const batting = card.players.filter(
    (player) => player.teamId === innings.battingTeamId,
  );
  const bowling = card.players.filter(
    (player) => player.teamId === innings.bowlingTeamId,
  );
  const fielders = bowling.filter(
    (player) => player.catches || player.stumpings || player.run_outs,
  );
  const result = card.official;
  return (
    <>
      {result ? (
        <Text style={styles.label}>
          Official result ·{" "}
          {result.winnerTeamId
            ? `${teamName(result.winnerTeamId)} won`
            : result.outcome.replaceAll("_", " ")}
        </Text>
      ) : null}
      <LeagueChips
        items={card.innings.map((item) => ({
          id: String(item.number),
          name: `Innings ${item.number}`,
        }))}
        selected={String(innings.number)}
        onSelect={select}
      />
      <InningsSummary innings={innings} teamName={teamName} />
      <Card style={styles.card}>
        <Text style={shared.cardTitle}>Batting</Text>
        <Text style={styles.label}>Runs (balls) · 4s · 6s</Text>
        {batting.map((player) => (
          <Text key={player.id} style={shared.body}>
            {player.name} ·{" "}
            {innings.usedBatters.includes(player.id)
              ? `${player.runs} (${player.balls_faced}) · ${player.fours} · ${player.sixes}`
              : "Yet to bat"}
          </Text>
        ))}
      </Card>
      <Card style={styles.card}>
        <Text style={shared.cardTitle}>Bowling</Text>
        <Text style={styles.label}>Overs · Runs · Wickets</Text>
        {bowling.map((player) => (
          <Text key={player.id} style={shared.body}>
            {player.name} · {oversLabel(player.balls_bowled)} ·{" "}
            {player.runs_conceded} · {player.wickets}
          </Text>
        ))}
      </Card>
      {fielders.length ? (
        <Card style={styles.card}>
          <Text style={shared.cardTitle}>Fielding</Text>
          <Text style={styles.label}>Catches · Stumpings · Run-outs</Text>
          {fielders.map((player) => (
            <Text key={player.id} style={shared.body}>
              {player.name} · {player.catches} · {player.stumpings} ·{" "}
              {player.run_outs}
            </Text>
          ))}
        </Card>
      ) : null}
      <RecentDeliveries innings={innings} playerName={playerName} />
    </>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", maxWidth: 640, alignSelf: "center" },
  content: { gap: 12 },
  back: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.label,
    fontSize: 14,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 42,
  },
  score: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.display,
    fontSize: 46,
  },
  notice: { color: theme.colors.warning, fontFamily: theme.fonts.label },
  runPad: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  run: { flexGrow: 1, flexBasis: "25%" },
  ball: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: theme.colors.deep,
    color: theme.colors.accent,
    fontFamily: theme.fonts.label,
  },
  card: { gap: 8 },
});
