import { BottomSheet, Host, RNHostView } from '@expo/ui';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { ActionButton } from '@/components/action-button';

export function ReferenceSheet({ open, onClose, title, description, children }: {
  open: boolean; onClose: () => void; title: string; description: string; children: ReactNode;
}) {
  return (
    <Host style={StyleSheet.absoluteFill} pointerEvents="box-none" colorScheme="dark" seedColor={theme.colors.accent}>
      <BottomSheet isPresented={open} onDismiss={onClose} containerColor={theme.colors.background} contentPadding={0}>
        <RNHostView matchContents={{ vertical: true }}>
          <View style={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {children}
            <ActionButton variant="secondary" onPress={onClose}>Close</ActionButton>
          </View>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}
const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28, gap: 16, width: '100%', backgroundColor: theme.colors.background },
  title: { fontFamily: theme.fonts.display, fontSize: 28, color: theme.colors.text },
  description: { fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 20, color: theme.colors.textMuted },
});
