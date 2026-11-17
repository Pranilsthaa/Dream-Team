import { ActionButton } from "@/components/action-button";
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
import { useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

export type LeagueEditor =
  | { kind: "league"; value?: League }
  | { kind: "tournament"; leagueId: string; value?: Tournament };
type Values = { name: string; location: string; season: string };

export function LeagueForm({
  editor,
  onDone,
}: {
  editor: LeagueEditor;
  onDone: () => void;
}) {
  const inFlight = useRef(false);
  const tournament = editor.kind === "tournament";
  const client = useQueryClient();
  const select = useLeagueSelection((state) => state.select);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      name: editor.value?.name ?? "",
      location: editor.kind === "league" ? (editor.value?.location ?? "") : "",
      season:
        editor.kind === "tournament" ? (editor.value?.season ?? "2026") : "",
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
          { name: values.name, season: values.season },
          editor.value?.id,
        );
        await client.invalidateQueries({ queryKey: ["tournaments"] });
      }
    },
    retry: false,
    networkMode: "always",
  });
  const submit = handleSubmit(async (values) => {
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
