// src/components/PlayerSelect/PlayerAvatar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/theme';
import { AppText } from '@/components/common/AppText';
import { RoleKey } from '@/constants/squadRules';

type Props = {
  name: string;
  role: RoleKey;
  size?: number;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export const PlayerAvatar: React.FC<Props> = ({ name, role, size = 40 }) => {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: Radius.md,
          backgroundColor: Colors.roleDim[role],
          borderColor: Colors.roleBorder[role],
        },
      ]}
    >
      <AppText
        style={[
          styles.initials,
          { color: Colors.role[role], fontSize: size * 0.3 },
        ]}
      >
        {getInitials(name)}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
