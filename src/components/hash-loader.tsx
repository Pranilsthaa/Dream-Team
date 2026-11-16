import { useMemo } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

export type HashLoaderProps = Omit<ViewProps, 'children'> & {
  loading?: boolean;
  color?: string;
  /** Diameter in React Native layout points. */
  size?: number;
  speedMultiplier?: number;
};

type BarProps = {
  size: number;
  color: string;
  duration: number;
  horizontal: boolean;
  direction: 1 | -1;
  reducedMotion: boolean;
};

function HashBar({ size, color, duration, horizontal, direction, reducedMotion }: BarProps) {
  const thickness = size / 5;
  const lateral = (size - thickness) / 2;
  const offset = lateral - thickness;
  const frames = useMemo(() => {
    function frame(length: number, travel: number): ViewStyle {
      const width = horizontal ? length : thickness;
      const height = horizontal ? thickness : length;

      return {
        width,
        height,
        left: (size - width) / 2 + direction * (horizontal ? travel : offset),
        top: (size - height) / 2 + direction * (horizontal ? -offset : travel),
      };
    }

    return {
      '0%': frame(thickness, lateral),
      '35%': frame(size, 0),
      '70%': frame(thickness, -lateral),
      '100%': frame(thickness, lateral),
    };
  }, [direction, horizontal, lateral, offset, size, thickness]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          borderRadius: thickness / 2,
          opacity: horizontal ? 0.75 : 1,
        },
        reducedMotion ? frames['35%'] : frames['0%'],
        {
          animationName: reducedMotion ? 'none' : frames,
          animationDuration: duration,
          animationTimingFunction: 'ease',
          animationIterationCount: 'infinite',
        },
      ]}
    />
  );
}

function HashLoaderAnimation({
  color = '#000000',
  size = 50,
  speedMultiplier = 1,
  style,
  accessibilityLabel = 'Loading',
  ...props
}: Omit<HashLoaderProps, 'loading'>) {
  const reducedMotion = useReducedMotion();
  const diameter = Number.isFinite(size) && size > 0 ? size : 50;
  const speed = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1;
  const duration = 2000 / speed;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      {...props}
      style={[{ width: diameter, height: diameter }, style]}
    >
      <View pointerEvents="none" style={[styles.rotated, { width: diameter, height: diameter }]}>
        <HashBar size={diameter} color={color} duration={duration} horizontal direction={1} reducedMotion={reducedMotion} />
        <HashBar size={diameter} color={color} duration={duration} horizontal direction={-1} reducedMotion={reducedMotion} />
        <HashBar size={diameter} color={color} duration={duration} horizontal={false} direction={1} reducedMotion={reducedMotion} />
        <HashBar size={diameter} color={color} duration={duration} horizontal={false} direction={-1} reducedMotion={reducedMotion} />
      </View>
    </View>
  );
}

export function HashLoader({ loading = true, ...props }: HashLoaderProps) {
  if (!loading) return null;
  return <HashLoaderAnimation {...props} />;
}

export default HashLoader;

const styles = StyleSheet.create({
  rotated: { transform: [{ rotate: '165deg' }] },
  bar: { position: 'absolute' },
});
