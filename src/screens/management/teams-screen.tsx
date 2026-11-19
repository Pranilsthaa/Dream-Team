import { MatchCentreTabScroll, useMatchCentre } from "./match-centre-screen";
import { NoticeBanner, PageHeader } from "./match-centre-ui";
import { RosterPanel } from "./roster-panel";

export function TeamsScreen() {
  const { canManage, wide, openEditor } = useMatchCentre();

  return (
    <MatchCentreTabScroll>
      {(tournament) => (
        <>
          <PageHeader
            title="Teams & players"
            subtitle={`${tournament.name} · ${tournament.season}`}
            wide={wide}
          />
          {!canManage ? (
            <NoticeBanner title="Read-only for staff.">
              Ask an owner or admin to change squads.
            </NoticeBanner>
          ) : null}
          <RosterPanel
            key={tournament.id}
            tournament={tournament}
            canManage={canManage}
            onAction={openEditor}
            defaultExpanded
          />
        </>
      )}
    </MatchCentreTabScroll>
  );
}
