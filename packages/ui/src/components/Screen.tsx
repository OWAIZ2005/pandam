import { type ReactNode } from 'react';
import { RefreshControl, ScrollView, type StyleProp, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../tokens';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. */
  scroll?: boolean;
  /** Horizontal + vertical content padding. */
  padded?: boolean;
  edges?: readonly Edge[];
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Sticky footer (e.g. a primary CTA) rendered outside the scroll area. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * The page wrapper every screen uses. Applies the safe-area, an optional
 * scroll view, and — crucially on web — a centred max-width column so the
 * layout is not "the mobile UI, but stretched".
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  onRefresh,
  refreshing = false,
  footer,
  contentStyle,
}: ScreenProps) {
  const inner: StyleProp<ViewStyle> = [
    { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', flexGrow: 1 },
    padded && { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    contentStyle,
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={edges}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, alignItems: 'stretch' }}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
          }
        >
          <View style={inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
      {footer ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
          }}
        >
          <View style={{ width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' }}>
            {footer}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
