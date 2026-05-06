import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/theme';
import { ROLE_TABS, type RoleTab } from '@/theme';
import { AppText } from '@/components/common/AppText';
import type { RoleKey } from '@/constants/squadRules';

type Props = {
  active: RoleTab;
  roleCounts: Record<string, number>; // how many selected per role
  onChange: (role: RoleTab) => void;
};

export const RoleTabBar: React.FC<Props> = memo(
  ({ active, roleCounts, onChange }) => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        style={styles.wrapper}
      >
        {ROLE_TABS.map(role => {
          const isActive = role === active;
          const roleColor =
            role === 'ALL' ? Colors.muted2 : Colors.role[role as RoleKey];
          const count = role === 'ALL' ? undefined : roleCounts[role] ?? 0;

          return (
            <TouchableOpacity
              key={role}
              onPressIn={() => onChange(role)}
              activeOpacity={0.75}
              style={[
                styles.tab,
                isActive && {
                  borderColor: roleColor,
                  backgroundColor:
                    role === 'ALL'
                      ? 'rgba(255,255,255,0.08)'
                      : `${roleColor}22`,
                },
              ]}
            >
              <AppText
                style={[styles.tabText, isActive && { color: roleColor }]}
              >
                {role}
              </AppText>

              {/* Count badge — only for role tabs, not ALL */}
              {count !== undefined && (
                <View
                  style={[
                    styles.badge,
                    isActive
                      ? { backgroundColor: roleColor }
                      : { backgroundColor: Colors.border },
                  ]}
                >
                  <AppText
                    style={[
                      styles.badgeText,
                      { color: isActive ? Colors.bg : Colors.muted2 },
                    ]}
                  >
                    {count}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: {
    color: Colors.muted2,
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
