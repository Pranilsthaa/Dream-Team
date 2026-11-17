import { useFonts } from "expo-font";
import { Stack } from "expo-router/stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SessionGate } from "@/components/session-gate";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { theme } from "@/constants/theme";
import { QueryProvider } from "@/providers/query-provider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BarlowMedium: require("@/assets/fonts/Barlow-Medium.ttf"),
    BarlowSemiBold: require("@/assets/fonts/Barlow-SemiBold.ttf"),
    BarlowCondensedExtraBoldItalic: require("@/assets/fonts/BarlowCondensed-ExtraBoldItalic.ttf"),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;
  if (error) throw error;

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryProvider>
            <AuthProvider>
              <StatusBar style="light" />
              <AuthNavigator />
            </AuthProvider>
          </QueryProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthNavigator() {
  const { session } = useAuth();
  if (session.status === 'restoring' || session.status === 'restore-error') return <SessionGate />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Protected guard={session.status === 'signed-out'} redirectTo="/home">
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={session.status === 'signed-in'} redirectTo="/">
        <Stack.Screen name="(main)" />
        <Stack.Screen name="account" />
      </Stack.Protected>
    </Stack>
  );
}
