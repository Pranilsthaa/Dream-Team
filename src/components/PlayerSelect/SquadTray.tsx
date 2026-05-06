import React, { memo } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/theme';
import {
  SQUAD_RULES,
  isSquadComplete,
  getRoleCounts,
  getBudgetLeft,
  type TPlayerItem,
  type RoleKey,
} from '@/constants/squadRules';
import { AppText } from '../common/AppText';

type Props = {
  selected: TPlayerItem[];
  onConfirm: () => void;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export const SquadTray: React.FC<Props> = memo(({ selected, onConfirm }) => {
  const count = selected.length;
  const ready = isSquadComplete(selected);
  const rc = getRoleCounts(selected);
  const budLeft = getBudgetLeft(selected);
  const emptyCount = SQUAD_RULES.TOTAL_PLAYERS - count;

  return (
    <View style={styles.tray}>
      {/* Composition pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {(Object.keys(SQUAD_RULES.ROLE_LIMITS) as RoleKey[]).map(role => {
          const met = rc[role] >= SQUAD_RULES.ROLE_LIMITS[role].min;
          return (
            <View
              key={role}
              style={[
                styles.pill,
                met
                  ? {
                      borderColor: Colors.role[role],
                      backgroundColor: `${Colors.role[role]}18`,
                    }
                  : { borderColor: Colors.border },
              ]}
            >
              <View
                style={[
                  styles.pillDot,
                  { backgroundColor: met ? Colors.role[role] : Colors.muted },
                ]}
              />
              <AppText
                style={[
                  styles.pillText,
                  { color: met ? Colors.role[role] : Colors.muted },
                ]}
              >
                {rc[role]}/{SQUAD_RULES.ROLE_LIMITS[role].min} {role}
              </AppText>
            </View>
          );
        })}
      </ScrollView>

      {/* Slot chips row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotsRow}
      >
        {selected.map(p => (
          <View
            key={p.id}
            style={[
              styles.slot,
              styles.slotFilled,
              {
                backgroundColor: Colors.roleDim[p.role as RoleKey],
                borderColor: Colors.role[p.role as RoleKey],
              },
            ]}
          >
            <AppText
              style={[
                styles.slotText,
                { color: Colors.role[p.role as RoleKey] },
              ]}
            >
              {getInitials(p.name)}
            </AppText>
          </View>
        ))}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.slot} />
        ))}
      </ScrollView>

      {/* Confirm button */}
      <TouchableOpacity
        onPress={onConfirm}
        disabled={!ready}
        activeOpacity={0.85}
        style={[
          styles.confirmBtn,
          ready ? styles.confirmReady : styles.confirmDisabled,
        ]}
      >
        <AppText
          style={[styles.confirmText, !ready && { color: Colors.muted }]}
        >
          {ready
            ? 'CONFIRM SQUAD'
            : `${count} / ${SQUAD_RULES.TOTAL_PLAYERS} SELECTED`}
        </AppText>
        {ready && (
          <AppText style={styles.confirmSub}>
            Budget left: {budLeft.toFixed(1)} Cr
          </AppText>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  tray: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
  slot: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: {
    borderStyle: 'solid',
  },
  slotText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  confirmBtn: {
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  confirmReady: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmDisabled: {
    backgroundColor: Colors.surface2,
  },
  confirmText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  confirmSub: {
    color: `${Colors.bg}99`,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
