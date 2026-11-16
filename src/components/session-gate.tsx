import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { ActionButton } from './action-button';
import { HashLoader } from './hash-loader';

export function SessionGate() {
  const { controller, session } = useAuth();
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const restoring = session.status === 'restoring';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {restoring ? <HashLoader size={48} color={theme.colors.accent} /> : null}
        <Text accessibilityRole="header" style={styles.title}>{restoring ? 'Getting you back in.' : 'Let’s reconnect.'}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {restoring ? 'Restoring your sign-in…' : error || session.message}
        </Text>
        {!restoring ? <>
          <ActionButton onPress={() => { setError(''); void controller.restore(); }} disabled={clearing}>Try again</ActionButton>
          <ActionButton variant="secondary" loading={clearing} onPress={async () => {
            setClearing(true);
            try { await controller.clearSavedSignIn(); }
            catch { setError('Could not clear your saved sign-in. Please try again.'); }
            finally { setClearing(false); }
          }}>Clear saved sign-in</ActionButton>
        </> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: 24 },
  content: { width: '100%', maxWidth: theme.size.contentMaxWidth, alignSelf: 'center', gap: 20 },
  title: { fontFamily: theme.fonts.display, fontSize: 36, color: theme.colors.text },
  message: { fontFamily: theme.fonts.body, fontSize: 16, lineHeight: 23, color: theme.colors.textMuted },
});
