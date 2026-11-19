import { useRef, useState, type ComponentRef } from "react";
import type { ScrollView } from "react-native";

import { LeagueChips } from "@/screens/dashboard/ui";
import { MatchCentreTabScroll, useMatchCentre } from "./match-centre-screen";
import { NoticeBanner, PageHeader } from "./match-centre-ui";
import { RosterPanel, type RosterView } from "./roster-panel";

const views: { id: RosterView; name: string }[] = [
  { id: "roster", name: "Roster" },
  { id: "teams", name: "League teams" },
  { id: "players", name: "Players" },
];

export function TeamsScreen() {
  const { canManage, wide, openEditor } = useMatchCentre();
  const [view, setView] = useState<RosterView>("roster");
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });
  const activeView = canManage ? view : "roster";

  return (
    <MatchCentreTabScroll scrollRef={scrollRef}>
      {(tournament) => (
        <>
          <PageHeader
            title="Teams & players"
            subtitle={`${tournament.name} · ${tournament.season}`}
            wide={wide}
          />
          {canManage ? (
            <LeagueChips
              items={views}
              selected={activeView}
              onSelect={(id) => {
                const selected = views.find((item) => item.id === id);
                if (selected && selected.id !== activeView) {
                  setView(selected.id);
                  scrollToTop();
                }
              }}
            />
          ) : (
            <NoticeBanner title="Read-only roster">
              Ask a league owner or admin to change squads.
            </NoticeBanner>
          )}
          <RosterPanel
            key={tournament.id}
            view={activeView}
            tournament={tournament}
            canManage={canManage}
            onAction={openEditor}
            onNavigate={scrollToTop}
          />
        </>
      )}
    </MatchCentreTabScroll>
  );
}
