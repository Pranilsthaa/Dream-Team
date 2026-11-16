import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { theme } from '@/constants/theme';

type Props = {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
};

export function ActionButton({ children, onPress, variant = 'primary', icon }: Props) {
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      pressRetentionOffset={16}
    >
      <Animated.View
        style={[
          styles.button,
          primary ? styles.primary : styles.secondary,
          {
            transform: [{ scale: pressed && !reducedMotion ? 0.97 : 1 }],
            opacity: pressed ? 0.85 : 1,
            transitionProperty: ['transform', 'opacity'],
            transitionDuration: reducedMotion ? 0 : theme.motion.pressDuration,
            transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
          },
        ]}
      >
        {icon}
        <Text style={[styles.label, primary ? styles.primaryLabel : styles.secondaryLabel]}>{children}</Text>
      </Animated.View>
    </Pressable>
  );
}

const { colors, fonts } = theme;
const styles = StyleSheet.create({
  button: { minHeight: 54, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderBottomWidth: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primary: { backgroundColor: colors.accent, borderColor: colors.border, borderBottomColor: colors.accentShadow },
  secondary: { backgroundColor: colors.secondary, borderColor: colors.secondaryBorder, borderBottomColor: colors.border },
  label: { textAlign: 'center', flexShrink: 1, fontSize: 22, fontFamily: fonts.display },
  primaryLabel: { color: colors.ink },
  secondaryLabel: { color: colors.text },
});
