import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { type ColorValue, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, shadows, spacing, useMotionOK } from '@pandam/ui';

type IconName = keyof typeof Ionicons.glyphMap;

/** Height of the bar's own content; the device's bottom inset is added on top. */
const BAR_CONTENT_HEIGHT = 62;

/**
 * A tab icon.
 *
 * Active state is carried by three things at once — the glyph fills, the
 * label takes the accent colour, and a short rule appears above it. That
 * redundancy is deliberate: colour alone is not enough for a colourblind
 * reader, and filled-versus-outline alone is too subtle at 22px.
 *
 * The rule sits at the TOP of the tab, against the bar's own border, so it
 * reads as a marker on the edge of the bar rather than an underline floating
 * beneath the text.
 */
function TabIcon({
  name,
  focused,
  color,
}: {
  name: IconName;
  focused: boolean;
  color: ColorValue;
}) {
  const motionOK = useMotionOK();
  const on = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    on.set(
      motionOK ? withSpring(focused ? 1 : 0, { damping: 14, stiffness: 220 }) : focused ? 1 : 0,
    );
  }, [focused, motionOK, on]);

  // The pill springs open behind the glyph and the glyph rises a touch.
  const pill = useAnimatedStyle(() => ({
    opacity: on.get(),
    transform: [{ scaleX: 0.55 + on.get() * 0.45 }, { scaleY: 0.7 + on.get() * 0.3 }],
  }));
  const glyph = useAnimatedStyle(() => ({
    transform: [{ translateY: -on.get() * 2 }, { scale: 1 + on.get() * 0.06 }],
  }));

  return (
    <View
      style={{
        marginTop: spacing.sm,
        width: 52,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            inset: 0,
            borderRadius: radii.pill,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accentBorder,
          },
          pill,
        ]}
      />
      <Animated.View style={glyph}>
        <Ionicons
          name={focused ? name : (`${name}-outline` as IconName)}
          size={21}
          color={color as string}
        />
      </Animated.View>
    </View>
  );
}

/**
 * The centre action.
 *
 * Previously a raised gradient pill with a coloured halo — the single most
 * "generated" detail in the product. It is now a round terracotta button sitting
 * IN the bar with everything else: still unmistakably the primary action,
 * because it is the only filled thing down there, but no longer shouting over
 * the four navigation targets it sits between.
 */
function CreateTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
      {/*
        The same 2px + 8px spacer the other tabs use for their active rule.
        Without it this tab's glyph sits 10px higher than its four neighbours,
        which is small enough to look like a mistake rather than a choice.
      */}
      <View
        style={{
          marginTop: spacing.xs,
          width: 46,
          height: 46,
          borderRadius: radii.pill,
          backgroundColor: focused ? colors.accentStrong : colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: colors.surface,
          ...shadows.md,
        }}
      >
        <Ionicons name="add" size={24} color={colors.textInverse} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        // Docked to the bottom edge — no absolute positioning, no floating
        // gap. Setting an explicit `height` opts out of React Navigation's
        // automatic safe-area sizing, so the inset has to be added back by
        // hand: the bar is content-height PLUS the device's bottom inset,
        // with that inset as padding so labels sit above the home indicator
        // rather than behind it (0 on devices that don't have one).
        tabBarStyle: {
          height: BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: 0,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: colors.borderSoft,
          backgroundColor: colors.surface,
          // A faint warm shadow cast upward so the bar reads as a tray the
          // cream page slides beneath.
          elevation: 8,
          shadowColor: '#5A3A22',
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="compass" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          // No label: the filled square already reads as "add", and a fifth
          // label would crowd the four that carry navigation.
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <CreateTabIcon focused={focused} />,
          tabBarAccessibilityLabel: 'Add something',
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sparkles" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
