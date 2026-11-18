import { useRef } from "react";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DateTimeField } from "@/components/date-time-field";
import { ActionButton } from "@/components/action-button";
import { theme } from "@/constants/theme";
import { apiClient } from "@/lib/api/client";
import { AuthField } from "@/screens/auth/auth-field";
import { dashboardStyles as shared, LeagueChips } from "@/screens/dashboard/ui";

type Values = Record<string, string | string[]>;
type Choice = { id: string; name: string };

export type SetupAction = {
  title: string;
  description?: string;
  method: "post" | "put" | "patch" | "delete";
  path: string;
  submitLabel?: string;
  fields?: Field[];
  body?: (values: Values) => object;
};

export type Field = {
  key: string;
  label: string;
  initial?: string;
  choices?: Choice[];
  multiple?: { min: number; max: number };
  maxLength?: number;
  number?: boolean;
  dateTime?: { displayTimezone: string };
  optional?: boolean;
  validate?: (value: string) => boolean | string;
};

export function SetupForm({ action, onSaved, validate }: {
  action: SetupAction;
  onSaved: () => void;
  validate?: (values: Values) => string | undefined;
}) {
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const mutation = useMutation({
    mutationFn: async (values: Values) => {
      await apiClient.request({ method: action.method, url: action.path, data: action.body?.(values) });
    },
    retry: false,
    networkMode: "always",
  });
  const form = useForm<Values>({
    defaultValues: Object.fromEntries((action.fields ?? []).map((field) => [
      field.key, field.multiple ? [] : field.initial ?? "",
    ])),
  });
  const submit = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    const invalid = validate?.(values);
    if (invalid) {
      form.setError("root", { message: invalid });
      return;
    }
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Could not save changes." });
      return;
    }
    await queryClient.invalidateQueries({
      predicate: (query) => ["match-setup", "staff-schedule", "lineup-status", "tournaments"].includes(String(query.queryKey[0])),
    });
    onSaved();
  });
  const busy = form.formState.isSubmitting;
  const error = form.formState.errors.root?.message;
  return (
    <View style={styles.form}>
      {action.fields?.map((field) => <SetupField key={field.key} field={field} form={form} busy={busy} />)}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <ActionButton loading={busy} onPress={async () => {
        if (submitting.current) return;
        submitting.current = true;
        try { await submit(); } finally { submitting.current = false; }
      }}>
        {action.submitLabel ?? "Save"}
      </ActionButton>
    </View>
  );
}

function SetupField({ field, form, busy }: { field: Field; form: UseFormReturn<Values>; busy: boolean }) {
  if (field.dateTime) {
    return (
      <Controller
        control={form.control}
        name={field.key}
        rules={{ required: "Choose a date and time." }}
        render={({ field: input, fieldState }) => (
          <DateTimeField
            label={field.label}
            value={String(input.value)}
            onChange={input.onChange}
            displayTimezone={field.dateTime?.displayTimezone}
            disabled={busy}
            error={fieldState.error?.message}
          />
        )}
      />
    );
  }
  if (!field.choices) {
    return (
      <AuthField
        control={form.control}
        name={field.key}
        label={field.label}
        editable={!busy}
        autoCapitalize="none"
        maxLength={field.maxLength}
        keyboardType={field.number ? "number-pad" : "default"}
        rules={{ validate: (input) => {
          const value = String(input).trim();
          if (!value) return field.optional || "Required.";
          return field.validate?.(value) ?? true;
        } }}
      />
    );
  }
  const choices = field.choices;
  return (
    <Controller
      control={form.control}
      name={field.key}
      rules={{ validate: (value) => {
        if (field.multiple && Array.isArray(value)) {
          if (value.length < field.multiple.min) return `Select at least ${field.multiple.min} players.`;
          return (value.length <= field.multiple.max && value.every((id) => choices.some((item) => item.id === id)))
            || "Review the selected players.";
        }
        return choices.some((item) => item.id === value) || "Select an option.";
      } }}
      render={({ field: input, fieldState }) => {
        const selected = Array.isArray(input.value) ? input.value : [input.value];
        return (
          <View>
            <Text style={shared.body}>
              {field.label}{field.multiple ? ` · ${selected.length}/${field.multiple.max}` : ""}
            </Text>
            <LeagueChips
              items={choices}
              selected={field.multiple ? selected : selected[0]}
              onSelect={(id) => {
                if (busy) return;
                if (!field.multiple) input.onChange(id);
                else if (selected.includes(id)) input.onChange(selected.filter((item) => item !== id));
                else if (selected.length < field.multiple.max) input.onChange([...selected, id]);
              }}
            />
            {fieldState.error ? <Text accessibilityRole="alert" style={styles.error}>{fieldState.error.message}</Text> : null}
          </View>
        );
      }}
    />
  );
}

export function integerBetween(min: number, max: number) {
  return (value: string) => (
    /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max
  ) || `Enter a whole number from ${min} to ${max}.`;
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  error: { color: theme.colors.warning, fontFamily: theme.fonts.label, fontSize: 14 },
});
