import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { CalendarDays } from "lucide-react-native";
import { createElement, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { ActionButton } from "./action-button";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  clearable?: boolean;
  displayTimezone?: string;
  error?: string;
};

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DateTimeField({ label, value, onChange, disabled, clearable, displayTimezone, error }: Props) {
  const [editing, setEditing] = useState<{ mode: "date" | "time" | "datetime"; date: Date } | null>(null);
  const parsed = new Date(value);
  const selected = Number.isFinite(parsed.getTime()) ? parsed : null;
  const localTimezone = dateTimeFormat.resolvedOptions().timeZone;
  const showTournamentTime = selected && displayTimezone && displayTimezone !== localTimezone;

  function accept(date: Date) {
    setEditing(null);
    onChange(date.toISOString());
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label} · {localTimezone}</Text>
      {Platform.OS === "web" ? createElement("input", {
        type: "datetime-local",
        "aria-label": label,
        "aria-invalid": Boolean(error),
        disabled,
        value: selected ? toLocalInputValue(selected) : "",
        onChange: (event) => {
          const chosen = event.currentTarget.value;
          if (!chosen && clearable) onChange("");
          if (chosen) {
            const date = new Date(chosen);
            if (Number.isFinite(date.getTime())) accept(date);
          }
        },
        style: {
          boxSizing: "border-box",
          width: "100%",
          minHeight: 48,
          borderRadius: 12,
          border: `2px solid ${theme.colors.border}`,
          padding: "8px 12px",
          color: theme.colors.ink,
          backgroundColor: theme.colors.field,
          fontFamily: theme.fonts.label,
          fontSize: 16,
        },
      }) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selected ? `${label}, ${dateTimeFormat.format(selected)}` : `Set ${label.toLowerCase()}`}
          accessibilityState={{ disabled, expanded: editing !== null }}
          disabled={disabled}
          onPress={() => setEditing({ mode: Platform.OS === "android" ? "date" : "datetime", date: selected ?? new Date() })}
          style={[styles.control, disabled && styles.disabled]}
        >
          <CalendarDays size={19} color={theme.colors.ink} />
          <Text style={styles.value}>{selected ? dateTimeFormat.format(selected) : "Choose date and time"}</Text>
        </Pressable>
      )}
      {editing && !disabled && Platform.OS === "android" ? (
        <DateTimePicker
          key={editing.mode}
          mode={editing.mode}
          value={editing.date}
          presentation="dialog"
          themeVariant="dark"
          accentColor={theme.colors.accent}
          onDismiss={() => setEditing(null)}
          onValueChange={(_, date) => {
            if (editing.mode === "date") {
              setEditing({ mode: "time", date });
            } else {
              accept(new Date(Math.floor(date.getTime() / 60_000) * 60_000));
            }
          }}
        />
      ) : null}
      {editing && !disabled && Platform.OS === "ios" ? (
        <View style={styles.field}>
          <DateTimePicker
            value={editing.date}
            mode="datetime"
            display="compact"
            themeVariant="dark"
            accentColor={theme.colors.accent}
            onValueChange={(_, date) => setEditing({ mode: "datetime", date })}
          />
          <ActionButton onPress={() => accept(editing.date)}>Set date and time</ActionButton>
          <ActionButton variant="secondary" onPress={() => setEditing(null)}>Cancel</ActionButton>
        </View>
      ) : null}
      {showTournamentTime ? (
        <Text style={styles.label}>
          {new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: displayTimezone,
          }).format(selected)} · {displayTimezone}
        </Text>
      ) : null}
      {clearable && value && !disabled && !editing ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${label.toLowerCase()}`} onPress={() => onChange("")} style={styles.clear}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function toLocalInputValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { color: theme.colors.textMuted, fontFamily: theme.fonts.label, fontSize: 13 },
  control: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.field,
  },
  disabled: { opacity: 0.6 },
  value: { flex: 1, color: theme.colors.ink, fontFamily: theme.fonts.label, fontSize: 16 },
  clear: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingRight: 12 },
  clearText: { color: theme.colors.accent, fontFamily: theme.fonts.label },
  error: { color: theme.colors.warning, fontFamily: theme.fonts.label, fontSize: 13 },
});
