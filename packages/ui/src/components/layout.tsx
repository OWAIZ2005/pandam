import { type ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import { colors, spacing, type SpacingToken } from '../tokens';

type Gap = SpacingToken | number;
const g = (v: Gap | undefined) => (typeof v === 'number' ? v : v ? spacing[v] : undefined);

export interface StackProps {
  children: ReactNode;
  gap?: Gap;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  style?: StyleProp<ViewStyle>;
}

/** Vertical flex container with a token gap. */
export function Stack({ children, gap = 'lg', align, justify, style }: StackProps) {
  return (
    <View style={[{ gap: g(gap), alignItems: align, justifyContent: justify }, style]}>
      {children}
    </View>
  );
}

/** Horizontal flex container with a token gap (wraps by default off). */
export function Row({ children, gap = 'sm', align = 'center', justify, style }: StackProps) {
  return (
    <View
      style={[
        { flexDirection: 'row', gap: g(gap), alignItems: align, justifyContent: justify },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height: 1, backgroundColor: colors.border, alignSelf: 'stretch' }, style]} />
  );
}
