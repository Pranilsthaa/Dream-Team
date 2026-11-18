import { BottomSheet } from "@/components/bottom-sheet";
import { theme } from "@/constants/theme";
import { useLeagues } from "@/features/leagues/hooks";
import { useAuth } from "@/providers/auth-provider";
import { router } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { StatusBar } from "expo-status-bar";
import { ClipboardList } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DashboardIcon, type IconName } from "./icon";
import { Card, dashboardStyles as shared } from "./ui";

const tabs: { route: string; label: string; icon: IconName }[] = [
  { route: "home", label: "Home", icon: "home" },
  { route: "squad", label: "Squad", icon: "squad" },
  { route: "matches", label: "Matches", icon: "matches" },
  { route: "leagues", label: "Leagues", icon: "leagues" },
];

export function DashboardLayout() {
  const { top } = useSafeAreaInsets();
  const { session } = useAuth();
  const leagues = useLeagues();
  const managesLeague = leagues.data?.pages.some((page) => page.data.length > 0);
  const username = session.user?.username ?? "Captain";
  const [updatesOpen, setUpdatesOpen] = useState(false);
  return (
    <View style={[styles.outer, { paddingTop: top }]}>
      <StatusBar style="light" hidden={false} />
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your account"
            onPress={() => router.push("/account")}
            style={styles.avatar}
          >
            <Text style={styles.initial}>
              {username.slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
          <View style={styles.greeting}>
            <Text style={styles.small}>Welcome back</Text>
            <Text style={styles.name}>{username}</Text>
          </View>
          {managesLeague ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Match Manager"
              onPress={() => router.navigate("/manage-matches")}
              style={styles.bell}
            >
              <ClipboardList color={theme.colors.accent} size={22} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => setUpdatesOpen(true)}
            style={styles.bell}
          >
            <DashboardIcon name="bell" color={theme.colors.text} size={22} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
        <Tabs
          screenOptions={{
            headerShown: false,
            animation: "none",
            sceneStyle: { backgroundColor: theme.colors.background },
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.footer,
            tabBarStyle: {
              backgroundColor: theme.colors.deep,
              borderTopWidth: 2,
              borderTopColor: theme.colors.border,
            },
            tabBarLabelStyle: { fontFamily: theme.fonts.label, fontSize: 11 },
            tabBarItemStyle: { paddingTop: 6, paddingBottom: 4 },
          }}
        >
          {tabs.map((tab) => (
            <Tabs.Screen
              key={tab.route}
              name={tab.route}
              options={{
                title: tab.label,
                tabBarIcon: ({ color }) => (
                  <DashboardIcon
                    name={tab.icon}
                    color={
                      typeof color === "string" ? color : theme.colors.footer
                    }
                    size={22}
                  />
                ),
              }}
            />
          ))}
        </Tabs>
        <BottomSheet
          open={updatesOpen}
          onClose={() => setUpdatesOpen(false)}
          title="Sample updates"
          description="A preview of league notifications."
        >
          <Card>
            <Text style={shared.cardTitle}>Hawks v Titans is live</Text>
            <Text style={shared.body}>3 of your players are on the pitch.</Text>
          </Card>
          <Card>
            <Text style={shared.cardTitle}>Deadline in 2 hours</Text>
            <Text style={shared.body}>Lock in your captain for Round 5.</Text>
          </Card>
        </BottomSheet>
      </View>
    </View>
  );
}
const { colors, fonts } = theme;
const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.background },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: theme.size.contentMaxWidth,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatar: {
    width: 44,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.accent,
    borderBottomWidth: 3,
    borderColor: colors.accentShadow,
    justifyContent: "center",
    alignItems: "center",
  },
  initial: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  greeting: { flex: 1 },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  name: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderColor: colors.secondaryBorder,
    borderWidth: 2,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 7,
    right: 8,
    height: 9,
    width: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
});
