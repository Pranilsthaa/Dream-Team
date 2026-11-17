import { ActionButton } from "@/components/action-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { theme } from "@/constants/theme";
import { useSelectedLeague, useTournaments } from "@/features/leagues/hooks";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LeagueForm, type LeagueEditor } from "./league-form";
import { QueryState } from "./query-state";
import {
  Card,
  LeagueChips,
  SectionHeading,
  dashboardStyles as shared,
} from "./ui";

export function LeaguesScreen() {
  const { session } = useAuth();
  const { query, leagues, league, select } = useSelectedLeague();
  const tournaments = useTournaments(league?.id);
  const editions = tournaments.data?.pages.flatMap((page) => page.data) ?? [];
  const [editor, setEditor] = useState<LeagueEditor | null>(null);
  const owner = league?.ownerId === session.user?.id;
  return (
    <View style={shared.screen}>
      <ScrollView
        contentContainerStyle={shared.scroll}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
              if (league) void tournaments.refetch();
            }}
            tintColor={theme.colors.accent}
          />
        }
      >
        <SectionHeading
          action="+ Create"
          onPress={() => setEditor({ kind: "league" })}
        >
          My leagues
        </SectionHeading>
        {!query.data ? (
          <QueryState
            loading={query.isPending && query.fetchStatus !== "paused"}
            error={query.error}
            empty="Waiting for a connection."
            retry={() => {
              void query.refetch();
            }}
          />
        ) : null}
        {query.data && !leagues.length ? (
          <QueryState empty="No leagues yet. Create your first league to get started." />
        ) : null}
        {query.data && query.error ? (
          <QueryState
            error={query.error}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : null}
        <LeagueChips items={leagues} selected={league?.id} onSelect={select} />
        {league ? (
          <Card style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={shared.cardTitle}>{league.name}</Text>
              <Text style={styles.badge}>Cricket</Text>
            </View>
            <Text style={shared.body}>
              {league.location || "No location set"}
            </Text>
            <Text style={shared.body}>
              {owner ? "You own this league" : "League staff"}
            </Text>
            {owner ? (
              <ActionButton
                variant="secondary"
                onPress={() => setEditor({ kind: "league", value: league })}
              >
                Edit league
              </ActionButton>
            ) : null}
          </Card>
        ) : null}
        {query.hasNextPage ? (
          <ActionButton
            variant="secondary"
            loading={query.isFetchingNextPage}
            onPress={() => {
              void query.fetchNextPage();
            }}
          >
            More leagues
          </ActionButton>
        ) : null}
        {league ? (
          <>
            <SectionHeading
              action={owner ? "+ Create" : undefined}
              onPress={() =>
                setEditor({ kind: "tournament", leagueId: league.id })
              }
            >
              Tournaments
            </SectionHeading>
            {!tournaments.data ? (
              <QueryState
                loading={
                  tournaments.isPending && tournaments.fetchStatus !== "paused"
                }
                error={tournaments.error}
                empty="Waiting for a connection."
                retry={() => {
                  if (league) void tournaments.refetch();
                }}
              />
            ) : null}
            {tournaments.data && !editions.length ? (
              <QueryState empty="No tournaments yet. Each season can have its own edition." />
            ) : null}
            {tournaments.data && tournaments.error ? (
              <QueryState
                error={tournaments.error}
                retry={() => {
                  if (league) void tournaments.refetch();
                }}
              />
            ) : null}
            <View style={styles.list}>
              {editions.map((edition) => (
                <Card key={edition.id} style={styles.card}>
                  <View style={styles.titleRow}>
                    <Text style={shared.cardTitle}>{edition.name}</Text>
                    <Text style={styles.badge}>{edition.status}</Text>
                  </View>
                  <Text style={shared.body}>
                    Season {edition.season} · {edition.timezone}
                  </Text>
                  {edition.startsAt ? (
                    <Text style={shared.body}>
                      Starts {new Date(edition.startsAt).toLocaleString()}
                    </Text>
                  ) : (
                    <Text style={shared.body}>Start date not set</Text>
                  )}
                  {edition.endsAt ? (
                    <Text style={shared.body}>
                      Ends {new Date(edition.endsAt).toLocaleString()}
                    </Text>
                  ) : null}
                  {owner && edition.status === "draft" ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setEditor({
                          kind: "tournament",
                          leagueId: league.id,
                          value: edition,
                        })
                      }
                      style={styles.edit}
                    >
                      <Text style={styles.editText}>Edit draft</Text>
                    </Pressable>
                  ) : null}
                </Card>
              ))}
            </View>
            {tournaments.hasNextPage ? (
              <ActionButton
                variant="secondary"
                loading={tournaments.isFetchingNextPage}
                onPress={() => {
                  void tournaments.fetchNextPage();
                }}
              >
                More tournaments
              </ActionButton>
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <BottomSheet
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={
          editor
            ? `${editor.value ? "Edit" : "Create"} ${editor.kind}`
            : "Create league"
        }
        description={
          editor?.kind === "tournament"
            ? "Create an edition for this league."
            : "Set up your league and add tournament editions."
        }
      >
        {editor ? (
          <LeagueForm
            key={`${editor.kind}-${editor.value?.id ?? "new"}`}
            editor={editor}
            onDone={() => setEditor(null)}
          />
        ) : null}
      </BottomSheet>
    </View>
  );
}
const { colors, fonts } = theme;
const styles = StyleSheet.create({
  card: { gap: 10, marginBottom: 12 },
  list: { gap: 2 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    color: colors.ink,
    backgroundColor: colors.accent,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    fontFamily: fonts.label,
    fontSize: 11,
    textTransform: "capitalize",
  },
  edit: { minHeight: 44, justifyContent: "center" },
  editText: { fontFamily: fonts.label, fontSize: 14, color: colors.accent },
});
