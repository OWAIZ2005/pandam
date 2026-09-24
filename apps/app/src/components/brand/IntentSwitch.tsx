import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Text, colors, palette, radii, shadows, spacing, useMotionOK } from '@pandam/ui';

type Side = 'have' | 'need';

const COPY: Record<Side, { kicker: string; title: string; icon: keyof typeof Ionicons.glyphMap }> = {
  have: { kicker: 'I HAVE', title: 'What I can offer', icon: 'cube' },
  need: { kicker: 'I NEED', title: "What I'm looking for", icon: 'search' },
};

/**
 * I HAVE ⇄ I NEED as ONE connected control instead of two unrelated cards.
 *
 * Two halves meet at a seam, and the exchange token sits ON the seam — the
 * give/need relationship is the shape itself. Pressing a half dips it and
 * swings the token toward that side, so the choice feels physical; the tap
 * then opens the same create flow as before. Each half says in plain words
 * what it means, so nobody has to decode the metaphor.
 */
export function IntentSwitch({
  haveCount,
  needCount,
  onHave,
  onNeed,
}: {
  haveCount: number;
  needCount: number;
  onHave: () => void;
  onNeed: () => void;
}) {
  const motionOK = useMotionOK();
  const turn = useSharedValue(0); // -1 toward HAVE, 1 toward NEED
  const pressHave = useSharedValue(1);
  const pressNeed = useSharedValue(1);

  const token = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 180}deg` }, { scale: 1 + Math.abs(turn.get()) * 0.08 }],
  }));
  const haveStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressHave.get() }] }));
  const needStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressNeed.get() }] }));

  const spring = { damping: 16, stiffness: 320 };
  const onIn = (side: Side) => {
    if (!motionOK) return;
    turn.set(withSpring(side === 'have' ? -1 : 1, spring));
    (side === 'have' ? pressHave : pressNeed).set(withSpring(0.97, spring));
  };
  const onOut = (side: Side) => {
    if (!motionOK) return;
    turn.set(withSpring(0, { damping: 12, stiffness: 180 }));
    (side === 'have' ? pressHave : pressNeed).set(withSpring(1, spring));
  };

  const half = (side: Side, count: number, onPress: () => void) => {
    const c = COPY[side];
    const isHave = side === 'have';
    return (
      <Animated.View style={[{ flex: 1 }, isHave ? haveStyle : needStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${c.kicker}: ${c.title}. ${count} active.`}
          onPressIn={() => onIn(side)}
          onPressOut={() => onOut(side)}
          onPress={onPress}
          style={{
            flex: 1,
            minHeight: 148,
            backgroundColor: isHave ? colors.accent : colors.need,
            borderTopLeftRadius: isHave ? radii.lg : radii.xs,
            borderBottomLeftRadius: isHave ? radii.lg : radii.xs,
            borderTopRightRadius: isHave ? radii.xs : radii.lg,
            borderBottomRightRadius: isHave ? radii.xs : radii.lg,
            paddingVertical: spacing.lg,
            // Extra room on the seam side keeps text clear of the token.
            paddingLeft: isHave ? spacing.lg : spacing.xl + spacing.xs,
            paddingRight: isHave ? spacing.xl + spacing.xs : spacing.lg,
            justifyContent: 'space-between',
            alignItems: isHave ? 'flex-start' : 'flex-end',
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: radii.sm,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={c.icon} size={18} color={palette.white} />
          </View>
          <View style={{ gap: 2, alignItems: isHave ? 'flex-start' : 'flex-end' }}>
            <Text style={{ fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.82)' }}>
              {c.kicker}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 16,
                lineHeight: 20,
                fontWeight: '800',
                letterSpacing: -0.3,
                color: palette.white,
                textAlign: isHave ? 'left' : 'right',
              }}
            >
              {c.title}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radii.pill,
                backgroundColor: 'rgba(0,0,0,0.14)',
              }}
            >
              <Ionicons name="add" size={12} color={palette.white} />
              <Text style={{ fontSize: 11.5, lineHeight: 14, fontWeight: '700', color: palette.white }}>
                {count > 0 ? `${count} active` : 'Add first'}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={{ ...shadows.sm, borderRadius: radii.lg }}>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {half('have', haveCount, onHave)}
        {half('need', needCount, onNeed)}
      </View>
      {/* The exchange token sits on the seam, joining the two halves. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View
          style={[
            {
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 3,
              borderColor: colors.background,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.md,
            },
            token,
          ]}
        >
          <Ionicons name="swap-horizontal" size={20} color={colors.accent} />
        </Animated.View>
      </View>
    </View>
  );
}
