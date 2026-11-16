import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ActionButton } from '@/components/action-button';
import { HashLoader } from '@/components/hash-loader';
import { theme } from '@/constants/theme';
import { useLogoutMutation, useProfileQuery } from '@/features/auth/hooks';
import { useAuth } from '@/providers/auth-provider';

export function AccountScreen() {
  const { session } = useAuth();
  const profile = useProfileQuery();
  const logout = useLogoutMutation();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const requestInFlight = useRef(false);
  const user = profile.data ?? session.user;
  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" hidden={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>DREAM-TEAM</Text>
        <Text accessibilityRole="header" style={styles.heading}>You’re in,{'\n'}{user.username}.</Text>
        <Text style={styles.copy}>Your game. Your league. Your account.</Text>
        <View style={styles.card}>
          <Text style={styles.label}>MANAGER</Text>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.statusRow}>
            {profile.isFetching ? <HashLoader size={20} color={theme.colors.accent} accessible={false} /> : null}
            <Text accessibilityLiveRegion="polite" style={styles.copy}>{profile.isFetching ? 'Checking your profile…' : profile.isError ? 'Profile refresh unavailable' : 'Signed in'}</Text>
          </View>
        </View>
        {profile.error ? <>
          <Text accessibilityRole="alert" style={styles.error}>{profile.error.message}</Text>
          <ActionButton variant="secondary" disabled={busy} loading={profile.isFetching} onPress={() => { void profile.refetch(); }}>Retry profile</ActionButton>
        </> : null}
        <Text style={styles.copy}>League creation and invite codes are coming next. You can manage your sign-in here for now.</Text>
        {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
        <ActionButton variant="secondary" loading={busy} onPress={async () => {
          if (requestInFlight.current) return;
          requestInFlight.current = true;
          setBusy(true);
          setMessage('');
          try { await logout.mutateAsync(); }
          catch (error) { setMessage(error instanceof Error ? error.message : 'Could not sign out. Please try again.'); }
          finally { requestInFlight.current = false; logout.reset(); setBusy(false); }
        }}>{busy ? 'Signing out…' : 'Log out'}</ActionButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const { colors, fonts } = theme;
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24, maxWidth: theme.size.contentMaxWidth, width: '100%', alignSelf: 'center' },
  brand: { fontFamily: fonts.display, fontSize: 20, letterSpacing: 1, color: colors.accent },
  heading: { fontFamily: fonts.display, fontSize: 44, lineHeight: 46, color: colors.text },
  copy: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.textMuted },
  card: { backgroundColor: colors.surface, padding: 24, gap: 12, borderRadius: 14, borderColor: colors.border, borderWidth: 2, borderBottomWidth: 5 },
  label: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2, color: colors.accent },
  username: { fontFamily: fonts.display, fontSize: 30, color: colors.text },
  email: { fontFamily: fonts.body, fontSize: 17, color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  error: { fontFamily: fonts.label, fontSize: 14, lineHeight: 21, color: colors.warning },
});
