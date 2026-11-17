import { ActionButton } from "@/components/action-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { theme } from "@/constants/theme";
import { useSelectedLeague } from "@/features/leagues/hooks";
import { Shirt } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { scoring, signed } from "./data";
import { QueryState } from "./query-state";
import { LeagueChips, dashboardStyles as shared } from "./ui";

const players = [
  { name: "A. Rao", team: "Hawks", color: "#2f6bff", price: 11.5 },
  { name: "S. Khan", team: "Titans", color: "#ff7a1a", price: 10 },
  { name: "M. Joshi", team: "Vipers", color: "#a02cff", price: 9.5 },
  { name: "R. Thapa", team: "Wolves", color: "#e8312f", price: 8.5 },
  { name: "D. Silva", team: "Rebels", color: "#12b5cb", price: 8 },
  { name: "K. Lee", team: "Hawks", color: "#2f6bff", price: 7.5 },
  { name: "T. Novak", team: "Titans", color: "#ff7a1a", price: 6.5 },
];
const stat = (player: number, rule: number) => ((player + 2) * (rule + 3)) % 7;
const points = (player: number) =>
  scoring.Cricket.reduce(
    (total, [, factor], rule) => total + stat(player, rule) * factor,
    0,
  );

export function SquadScreen() {
  const { query, leagues, league, select } = useSelectedLeague();
  const key = league?.id ?? "demo";
  const [selections, setSelections] = useState<
    Record<string, { captain: number; vice: number }>
  >({});
  const { captain, vice } = selections[key] ?? { captain: 1, vice: 0 };
  const [detail, setDetail] = useState<number | null>(null);
  const [saved, setSaved] = useState("");
  const total = players.reduce(
    (sum, _, index) => sum + points(index) * (captain === index ? 2 : 1),
    0,
  );
  const choose = (role: "captain" | "vice") => {
    if (detail === null) return;
    const next = { captain, vice, [role]: detail };
    if (role === "captain" && next.vice === detail) next.vice = captain;
    if (role === "vice" && next.captain === detail) next.captain = vice;
    setSelections((current) => ({ ...current, [key]: next }));
    setDetail(null);
    setSaved("");
  };
  return (
    <View style={shared.screen}>
      <ScrollView contentContainerStyle={shared.scroll}>
        <LeagueChips
          items={leagues}
          selected={league?.id}
          onSelect={(id) => {
            select(id);
            setSaved("");
          }}
        />
        {query.error ? (
          <QueryState
            error={query.error}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : null}
        <Text style={[shared.body, styles.note]}>
          Sample squad · local preview only. Player selection and scoring are
          not connected yet.
        </Text>
        <View style={styles.budget}>
          {[
            [String(total), "Round pts"],
            [
              (
                65 - players.reduce((sum, player) => sum + player.price, 0)
              ).toFixed(1),
              "Budget left",
            ],
            ["2", "Changes left"],
          ].map(([value, label]) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.pitch}>
          <View pointerEvents="none" style={styles.stripes}>
            {Array.from({ length: 10 }, (_, i) => (
              <View
                key={i}
                style={[styles.stripe, i % 2 === 0 && styles.alt]}
              />
            ))}
          </View>
          <View pointerEvents="none" style={styles.midline} />
          <View pointerEvents="none" style={styles.circle} />
          {[
            [0, 1],
            [2, 3, 4],
            [5, 6],
          ].map((row, index) => (
            <View key={index} style={styles.pitchRow}>
              {row.map((i) => (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={`${players[i].name}, ${points(i) * (captain === i ? 2 : 1)} sample points${captain === i ? ", captain" : vice === i ? ", vice-captain" : ""}`}
                  onPress={() => setDetail(i)}
                  style={styles.player}
                >
                  <Shirt
                    size={46}
                    strokeWidth={1.5}
                    color={players[i].color}
                    fill={players[i].color}
                  />
                  {captain === i || vice === i ? (
                    <View style={[styles.cap, vice === i && styles.vice]}>
                      <Text style={styles.capText}>
                        {captain === i ? "C" : "V"}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.plate}>
                    <Text style={styles.playerName}>{players[i].name}</Text>
                    <Text style={styles.playerPoints}>
                      {points(i) * (captain === i ? 2 : 1)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
        <Text style={[shared.body, styles.note]}>
          Tap a player to see their sample points and set the captain (double
          points) or vice-captain.
        </Text>
        <ActionButton
          onPress={() =>
            setSaved(
              "Squad preview saved for this session. No changes were sent to the server.",
            )
          }
        >
          Save preview
        </ActionButton>
        {saved ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[shared.body, styles.note]}
          >
            {saved}
          </Text>
        ) : null}
      </ScrollView>
      <BottomSheet
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail !== null ? players[detail].name : "Player"}
        description={
          detail !== null
            ? `${players[detail].team} · Price ${players[detail].price.toFixed(1)} · Sample stats`
            : ""
        }
      >
        {detail !== null ? (
          <>
            {scoring.Cricket.map(([label, factor], rule) => (
              <View key={label} style={styles.breakdown}>
                <Text style={styles.breakLabel}>{label}</Text>
                <Text style={styles.breakStat}>
                  {stat(detail, rule)} × {signed(factor)}
                </Text>
                <Text style={styles.breakPoints}>
                  {signed(stat(detail, rule) * factor)}
                </Text>
              </View>
            ))}
            <View style={styles.breakdown}>
              <Text style={styles.breakLabel}>
                Total{captain === detail ? " (captain ×2)" : ""}
              </Text>
              <Text style={styles.breakPoints}>
                {points(detail) * (captain === detail ? 2 : 1)}
              </Text>
            </View>
            <ActionButton onPress={() => choose("captain")}>
              Make captain
            </ActionButton>
            <ActionButton variant="secondary" onPress={() => choose("vice")}>
              Make vice-captain
            </ActionButton>
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}
const { colors, fonts } = theme;
const styles = StyleSheet.create({
  note: { marginVertical: 14, fontSize: 13 },
  budget: { flexDirection: "row", gap: 10, marginBottom: 12 },
  stat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
  },
  statValue: { fontFamily: fonts.display, fontSize: 30, color: colors.accent },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  pitch: {
    borderRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    overflow: "hidden",
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.pitch,
  },
  stripes: { ...StyleSheet.absoluteFill },
  stripe: { flex: 1, backgroundColor: colors.pitch },
  alt: { backgroundColor: colors.pitchAlternate },
  midline: {
    position: "absolute",
    top: "50%",
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: "#F6F4E84D",
  },
  circle: {
    position: "absolute",
    width: 84,
    height: 84,
    top: "50%",
    left: "50%",
    marginTop: -42,
    marginLeft: -42,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "#F6F4E84D",
  },
  pitchRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 14,
  },
  player: { width: 84, minHeight: 92, alignItems: "center" },
  cap: {
    position: "absolute",
    top: -5,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  vice: { backgroundColor: colors.text },
  capText: { fontFamily: fonts.display, fontSize: 13, color: colors.ink },
  plate: {
    marginTop: 3,
    width: 76,
    overflow: "hidden",
    borderRadius: 6,
    borderBottomWidth: 2,
    borderColor: colors.border,
  },
  playerName: {
    fontFamily: fonts.label,
    fontSize: 11,
    paddingVertical: 4,
    backgroundColor: colors.text,
    color: colors.ink,
    textAlign: "center",
  },
  playerPoints: {
    fontFamily: fonts.display,
    fontSize: 15,
    paddingVertical: 3,
    backgroundColor: colors.background,
    color: colors.accent,
    textAlign: "center",
  },
  breakdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: colors.border,
  },
  breakLabel: {
    flex: 1,
    fontFamily: fonts.label,
    fontSize: 15,
    color: colors.text,
  },
  breakStat: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  breakPoints: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.accent,
  },
});
