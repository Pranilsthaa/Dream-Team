import { ActionButton } from "@/components/action-button";
import { useLeagues } from "@/features/leagues/hooks";
import { QueryState } from "@/screens/dashboard/query-state";
import {
  SectionHeading,
  dashboardStyles as shared,
} from "@/screens/dashboard/ui";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export function WorkspaceScreen() {
  const leagues = useLeagues();
  if (leagues.data) {
    const managesLeague = leagues.data.pages.some(
      (page) => page.data.length > 0,
    );
    return <Redirect href={managesLeague ? "/manage-matches" : "/home"} />;
  }
  return (
    <SafeAreaView style={[shared.screen, shared.scroll]}>
      <SectionHeading>Opening Dream-Team</SectionHeading>
      <QueryState
        loading={leagues.isFetching}
        empty="Waiting for a connection."
        error={leagues.error}
        retry={() => void leagues.refetch()}
      />
      <ActionButton variant="secondary" onPress={() => router.replace("/home")}>
        Open fantasy dashboard
      </ActionButton>
    </SafeAreaView>
  );
}
