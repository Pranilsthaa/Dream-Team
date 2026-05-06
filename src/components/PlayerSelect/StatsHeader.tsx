// src/components/PlayerSelect/StatsHeader.tsx
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/theme';
import { getBudgetLeft, type TPlayerItem } from '@/constants/squadRules';
import { SQUAD_RULES } from '@/constants/squadRules';
import { AppText } from '../common/AppText';

type Props = {
  selected: TPlayerItem[];
};

export const StatsHeader: React.FC<Props> = memo(({ selected }) => {
  const budgetLeft = getBudgetLeft(selected);
  const count = selected.length;
  const isLow = budgetLeft < 10;

  return (
    <View style={styles.row}>
      <StatPill
        label="Budget left"
        value={`${budgetLeft.toFixed(1)} Cr`}
        valueColor={isLow ? Colors.warn : Colors.accent}
      />
      <StatPill
        label="Players"
        value={`${count} / ${SQUAD_RULES.TOTAL_PLAYERS}`}
        valueColor={Colors.text}
      />
      <StatPill
        label="Max/team"
        value={String(SQUAD_RULES.MAX_PER_TEAM)}
        valueColor={Colors.muted2}
      />
    </View>
  );
});

const StatPill = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) => (
  <View style={styles.pill}>
    <AppText style={styles.label}>{label}</AppText>
    <AppText style={[styles.value, { color: valueColor }]}>{value}</AppText>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pill: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  label: {
    color: Colors.muted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
