import { TrueSheet } from "@lodev09/react-native-true-sheet";
import {
  useEffect,
  useEffectEvent,
  useRef,
  type ComponentRef,
  type ReactNode,
} from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { theme } from "@/constants/theme";
import { ActionButton } from "./action-button";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
};

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
}: Props) {
  const sheet = useRef<TrueSheet>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const requestedOpen = useRef(open);
  const presented = useRef(false);
  const transition = useRef(Promise.resolve());
  const handleError = useEffectEvent((error: unknown) => {
    presented.current = false;
    console.error("Bottom sheet transition failed", error);
    onClose();
  });

  useEffect(() => {
    requestedOpen.current = open;
    // Finish the current animation before applying the latest open state.
    transition.current = transition.current
      .then(async () => {
        const current = sheet.current;
        if (!current || requestedOpen.current === presented.current) return;
        presented.current = requestedOpen.current;
        if (presented.current) await current.present();
        else await current.dismiss();
      })
      .catch(handleError);
  }, [open]);

  return (
    <TrueSheet
      ref={sheet}
      detents={["auto", 1]}
      scrollableRef={scroll}
      backgroundColor={theme.colors.background}
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      cornerRadius={24}
      grabberOptions={{ color: theme.colors.textMuted }}
      onDidDismiss={() => {
        const dismissedByUser = presented.current;
        presented.current = false;
        if (dismissedByUser) onClose();
      }}
    >
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        {children}
        <ActionButton variant="secondary" onPress={onClose}>
          Close
        </ActionButton>
      </ScrollView>
    </TrueSheet>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28, gap: 16 },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.text,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
});
