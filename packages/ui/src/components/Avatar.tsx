import { View } from 'react-native';

import { colors, radii } from '../tokens';

import { Text } from './Text';

export interface AvatarProps {
  name: string;
  size?: number;
  /** A future avatar image URL; falls back to initials when absent. */
  uri?: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * Circular avatar. Image rendering is intentionally not wired to a real upload
 * (R2 not provisioned) — `uri` is a hook for later; today it always shows
 * initials on a tinted disc.
 */
export function Avatar({ name, size = 40 }: AvatarProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.pill,
        backgroundColor: colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.accentStrong, fontWeight: '700', fontSize: size * 0.4 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
