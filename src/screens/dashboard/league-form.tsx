import { ActionButton } from "@/components/action-button";
import { DateTimeField } from "@/components/date-time-field";
import { theme } from "@/constants/theme";
import {
  leagueApi,
  type League,
  type Tournament,
} from "@/features/leagues/api";
import { useLeagueSelection } from "@/features/leagues/hooks";
import { AuthField } from "@/screens/auth/auth-field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

export type LeagueEditor =
  | { kind: "league"; value?: League }
  | { kind: "tournament"; leagueId: string; value?: Tournament };
type Values = { name: string; location: string; season: string; startsAt: string; endsAt: string };

export function LeagueForm({
  editor,
  onDone,
}: {
  editor: LeagueEditor;
  onDone: () => void;
}) {
  const inFlight = useRef(false);
  const tournament = editor.kind === "tournament";
  const edition = tournament ? editor.value : undefined;
  const client = useQueryClient();
  const select = useLeagueSelection((state) => state.select);
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      name: editor.value?.name ?? "",
      location: editor.kind === "league" ? (editor.value?.location ?? "") : "",
      season:
        editor.kind === "tournament" ? (editor.value?.season ?? "2026") : "",
      startsAt: edition?.startsAt ?? "",
      endsAt: edition?.endsAt ?? "",
    },
  });
  const mutation = useMutation({
    mutationFn: async (values: Values) => {
      if (editor.kind === "league") {
        const league = await leagueApi.save(
          { name: values.name, location: values.location },
          editor.value?.id,
        );
        await client.invalidateQueries({ queryKey: ["leagues"] });
        select(league.id);
      } else {
        await leagueApi.saveTournament(
          editor.leagueId,
          {
            name: values.name,
            season: values.season,
            startsAt: values.startsAt || undefined,
            endsAt: values.endsAt || undefined,
          },
          editor.value?.id,
        );
        await client.invalidateQueries({ queryKey: ["tournaments"] });
      }
    },
    retry: false,
    networkMode: "always",
  });
  const submit = handleSubmit(async (values) => {
    if (tournament && values.startsAt && values.endsAt && Date.parse(values.endsAt) < Date.parse(values.startsAt)) {
      setError("endsAt", { message: "End must be on or after the start." });
      return;
    }
    try {
      await mutation.mutateAsync(values);
      onDone();
    } catch (error) {
      setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "Could not save. Please try again.",
      });
    } finally {
      mutation.reset();
    }
  });
  return (
    <View style={styles.form}>
      <AuthField
        control={control}
        name="name"
        label={tournament ? "Tournament name" : "League name"}
        placeholder={tournament ? "Summer Cup" : "Sunday Smash League"}
        maxLength={150}
        editable={!isSubmitting}
        rules={{
          validate: (value) => Boolean(value.trim()) || "Enter a name.",
          maxLength: { value: 150, message: "Use up to 150 characters." },
        }}
      />
      {tournament ? (
        <AuthField
          control={control}
          name="season"
          label="Season"
          placeholder="2026"
          maxLength={50}
          editable={!isSubmitting}
          rules={{
            validate: (value) => Boolean(value.trim()) || "Enter a season.",
          }}
        />
      ) : (
        <AuthField
          control={control}
          name="location"
          label="Location (optional)"
          placeholder="Kathmandu"
          maxLength={200}
          editable={!isSubmitting}
        />
      )}
      {tournament ? (["startsAt", "endsAt"] as const).map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <DateTimeField
              label={name === "startsAt" ? "Start (optional)" : "End (optional)"}
              value={field.value}
              onChange={(value) => {
                clearErrors("endsAt");
                field.onChange(value);
              }}
              disabled={isSubmitting}
              clearable={!edition?.[name]}
              displayTimezone={edition?.timezone ?? "Asia/Kathmandu"}
              error={fieldState.error?.message}
            />
          )}
        />
      )) : null}
      <Text style={styles.note}>
        {tournament
          ? "New tournaments start as drafts."
          : "Cricket leagues are currently supported."}
      </Text>
      {errors.root?.server ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errors.root.server.message}
        </Text>
      ) : null}
      <ActionButton
        loading={isSubmitting}
        onPress={async () => {
          if (inFlight.current) return;
          inFlight.current = true;
          try {
            await submit();
          } finally {
            inFlight.current = false;
          }
        }}
      >
        {isSubmitting
          ? "Saving…"
          : editor.value
            ? "Save changes"
            : tournament
              ? "Create tournament"
              : "Create league"}
      </ActionButton>
    </View>
  );
}
const styles = StyleSheet.create({
  form: { gap: 14 },
  note: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  error: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.label,
    fontSize: 14,
    lineHeight: 20,
  },
});
