import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/action-button";
import { theme } from "@/constants/theme";
import {
  dismissals,
  extras,
  type Dismissal,
  type Extra,
  type Innings,
  type ScoringAction,
  type StaffScorecard,
} from "@/features/leagues/scoring";
import { AuthField } from "@/screens/auth/auth-field";
import { LeagueChips, dashboardStyles as shared } from "@/screens/dashboard/ui";
import { integerBetween } from "./setup-form";

export type ScoringEditor =
  | "innings"
  | "bowler"
  | "batter"
  | "delivery"
  | "undo";
type Option = { id: string; name: string };
type Values = {
  team: string;
  striker: string;
  nonStriker: string;
  player: string;
  extra: Extra | "none";
  extraRuns: string;
  batRuns: string;
  boundary: "no" | "yes";
  dismissal: Dismissal | "none";
  dismissed: string;
  fielders: string[];
};

const uncredited: string[] = ["run_out", "obstructing_field", "hit_ball_twice"];

export function ScoringForm({
  editor,
  card,
  innings,
  teams,
  busy,
  submit,
}: {
  editor: ScoringEditor;
  card: StaffScorecard;
  innings?: Innings;
  teams: Option[];
  busy: boolean;
  submit: (action: ScoringAction) => Promise<void>;
}) {
  const form = useForm<Values>({
    defaultValues: {
      team: innings?.bowlingTeamId ?? "",
      striker: "",
      nonStriker: "",
      player: "",
      extra: "none",
      extraRuns: "0",
      batRuns: "0",
      boundary: "no",
      dismissal: "none",
      dismissed: innings?.strikerId ?? "",
      fielders: [],
    },
  });
  const team = useWatch({ control: form.control, name: "team" });
  const extra = useWatch({ control: form.control, name: "extra" });
  const batRuns = useWatch({ control: form.control, name: "batRuns" });
  const dismissal = useWatch({ control: form.control, name: "dismissal" });
  const battingOptions = card.players.filter(
    (player) => player.teamId === team,
  );
  const bowling = card.players.filter(
    (player) => player.teamId === innings?.bowlingTeamId,
  );
  const candidates =
    editor === "bowler"
      ? bowling.filter((player) => player.id !== innings?.previousBowlerId)
      : card.players.filter(
          (player) =>
            player.teamId === innings?.battingTeamId &&
            !innings.usedBatters.includes(player.id),
        );
  const extraOnly = extra === "wide" || extra.endsWith("bye");
  const needsExtras = extraOnly;
  const noBall = extra.startsWith("no_ball");
  const dismissalOptions = dismissals.filter(({ id }) => {
    if (noBall || innings?.freeHit)
      return (
        uncredited.includes(id) && (extra !== "wide" || id !== "hit_ball_twice")
      );
    if (extra === "wide")
      return ["run_out", "stumped", "hit_wicket", "obstructing_field"].includes(
        id,
      );
    return true;
  });
  const eligibleBatters = card.players.filter(
    (player) =>
      player.id === innings?.strikerId ||
      (uncredited.includes(dismissal) && player.id === innings?.nonStrikerId),
  );
  const needsFielder = dismissal === "caught" || dismissal === "stumped";
  const allowsFielders = needsFielder || dismissal === "run_out";
  const showBoundary = !extraOnly && (batRuns === "4" || batRuns === "6");
  const choose = (
    name: Exclude<keyof Values, "fielders" | "extraRuns" | "batRuns">,
    label: string,
    items: readonly Option[],
    onChange?: () => void,
  ) => (
    <ChoiceField
      control={form.control}
      name={name}
      label={label}
      options={items}
      busy={busy}
      onChange={onChange}
    />
  );

  const save = form.handleSubmit(async (values) => {
    if (editor === "undo") return submit({ kind: "undo" });
    if (editor === "innings") {
      if (values.striker === values.nonStriker) {
        form.setError("nonStriker", {
          message: "Choose a different opening batter.",
        });
        return;
      }
      return submit({
        kind: "innings",
        teamId: values.team,
        strikerId: values.striker,
        nonStrikerId: values.nonStriker,
      });
    }
    if (editor === "bowler" || editor === "batter")
      return submit({ kind: editor, playerId: values.player });

    const runs = extraOnly ? 0 : Number(values.batRuns);
    const extraRuns = needsExtras ? Number(values.extraRuns) : 0;
    if (
      dismissal !== "none" &&
      !uncredited.includes(dismissal) &&
      (runs || extraRuns)
    ) {
      form.setError("root", {
        message: "This dismissal cannot include additional runs.",
      });
      return;
    }
    if (needsFielder && values.fielders.length !== 1) {
      form.setError("fielders", { message: "Select one fielder." });
      return;
    }
    return submit({
      kind: "deliveries",
      delivery: {
        batRuns: runs,
        ...(extra !== "none" ? { extra } : {}),
        ...(needsExtras ? { extraRuns } : {}),
        ...(showBoundary &&
        values.boundary === "yes" &&
        (runs === 4 || runs === 6)
          ? { boundary: runs }
          : {}),
        ...(dismissal !== "none"
          ? { dismissal, dismissedPlayerId: values.dismissed }
          : {}),
        ...(allowsFielders && values.fielders.length
          ? { fielderIds: values.fielders }
          : {}),
      },
    });
  });

  return (
    <View style={styles.form}>
      {editor === "innings" ? (
        <>
          {choose(
            "team",
            innings ? "Chasing team" : "Batting first · from toss decision",
            innings
              ? teams.filter((item) => item.id === innings.bowlingTeamId)
              : teams,
            () => {
              form.resetField("striker");
              form.resetField("nonStriker");
            },
          )}
          {team ? (
            <>
              {choose("striker", "Opening striker", battingOptions)}
              {choose("nonStriker", "Opening non-striker", battingOptions)}
            </>
          ) : null}
        </>
      ) : null}
      {editor === "bowler" || editor === "batter"
        ? choose(
            "player",
            editor === "bowler" ? "Bowler" : "Incoming batter",
            candidates,
          )
        : null}
      {editor === "delivery" ? (
        <>
          {choose(
            "extra",
            "Extras",
            [{ id: "none", name: "None" }, ...extras],
            () => {
              form.resetField("dismissal");
              form.resetField("fielders");
              form.clearErrors("root");
            },
          )}
          {noBall ? (
            <Text style={shared.body}>
              The server adds the no-ball penalty automatically.
            </Text>
          ) : null}
          {!extraOnly ? (
            <AuthField
              control={form.control}
              name="batRuns"
              shouldUnregister
              label="Runs off the bat"
              keyboardType="number-pad"
              editable={!busy}
              rules={{
                validate: (value) => integerBetween(0, 8)(String(value)),
              }}
            />
          ) : null}
          {needsExtras ? (
            <AuthField
              control={form.control}
              name="extraRuns"
              shouldUnregister
              label={
                extra === "wide"
                  ? "Additional wides (excludes the automatic penalty)"
                  : "Byes or leg byes"
              }
              keyboardType="number-pad"
              editable={!busy}
              rules={{
                validate: (value) =>
                  integerBetween(extra === "wide" ? 0 : 1, 8)(String(value)),
              }}
            />
          ) : null}
          {showBoundary
            ? choose("boundary", "Boundary hit", [
                { id: "no", name: "No" },
                { id: "yes", name: "Yes" },
              ])
            : null}
          {choose(
            "dismissal",
            "Dismissal",
            [{ id: "none", name: "None" }, ...dismissalOptions],
            () => {
              form.resetField("dismissed");
              form.resetField("fielders");
              form.clearErrors("root");
            },
          )}
          {dismissal !== "none"
            ? choose("dismissed", "Batter dismissed", eligibleBatters)
            : null}
          {allowsFielders ? (
            <Controller
              name="fielders"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Text style={shared.body}>
                    {needsFielder
                      ? "Fielder"
                      : "Fielders (optional, up to two)"}
                  </Text>
                  <LeagueChips
                    items={bowling}
                    selected={field.value}
                    onSelect={(id) => {
                      if (busy) return;
                      const selected = field.value;
                      if (selected.includes(id))
                        field.onChange(selected.filter((item) => item !== id));
                      else if (needsFielder) field.onChange([id]);
                      else if (selected.length < 2)
                        field.onChange([...selected, id]);
                    }}
                  />
                  {fieldState.error ? (
                    <Text style={styles.error}>{fieldState.error.message}</Text>
                  ) : null}
                </>
              )}
            />
          ) : null}
        </>
      ) : null}
      {form.formState.errors.root?.message ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {form.formState.errors.root.message}
        </Text>
      ) : null}
      <ActionButton loading={busy} onPress={() => void save()}>
        {editor === "undo"
          ? "Undo last action"
          : editor === "innings"
            ? "Start innings"
            : editor === "delivery"
              ? "Record delivery"
              : "Confirm player"}
      </ActionButton>
    </View>
  );
}

function ChoiceField({
  control,
  name,
  label,
  options,
  busy,
  onChange,
}: {
  control: Control<Values>;
  name: Exclude<keyof Values, "fielders" | "extraRuns" | "batRuns">;
  label: string;
  options: readonly Option[];
  busy: boolean;
  onChange?: () => void;
}) {
  return (
    <Controller
      control={control}
      name={name}
      shouldUnregister
      rules={{
        validate: (id) =>
          options.some((item) => item.id === id) || "Choose an option.",
      }}
      render={({ field, fieldState }) => (
        <View>
          <Text style={shared.body}>{label}</Text>
          <LeagueChips
            items={[...options]}
            selected={field.value}
            onSelect={(id) => {
              if (busy) return;
              field.onChange(id);
              onChange?.();
            }}
          />
          {fieldState.error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {fieldState.error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  error: { color: theme.colors.warning, fontFamily: theme.fonts.label },
});
