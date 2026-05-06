import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const SkeletonPulse = ({ style }: { style: object }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]} />;
};

const MatchCardSkeleton = () => (
  <View style={styles.card}>
    {/* Match number */}
    <SkeletonPulse
      style={[
        styles.skeletonBlock,
        { width: 80, height: 12, alignSelf: 'center', marginBottom: 16 },
      ]}
    />

    <View style={styles.row}>
      {/* Team 1 */}
      <View style={styles.teamSkeleton}>
        <SkeletonPulse style={styles.logoSkeleton} />
        <SkeletonPulse
          style={[
            styles.skeletonBlock,
            { width: 56, height: 12, marginTop: 8 },
          ]}
        />
      </View>

      {/* VS badge */}
      <View style={styles.vsSkeleton}>
        <SkeletonPulse
          style={[
            styles.skeletonBlock,
            { width: 36, height: 36, borderRadius: 18 },
          ]}
        />
        <SkeletonPulse
          style={[
            styles.skeletonBlock,
            { width: 60, height: 10, marginTop: 6 },
          ]}
        />
      </View>

      {/* Team 2 */}
      <View style={styles.teamSkeleton}>
        <SkeletonPulse style={styles.logoSkeleton} />
        <SkeletonPulse
          style={[
            styles.skeletonBlock,
            { width: 56, height: 12, marginTop: 8 },
          ]}
        />
      </View>
    </View>

    {/* Status pill */}
    <SkeletonPulse
      style={[
        styles.skeletonBlock,
        {
          width: 90,
          height: 24,
          borderRadius: 12,
          alignSelf: 'center',
          marginTop: 16,
        },
      ]}
    />
  </View>
);

export const MatchesSkeletonLoader = ({ count = 4 }: { count?: number }) => (
  <View style={{ paddingHorizontal: 16 }}>
    {/* Date group header skeleton */}
    <SkeletonPulse
      style={[
        styles.skeletonBlock,
        { width: 80, height: 14, marginVertical: 16 },
      ]}
    />
    {Array.from({ length: count }).map((_, i) => (
      <MatchCardSkeleton key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  skeletonBlock: {
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSkeleton: {
    alignItems: 'center',
    flex: 1,
  },
  logoSkeleton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
  },
  vsSkeleton: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});
