import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Text, colors, radii, spacing, useMotionOK } from '@pandam/ui';

/**
 * The guided path above the create form. Purely a progress picture: the
 * terracotta fill springs forward as sections are completed, and each reached
 * stop fills in. It reads the form's state; it never drives it.
 */
export function GuideRail({ steps, done }: { steps: string[]; done: number }) {
  const motionOK = useMotionOK();
  const p = useSharedValue(0);
  const target = Math.min(1, done / Math.max(1, steps.length - 1));
  useEffect(() => {
    p.set(motionOK ? withSpring(target, { damping: 16, stiffness: 120 }) : target);
  }, [target, motionOK, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.get() * 100}%` }));

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
      }}
    >
      <View style={{ height: 22, justifyContent: 'center', marginHorizontal: 8 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.backgroundSecondary }} />
        <Animated.View
          style={[
            { position: 'absolute', height: 4, borderRadius: 2, backgroundColor: colors.accent },
            fill,
          ]}
        />
        <View
          style={{
            position: 'absolute',
            left: -8,
            right: -8,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          {steps.map((s, i) => {
            const reached = i <= done;
            return (
              <View
                key={s}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: reached ? colors.accent : colors.surface,
                  borderWidth: 2,
                  borderColor: reached ? colors.accent : colors.borderStrong,
                }}
              />
            );
          })}
        </View>
      </View>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}
      >
        {steps.map((s, i) => (
          <Text
            key={s}
            variant="caption"
            numberOfLines={2}
            style={{
              width: `${100 / steps.length}%`,
              textAlign: i === 0 ? 'left' : i === steps.length - 1 ? 'right' : 'center',
              fontWeight: i <= done ? '700' : '400',
              color: i <= done ? colors.accentText : colors.textMuted,
              fontSize: 11,
            }}
          >
            {s}
          </Text>
        ))}
      </View>
    </View>
  );
}
