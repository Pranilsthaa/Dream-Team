import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/theme';
import { PlayerAvatar } from './PlayerAvatar';
import type { TPlayerItem, RoleKey } from '@/constants/squadRules';
import { AppText } from '@/components/common/AppText';

type Props = {
  item: TPlayerItem;
  index: number;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: (item: TPlayerItem) => void;
};

export const PlayerRow: React.FC<Props> = memo(
  ({ item, index, isSelected, isDisabled, onPress }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onPress(item)}
        disabled={isDisabled && !isSelected}
        style={[
          styles.row,
          index % 2 === 0 && styles.rowAlt,
          isSelected && styles.rowSelected,
          isDisabled && !isSelected && styles.rowDisabled,
        ]}
      >
        {/* Selected left accent bar */}
        {isSelected && (
          <View
            style={[
              styles.accentBar,
              { backgroundColor: Colors.role[item.role as RoleKey] },
            ]}
          />
        )}

        {/* Avatar */}
        <PlayerAvatar name={item.name} role={item.role as RoleKey} size={40} />

        {/* Name + meta */}
        <View style={styles.info}>
          <AppText style={styles.name} numberOfLines={1}>
            {item.name}
          </AppText>
          <View style={styles.metaRow}>
            <View style={styles.teamTag}>
              <AppText style={styles.teamCode}>{item.team.code}</AppText>
            </View>
            <AppText
              style={[
                styles.roleTag,
                { color: Colors.role[item.role as RoleKey] },
              ]}
            >
              {item.role}
            </AppText>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statCol}>
          <AppText style={styles.statValue}>{item.price.toFixed(1)}</AppText>
          <AppText style={styles.statLabel}>Cr</AppText>
        </View>

        {/* Add / Remove button */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            isSelected
              ? {
                  borderColor: Colors.danger,
                  backgroundColor: Colors.dangerDim,
                }
              : { borderColor: Colors.border2, backgroundColor: 'transparent' },
          ]}
          onPress={() => onPress(item)}
          disabled={isDisabled && !isSelected}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppText
            style={[
              styles.actionBtnText,
              { color: isSelected ? Colors.danger : Colors.muted2 },
            ]}
          >
            {isSelected ? '✕' : '+'}
          </AppText>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  },
  // Custom comparator — skip re-render if these two haven't changed
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.isDisabled === next.isDisabled &&
    prev.index === next.index,
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  rowAlt: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  rowSelected: {
    backgroundColor: 'rgba(0,229,160,0.05)',
  },
  rowDisabled: {
    opacity: 0.35,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  teamTag: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  teamCode: {
    color: Colors.muted2,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  roleTag: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statCol: {
    alignItems: 'center',
    minWidth: 44,
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: Colors.muted,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
});
