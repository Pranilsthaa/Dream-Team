import { Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import Svg, { Polygon } from "react-native-svg";

import { theme } from "@/constants/theme";
import type { Fixture } from "@/features/leagues/schedule";
import { Card } from "@/screens/dashboard/ui";

export type StatusTone = "default" | "live" | "warning" | "ok";

export const TEAM_PALETTE = [
  "#2f6bff",
  "#ff7a1a",
  "#a02cff",
  "#e8312f",
  "#12b5cb",
  "#e0b020",
] as const;

export function teamColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return TEAM_PALETTE[hash % TEAM_PALETTE.length];
}

export function formatRoleLabel(role?: "owner" | "admin" | "scorer"): string {
  return role ?? "staff";
}

export function fixtureStatusTone(status: Fixture["status"]): StatusTone {
  if (status === "live") return "live";
  if (status === "cancelled") return "warning";
  return "default";
}

export function formatFixtureDateTime(iso: string, timezone?: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

export function BrandMark() {
  return (
    <View style={styles.brand}>
      <Svg width={24} height={27} viewBox="0 0 24 27" accessible={false}>
        <Polygon
          points="0,7.8 4.8,7.8 4.8,3 19.2,3 19.2,7.8 24,7.8 24,22.2 19.2,22.2 19.2,27 4.8,27 4.8,22.2 0,22.2"
          fill={theme.colors.accentShadow}
        />
        <Polygon
          points="0,4.8 4.8,4.8 4.8,0 19.2,0 19.2,4.8 24,4.8 24,19.2 19.2,19.2 19.2,24 4.8,24 4.8,19.2 0,19.2"
          fill={theme.colors.accent}
        />
      </Svg>
      <Text style={styles.brandText}>Dream-Team</Text>
    </View>
  );
}

export function RoleBadge({ role }: { role?: "owner" | "admin" | "scorer" }) {
  const elevated = role === "owner" || role === "admin";
  return (
    <View
      style={[
        styles.roleBadge,
        elevated ? styles.roleElevated : styles.roleStaff,
      ]}
    >
      <Text style={styles.roleBadgeText}>{formatRoleLabel(role)}</Text>
    </View>
  );
}

export function StatusPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === "live" && styles.pillLive,
        tone === "warning" && styles.pillWarning,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          tone === "live" && styles.pillLiveText,
          tone === "warning" && styles.pillWarningText,
          tone === "ok" && styles.pillOkText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  wide?: boolean;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderCopy}>
        <Text
          accessibilityRole="header"
          style={[styles.pageTitle, wide && styles.pageTitleWide]}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.pageAction}>{action}</View> : null}
    </View>
  );
}

export function NoticeBanner({
  title,
  children,
}: {
  title?: string;
  children: string;
}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeBody}>
        {title ? <Text style={styles.noticeTitle}>{title} </Text> : null}
        {children}
      </Text>
    </View>
  );
}

export function TeamDot({ seed }: { seed: string }) {
  return <View style={[styles.teamDot, { backgroundColor: teamColor(seed) }]} />;
}

export function TeamBadge({
  seed,
  label,
  size = 42,
}: {
  seed: string;
  label: string;
  size?: number;
}) {
  const short = (label.trim().slice(0, 1) || "T").toUpperCase();
  return (
    <View
      style={[
        styles.teamBadge,
        {
          width: size,
          height: size,
          backgroundColor: teamColor(seed),
        },
      ]}
    >
      <Text style={styles.teamBadgeText}>{short}</Text>
    </View>
  );
}

export function MatchTitle({
  team1,
  team2,
  compact = false,
}: {
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  compact?: boolean;
}) {
  const textStyle = compact ? styles.matchNameCompact : styles.matchName;
  return (
    <View style={styles.matchRow}>
      <View style={styles.matchSide}>
        <TeamDot seed={team1.id || team1.name} />
        <Text style={textStyle}>{team1.name}</Text>
      </View>
      <Text style={styles.matchVersus}>v</Text>
      <View style={styles.matchSide}>
        <TeamDot seed={team2.id || team2.name} />
        <Text style={textStyle}>{team2.name}</Text>
      </View>
    </View>
  );
}

export function ChecklistRow({
  done,
  title,
  subtitle,
  right,
  onPress,
}: {
  done: boolean;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: done }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.checkRow,
        pressed && styles.checkRowPressed,
      ]}
    >
      <View style={[styles.checkCircle, done && styles.checkCircleDone]}>
        {done ? (
          <Check size={16} strokeWidth={3} color={theme.colors.ink} />
        ) : null}
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkTitle}>{title}</Text>
        {subtitle ? <Text style={styles.checkSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

export function StatTile({
  value,
  label,
  style,
}: {
  value: string | number;
  label: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.statTile, style]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const pulseFrames = {
  "0%": { opacity: 1 },
  "50%": { opacity: 0.25 },
  "100%": { opacity: 1 },
};

export function LivePulseDot({ style }: { style?: ViewStyle }) {
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseDot,
        style,
        {
          animationName: reducedMotion ? "none" : pulseFrames,
          animationDuration: 1200,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
        },
      ]}
    />
  );
}

export function ToastBanner({
  message,
  bottomOffset = 28,
}: {
  message: string | null;
  bottomOffset?: number;
}) {
  const reducedMotion = useReducedMotion();
  const visible = Boolean(message);
  return (
    <View
      pointerEvents="none"
      style={[styles.toastAnchor, { bottom: bottomOffset }]}
    >
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            opacity: visible ? 1 : 0,
            transform: [{ translateY: visible ? 0 : 10 }],
            transitionProperty: ["opacity", "transform"],
            transitionDuration: reducedMotion ? 0 : 200,
          },
        ]}
      >
        {message ? <Text style={styles.toastText}>{message}</Text> : null}
      </Animated.View>
    </View>
  );
}

export function EmptyCard({
  title,
  description,
  children,
}: {
  title?: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card style={styles.emptyCard}>
      {title ? <Text style={styles.emptyTitle}>{title}</Text> : null}
      <Text style={styles.emptyDescription}>{description}</Text>
      {children ? <View style={styles.emptyAction}>{children}</View> : null}
    </Card>
  );
}

const { colors, fonts } = theme;
const styles = StyleSheet.create({
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  brandText: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 26,
    color: colors.text,
  },
  roleBadge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleElevated: { backgroundColor: colors.accent },
  roleStaff: { backgroundColor: colors.warning },
  roleBadgeText: {
    fontFamily: fonts.label,
    fontSize: 11,
    lineHeight: 13,
    color: colors.ink,
    textTransform: "capitalize",
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.deep,
  },
  pillLive: { backgroundColor: colors.accent },
  pillWarning: { backgroundColor: colors.warning },
  pillText: {
    fontFamily: fonts.label,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  pillLiveText: { color: colors.ink },
  pillWarningText: { color: colors.ink },
  pillOkText: { color: colors.accent },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  pageHeaderCopy: { flexShrink: 1, minWidth: 180 },
  pageTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 36,
    color: colors.text,
  },
  pageTitleWide: { fontSize: 40, lineHeight: 44 },
  pageSubtitle: {
    marginTop: 5,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textMuted,
  },
  pageAction: { flexShrink: 0 },
  notice: {
    backgroundColor: colors.deep,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  noticeBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  noticeTitle: {
    fontFamily: fonts.label,
    color: colors.text,
  },
  teamDot: { width: 12, height: 12, borderRadius: 4 },
  teamBadge: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  teamBadgeText: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  matchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  matchSide: { flexDirection: "row", alignItems: "center", gap: 7 },
  matchName: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 27,
    color: colors.text,
  },
  matchNameCompact: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 23,
    color: colors.text,
  },
  matchVersus: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  checkRow: {
    width: "100%",
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.deep,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkRowPressed: { opacity: 0.88 },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: colors.footer,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkCircleDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkCopy: { flex: 1, minWidth: 0 },
  checkTitle: {
    fontFamily: fonts.label,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  checkSubtitle: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  statTile: {
    backgroundColor: colors.deep,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 34,
    color: colors.accent,
  },
  statLabel: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textMuted,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  toastAnchor: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 40,
  },
  toast: {
    maxWidth: 460,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.deep,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  toastText: {
    fontFamily: fonts.label,
    fontSize: 14,
    lineHeight: 18,
    color: colors.accent,
    textAlign: "center",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 18,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 25,
    color: colors.text,
    textAlign: "center",
  },
  emptyDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyAction: { marginTop: 8, minWidth: 180 },
});
