import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";

import { theme } from "@/constants/theme";

const players = [
  { name: "Nova", number: "07", color: "#3977ED", captain: false },
  { name: "Blaze", number: "10", color: "#FF883E", captain: true },
  { name: "Ace", number: "23", color: "#A967E9", captain: false },
  { name: "Pixel", number: "04", color: "#F1D16F", captain: false },
  { name: "Scout", number: "18", color: "#77CBD3", captain: false },
];
const easeOut = Easing.bezier(0.23, 1, 0.32, 1);
const entrance = FadeInDown.duration(240).easing(easeOut);
const fade = FadeIn.duration(160);

function Player({ player }: { player: (typeof players)[number] }) {
  return (
    <View style={styles.player}>
      <View style={styles.kit}>
        <Image
          source={require("@/assets/illustrations/jersey.svg")}
          tintColor={player.color}
          contentFit="contain"
          style={styles.jersey}
        />
        <View style={styles.jerseyStripe} />
        <Text style={styles.number}>{player.number}</Text>
        {player.captain ? (
          <View style={styles.captain}>
            <Text style={styles.captainText}>C</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.plate}>
        <Text style={styles.playerName}>{player.name}</Text>
      </View>
    </View>
  );
}

export function SquadPreview() {
  const reducedMotion = useReducedMotion();
  return (
    <View
      style={styles.ground}
      accessible
      accessibilityLabel="Illustration of a sample five-player fantasy squad with Blaze as captain."
    >
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.stripes}>
          {Array.from({ length: 12 }, (_, index) => (
            <View
              key={index}
              style={[styles.stripe, index % 2 === 0 && styles.alternateStripe]}
            />
          ))}
        </View>
        <View style={styles.boundary} />
        <View style={styles.centerLine} />
        <View style={styles.centerCircle} />
      </View>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>DREAM-TEAM</Text>
        <Text style={styles.previewLabel}>SQUAD PREVIEW</Text>
      </View>
      <View style={styles.tag}>
        <View style={styles.dot} />
        <Text style={styles.tagText}>Any game. Your rules.</Text>
      </View>
      <Animated.View
        entering={reducedMotion ? fade : entrance}
        style={styles.lineup}
      >
        <View style={styles.topRow}>
          {players.slice(0, 2).map((player) => (
            <Player key={player.name} player={player} />
          ))}
        </View>
        <View style={styles.bottomRow}>
          {players.slice(2).map((player) => (
            <Player key={player.name} player={player} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const { colors, fonts } = theme;
const styles = StyleSheet.create({
  ground: {
    height: 278,
    overflow: "hidden",
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    borderBottomWidth: 6,
    borderColor: colors.border,
    backgroundColor: colors.pitch,
  },
  stripes: { ...StyleSheet.absoluteFill, flexDirection: "row" },
  stripe: { flex: 1, backgroundColor: colors.pitch },
  alternateStripe: { backgroundColor: colors.pitchAlternate },
  boundary: {
    position: "absolute",
    top: 76,
    bottom: 12,
    left: 16,
    right: 16,
    borderRadius: 150,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#FFFFFF38",
  },
  centerLine: {
    position: "absolute",
    left: "50%",
    top: 80,
    bottom: 16,
    width: 1,
    backgroundColor: "#FFFFFF18",
  },
  centerCircle: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "#FFFFFF20",
    alignSelf: "center",
    top: 132,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  brand: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 1,
  },
  previewLabel: {
    fontFamily: fonts.label,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  tag: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.border,
    borderColor: "#FFFFFF24",
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  tagText: { fontFamily: fonts.label, fontSize: 13, color: colors.accent },
  lineup: { paddingHorizontal: 24, marginTop: 11, gap: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 30,
  },
  bottomRow: { flexDirection: "row", justifyContent: "space-around" },
  player: { alignItems: "center", width: 70 },
  kit: { width: 55, height: 47, alignItems: "center" },
  jersey: { width: 55, height: 47 },
  jerseyStripe: {
    position: "absolute",
    width: 25,
    height: 4,
    backgroundColor: "#FFFFFF88",
    bottom: 7,
  },
  number: {
    position: "absolute",
    top: 12,
    color: "#FFFFFF",
    fontFamily: fonts.display,
    fontSize: 17,
  },
  captain: {
    position: "absolute",
    top: -5,
    right: -8,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.text,
  },
  captainText: { fontFamily: fonts.display, fontSize: 13, color: colors.ink },
  plate: {
    width: 66,
    backgroundColor: colors.field,
    borderRadius: 5,
    borderBottomWidth: 3,
    borderColor: colors.border,
    paddingVertical: 3,
    marginTop: 3,
  },
  playerName: {
    fontFamily: fonts.label,
    fontSize: 11,
    textAlign: "center",
    color: colors.ink,
  },
});
