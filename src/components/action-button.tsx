import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cubicBezier,
  useReducedMotion,
} from "react-native-reanimated";

import { theme } from "@/constants/theme";
import { HashLoader } from "./hash-loader";

type Props = {
  children: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
};

export function ActionButton({
  children,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();
  const primary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
      style={styles.container}
    >
      <View
        pointerEvents="none"
        style={[
          styles.base,
          {
            backgroundColor: primary
              ? theme.colors.accentShadow
              : theme.colors.border,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.button,
          primary ? styles.primary : styles.secondary,
          disabled && !loading && styles.disabled,
          {
            transform: [
              { translateY: pressed && !disabled && !loading ? 4 : 0 },
            ],
            transitionProperty: "transform",
            transitionDuration: reducedMotion ? 0 : theme.motion.pressDuration,
            transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
          },
        ]}
      >
        {loading ? (
          <HashLoader
            size={22}
            color={primary ? theme.colors.ink : theme.colors.text}
            accessible={false}
          />
        ) : (
          icon
        )}
        <Text
          style={[
            styles.label,
            primary ? styles.primaryLabel : styles.secondaryLabel,
            disabled && !loading && styles.disabledLabel,
          ]}
        >
          {children}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const { colors, fonts } = theme;
const styles = StyleSheet.create({
  container: { paddingBottom: 5 },
  base: {
    position: "absolute",
    top: 3,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 12,
  },
  button: {
    minHeight: 51,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryBorder,
  },
  disabled: {
    backgroundColor: colors.surface,
    borderColor: colors.secondaryBorder,
  },
  disabledLabel: { color: colors.textMuted },
  label: {
    textAlign: "center",
    flexShrink: 1,
    fontSize: 22,
    fontFamily: fonts.display,
  },
  primaryLabel: { color: colors.ink },
  secondaryLabel: { color: colors.text },
});
