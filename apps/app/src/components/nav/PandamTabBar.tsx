import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type Tabs } from 'expo-router';
import { type ComponentProps, useEffect, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CountBadge, Text, colors, palette, useMotionOK } from '@pandam/ui';

import { demoMatches, demoQuery } from '@/dummy';
import { useMatches } from '@/lib/hooks/useMatches';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = keyof typeof Ionicons.glyphMap;

/** Content height of the floating bar; the safe-area inset is added as margin. */
export const TAB_BAR_HEIGHT = 68;
const CREATE = 'create';

const ICONS: Record<string, IconName> = {
  index: 'home',
  discover: 'compass',
  matches: 'sparkles',
  profile: 'person',
};
const LABELS: Record<string, string> = {
  index: 'Home',
  discover: 'Discover',
  matches: 'Matches',
  profile: 'Profile',
};

const SPRING = { damping: 17, stiffness: 210, mass: 0.8 };

function tap() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => undefined);
}

/* -------------------------------------------------------------------------- */

/** A navigation tab: icon + label, which pops on press and brightens when active. */
function TabItem({
  name,
  focused,
  badge,
  onPress,
  onLongPress,
}: {
  name: string;
  focused: boolean;
  badge?: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const motionOK = useMotionOK();
  const on = useSharedValue(focused ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    on.set(motionOK ? withSpring(focused ? 1 : 0, SPRING) : focused ? 1 : 0);
  }, [focused, motionOK, on]);

  const icon = useAnimatedStyle(() => ({
    transform: [{ translateY: -on.value * 1.5 }, { scale: pop.value }],
  }));
  const label = useAnimatedStyle(() => ({
    opacity: interpolate(on.value, [0, 1], [0.55, 1]),
  }));

  const press = () => {
    if (motionOK) {
      pop.set(withSequence(withTiming(0.82, { duration: 70 }), withSpring(1, { damping: 8, stiffness: 320 })));
    }
    tap();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={LABELS[name]}
      onPress={press}
      onLongPress={onLongPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: TAB_BAR_HEIGHT, gap: 3 }}
    >
      <Animated.View style={icon}>
        <Ionicons
          name={focused ? ICONS[name]! : (`${ICONS[name]}-outline` as IconName)}
          size={22}
          color={focused ? palette.white : 'rgba(255,253,249,0.62)'}
        />
        {badge ? (
          <CountBadge
            value={badge}
            color={colors.match}
            ringColor={colors.surfaceInverse}
            // Anchored from the LEFT at the icon's upper-right, so a wider "9+"
            // grows away from the glyph instead of back over it.
            style={{ position: 'absolute', top: -6, left: 13 }}
          />
        ) : null}
      </Animated.View>
      <Animated.View style={label}>
        <Text
          style={{
            fontSize: 10.5,
            fontWeight: focused ? '800' : '600',
            letterSpacing: 0.2,
            color: focused ? palette.white : 'rgba(255,253,249,0.62)',
          }}
        >
          {LABELS[name]}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** The raised centre action: a terracotta disc cut into the bar that turns into ✕ when open. */
function CreateButton({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const motionOK = useMotionOK();
  const on = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    on.set(motionOK ? withSpring(focused ? 1 : 0, { damping: 12, stiffness: 180 }) : focused ? 1 : 0);
  }, [focused, motionOK, on]);

  const disc = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }, { rotate: `${on.value * 135}deg` }],
  }));

  return (
    <View style={{ width: 72, alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add something"
        accessibilityState={{ selected: focused }}
        onPressIn={() => {
          if (motionOK) press.set(withSpring(0.88, { damping: 15, stiffness: 400 }));
        }}
        onPressOut={() => {
          if (motionOK) press.set(withSpring(1, { damping: 7, stiffness: 300 }));
        }}
        onPress={() => {
          if (Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          }
          onPress();
        }}
        hitSlop={8}
        style={{ marginTop: -26 }}
      >
        {/* The ring in the page colour makes the disc look cut into the bar. */}
        <View
          style={{
            width: 66,
            height: 66,
            borderRadius: 33,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            style={[
              {
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: palette.terracotta600,
                shadowOpacity: 0.45,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 10,
              },
              disc,
            ]}
          >
            <Ionicons name="add" size={30} color={palette.white} />
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * PANDAM's navigation: a floating espresso bar that hovers above the content,
 * with a terracotta pill that springs from tab to tab behind the active icon,
 * a raised create disc cut into the middle, a live match badge, and a haptic
 * tick on every change. Navigation behaviour is React Navigation's own
 * (`tabPress` event, `navigate`), so routes and deep links are unchanged.
 */
export function PandamTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const motionOK = useMotionOK();
  const matches = demoQuery(useMatches(), demoMatches);
  const matchCount = matches.data?.length ?? 0;

  const [rowW, setRowW] = useState(0);
  const routes = state.routes;
  const focusedName = routes[state.index]?.name;

  // Slot geometry: four equal tabs around a fixed-width centre slot.
  const createW = 72;
  const slotW = rowW > 0 ? (rowW - 8 - createW) / 4 : 0; // 8 = row padding
  const slotX = (name: string) => {
    const order = routes.map((r) => r.name).filter((n) => n !== CREATE);
    const i = order.indexOf(name);
    return i < 2 ? i * slotW : createW + i * slotW;
  };

  const pillX = useSharedValue(0);
  const pillOn = useSharedValue(0);
  useEffect(() => {
    if (!slotW || !focusedName) return;
    const onTab = focusedName !== CREATE;
    if (onTab) {
      const x = slotX(focusedName) + 6;
      pillX.set(motionOK && pillOn.value > 0 ? withSpring(x, SPRING) : x);
    }
    pillOn.set(motionOK ? withTiming(onTab ? 1 : 0, { duration: 160 }) : onTab ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedName, slotW, motionOK]);

  const pill = useAnimatedStyle(() => ({
    opacity: pillOn.value,
    transform: [{ translateX: pillX.value }, { scaleX: 0.8 + pillOn.value * 0.2 }],
  }));

  const go = (routeName: string, key: string, focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(routeName);
  };

  const maxW = Math.min(screenW - 24, 520);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, 12),
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: maxW,
          height: TAB_BAR_HEIGHT,
          borderRadius: 26,
          backgroundColor: colors.surfaceInverse,
          borderWidth: 1,
          borderColor: 'rgba(255,253,249,0.08)',
          shadowColor: '#1A120D',
          shadowOpacity: 0.32,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 18,
        }}
      >
        <View
          onLayout={(e) => setRowW(e.nativeEvent.layout.width)}
          style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 4 }}
        >
          {/* sliding active pill */}
          {slotW > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: 4,
                  top: 8,
                  width: slotW - 12,
                  height: TAB_BAR_HEIGHT - 18,
                  borderRadius: 18,
                  backgroundColor: colors.accent,
                },
                pill,
              ]}
            />
          ) : null}

          {routes.map((route) => {
            const focused = route.name === focusedName;
            if (route.name === CREATE) {
              return (
                <CreateButton
                  key={route.key}
                  focused={focused}
                  onPress={() => go(route.name, route.key, focused)}
                />
              );
            }
            if (!ICONS[route.name]) return null;
            return (
              <TabItem
                key={route.key}
                name={route.name}
                focused={focused}
                badge={route.name === 'matches' ? matchCount : undefined}
                onPress={() => go(route.name, route.key, focused)}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
