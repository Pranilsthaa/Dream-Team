import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";

const palette = [
  { name: "Forest", color: theme.colors.background },
  { name: "Panel", color: theme.colors.surface },
  { name: "Cream", color: theme.colors.field },
  { name: "Lime", color: theme.colors.accent },
];

/** Temporary review surface; checkpoint 2 replaces this with the login screen. */
export function FoundationScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>DREAM-TEAM / FOUNDATION</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Your game.{"\n"}Your league.
          </Text>
          <Text style={styles.description}>
            Create a fantasy league for any sport or game. Set the rules, build
            your squad, and compete together.
          </Text>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>The starting lineup.</Text>
            <Text style={styles.panelCopy}>
              Forest greens. Cream fields. A little lime. One shared theme for
              every league.
            </Text>
            <View style={styles.palette}>
              {palette.map(({ name, color }) => (
                <View key={name} style={styles.swatchGroup}>
                  <View style={[styles.swatch, { backgroundColor: color }]} />
                  <Text style={styles.swatchLabel}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.note}>CHECKPOINT 01 · THEME PREVIEW</Text>
          <Text style={styles.caption}>
            Login and sign-up arrive in the next checkpoint.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { colors, fonts, space, radius, size } = theme;
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: space.xl },
  content: {
    width: "100%",
    maxWidth: size.contentMaxWidth,
    alignSelf: "center",
    gap: space.xl,
  },
  eyebrow: {
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.accent,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 55,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: colors.textMuted,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    padding: space.xl,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    gap: space.md,
  },
  panelTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  panelCopy: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  palette: { flexDirection: "row", gap: space.md, marginTop: space.sm },
  swatchGroup: { flex: 1, gap: space.sm },
  swatch: {
    height: 48,
    borderRadius: radius.small,
    borderWidth: 2,
    borderColor: colors.border,
  },
  swatchLabel: { fontFamily: fonts.label, fontSize: 12, color: colors.text },
  note: {
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.accent,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
